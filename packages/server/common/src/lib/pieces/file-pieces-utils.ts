import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { sep } from 'path'
import { Piece, PieceMetadata } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import clearModule from 'clear-module'
import { FastifyBaseLogger } from 'fastify'

const SOURCE_PIECES_PATH = resolve(cwd(), 'packages', 'pieces')

export const filePiecesUtils = (log: FastifyBaseLogger) => ({

    getPackageNameFromFolderPath: async (folderPath: string): Promise<string> => {
        const packageJson = await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
        return packageJson.name
    },

    getPieceDependencies: async (folderPath: string): Promise<Record<string, string> | null> => {
        try {
            const packageJson =  await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
            if (!packageJson.dependencies) {
                return null
            }
            return packageJson.dependencies
        }
        catch (e) {
            return null
        }
    },

    findPiecePathByPackageName: async (packageName: string): Promise<string | null> => {
        const paths = await findAllPiecesFolder(SOURCE_PIECES_PATH)
        for (const path of paths) {
            try {
                const packageJsonName = await filePiecesUtils(log).getPackageNameFromFolderPath(path)
                if (packageJsonName === packageName) {
                    return path
                }
            }
            catch (e) {
                log.error({
                    name: 'findPiecePathByPackageName',
                    message: JSON.stringify(e),
                }, 'Error finding piece path by package name')
            }
        }
        return null
    },

    findSourcePiecePathByPieceName: async (pieceName: string): Promise<string | null> => {
        const piecesPath = await findAllPiecesFolder(SOURCE_PIECES_PATH)
        const piecePath = piecesPath.find((p) => p.endsWith(sep + pieceName))
        return piecePath ?? null
    },

    loadAllPiecesMetadata: async (): Promise<PieceMetadata[]> => {
        try {
            const paths = await findAllPiecesFolder(SOURCE_PIECES_PATH)
            const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
            return pieces.filter((p): p is PieceMetadata => p !== null)
        }
        catch (e) {
            const err = e as Error
            log.warn({ err }, '[filePieceMetadataService#loadAllPiecesMetadata] Failed to load pieces from folder')
            return []
        }
    },


    clearPieceModuleCache: (folderPath: string): void => {
        const indexPath = join(folderPath, 'src', 'index')
        const packageJsonPath = join(folderPath, 'package.json')
        clearModule(indexPath)
        clearModule(packageJsonPath)
    },
})

const findAllPiecesFolder = async (folderPath: string): Promise<string[]> => {
    const paths = []
    const files = await readdir(folderPath)

    const ignoredFiles = ['node_modules', 'dist', 'framework', 'common']
    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (
            fileStats.isDirectory() &&
            !ignoredFiles.includes(file)
        ) {
            paths.push(...(await findAllPiecesFolder(filePath)))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

const loadPieceFromFolder = async (
    folderPath: string,
): Promise<PieceMetadata | null> => {
    const indexPath = join(folderPath, 'src', 'index')
    const packageJsonPath = join(folderPath, 'package.json')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packageJsonPath)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(indexPath)
    const { name: pieceName, version: pieceVersion } = packageJson
    const piece = extractPieceFromModule<Piece>({
        module,
        pieceName,
        pieceVersion,
    })
    const originalMetadata = piece.metadata()
    const metadata: PieceMetadata = {
        ...originalMetadata,
        name: pieceName,
        version: pieceVersion,
        authors: piece.authors,
        directoryPath: folderPath,
    }

    return metadata
}