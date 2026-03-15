import fs from 'fs/promises'
import path from 'path'
import { Action, Piece, PiecePropertyMap, Trigger } from '@activepieces/pieces-framework'
import { ActivepiecesError, EngineGenericError, ErrorCode, extractPieceFromModule, isNil, trimVersionFromAlias } from '@activepieces/shared'
import { utils } from '../utils'

export const pieceLoader = {
    loadPieceOrThrow: async (
        { pieceName, pieceVersion }: LoadPieceParams,
    ): Promise<Piece> => {
        const { data: piece, error: pieceError } = await utils.tryCatchAndThrowOnEngineError(async () => {
            const piecePath = await pieceLoader.getPiecePath({ packageName: pieceName })
            const module = await import(piecePath)

            const piece = extractPieceFromModule<Piece>({
                module,
                pieceName,
                pieceVersion,
            })

            if (isNil(piece)) {
                throw new EngineGenericError('PieceNotFoundError', `Piece not found for piece: ${pieceName}, pieceVersion: ${pieceVersion}`)
            }
            return piece
        })
        if (pieceError) {
            throw pieceError
        }
        return piece
    },

    getPieceAndTriggerOrThrow: async (params: GetPieceAndTriggerParams): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
        const { pieceName, pieceVersion, triggerName } = params
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion })
        const trigger = piece.getTrigger(triggerName)

        if (trigger === undefined) {
            throw new EngineGenericError('TriggerNotFoundError', `Trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
        }

        return {
            piece,
            pieceTrigger: trigger,
        }
    },

    getPieceAndActionOrThrow: async (params: GetPieceAndActionParams): Promise<{ piece: Piece, pieceAction: Action }> => {
        const { pieceName, pieceVersion, actionName } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion })
        const pieceAction = piece.getAction(actionName)

        if (isNil(pieceAction)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'step',
                    entityId: actionName,
                    message: `Action not found for piece ${pieceName}@${pieceVersion}`,
                    extra: { pieceName, pieceVersion },
                },
            })
        }

        return {
            piece,
            pieceAction,
        }
    },

    getPropOrThrow: async ({ pieceName, pieceVersion, actionOrTriggerName, propertyName }: GetPropParams) => {
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion })

        const actionOrTrigger = piece.getAction(actionOrTriggerName) ?? piece.getTrigger(actionOrTriggerName)

        if (isNil(actionOrTrigger)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'step',
                    entityId: actionOrTriggerName,
                    message: `Step not found for piece ${pieceName}@${pieceVersion}`,
                    extra: { pieceName, pieceVersion },
                },
            })
        }

        const property = (actionOrTrigger.props as PiecePropertyMap)[propertyName]

        if (isNil(property)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'config',
                    entityId: propertyName,
                    message: `Config not found for step ${actionOrTriggerName} in piece ${pieceName}@${pieceVersion}`,
                    extra: { pieceName, pieceVersion, stepName: actionOrTriggerName },
                },
            })
        }

        return { property, piece }
    },

    getPackageAlias: ({ pieceName }: { pieceName: string }) => {
        return pieceName
    },

    getPiecePath: async ({ packageName }: { packageName: string }): Promise<string> => {
        const sourcePiecesPath = path.resolve('packages/pieces')
        const piecePath = await utils.folderExists(sourcePiecesPath)
            ? await findInSourceFolder(packageName)
            : await traverseAllParentFoldersToFindPiece(packageName)
        if (isNil(piecePath)) {
            throw new EngineGenericError('PieceNotFoundError', `Piece not found for package: ${packageName}`)
        }
        return piecePath
    },
}

async function findInSourceFolder(packageName: string): Promise<string | null> {
    const sourcePiecesPath = path.resolve('packages/pieces')
    const packageJsonPaths = await findPiecePackageJsonFiles(sourcePiecesPath)
    for (const packageJsonPath of packageJsonPaths) {
        const { data: result } = await utils.tryCatchAndThrowOnEngineError(async () => {
            const content = await fs.readFile(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(content)
            if (packageJson.name === packageName) {
                return path.join(path.dirname(packageJsonPath), 'src', 'index.ts')
            }
            return null
        })
        if (result) {
            return result
        }
    }
    return null
}

async function findPiecePackageJsonFiles(dirPath: string): Promise<string[]> {
    const results: string[] = []
    const ignoredDirs = ['node_modules', '.turbo', 'dist', 'framework', 'common']

    async function scanDir(currentPath: string): Promise<void> {
        const items = await fs.readdir(currentPath, { withFileTypes: true })
        for (const item of items) {
            if (!item.isDirectory() || ignoredDirs.includes(item.name)) {
                continue
            }
            const fullPath = path.join(currentPath, item.name)
            await scanDir(fullPath)
        }
        const pkgJson = path.join(currentPath, 'package.json')
        if (currentPath !== dirPath && await utils.folderExists(pkgJson)) {
            results.push(pkgJson)
        }
    }

    await scanDir(dirPath)
    return results
}


async function traverseAllParentFoldersToFindPiece(packageName: string): Promise<string | null> {
    const rootDir = path.parse(__dirname).root
    let currentDir = __dirname
    const maxIterations = currentDir.split(path.sep).length
    for (let i = 0; i < maxIterations; i++) {
        const piecePath = path.resolve(currentDir, 'pieces', packageName, 'node_modules', trimVersionFromAlias(packageName))

        if (await utils.folderExists(piecePath)) {
            return path.join(piecePath, 'src', 'index.js')
        }

        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir || currentDir === rootDir) {
            break
        }
        currentDir = parentDir
    }
    return null
}

type LoadPieceParams = {
    pieceName: string
    pieceVersion: string
}

type GetPieceAndTriggerParams = {
    pieceName: string
    pieceVersion: string
    triggerName: string
}

type GetPieceAndActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
}

type GetPropParams = {
    pieceName: string
    pieceVersion: string
    actionOrTriggerName: string
    propertyName: string
}
