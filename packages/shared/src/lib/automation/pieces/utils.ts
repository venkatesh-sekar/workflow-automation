import semverMajor from 'semver/functions/major'
import semverMinor from 'semver/functions/minor'
import semverMinVersion from 'semver/ranges/min-version'
import { assertNotNullOrUndefined } from '../../core/common'
import { FlowError, ErrorCode } from '../../core/common/flow-error'

/**
 * @param {string} pieceName - starts with `@flow/piece-`
 * @param {string} pieceVersion - the version of the piece
 * @returns {string} the package alias for the piece, e.g. `@flow/piece-slack-0.0.1`
 */
export const getPackageAliasForPiece = (params: GetPackageAliasForPieceParams): string => {
    const { pieceName, pieceVersion } = params
    return `${pieceName}-${pieceVersion}`
}

/**
 * @param {string} alias - e.g. piece-slack or @publisher/piece-slack or slack or @publisher/slack
 * @returns {string} the piece name, e.g. slack
 */
export const getPieceNameFromAlias = (alias: string): string => {
    const fullPieceName =  alias.startsWith('@') ? alias.split('/').pop() : alias
    assertNotNullOrUndefined(fullPieceName, 'Full piece name')
    if (fullPieceName.startsWith('piece-')) {
        return fullPieceName.split('-').slice(1).join('-')
    }
    return fullPieceName
}

/**
 * @param {string} alias - e.g. `@flow/piece-slack-0.0.1`
 * @returns {string} the piece name, e.g. `@flow/piece-slack`
 */
export const trimVersionFromAlias = (alias: string): string => {
    return alias.split('-').slice(0, -1).join('-')
}



export const extractPieceFromModule = <T>(params: ExtractPieceFromModuleParams): T => {
    const { module, pieceName, pieceVersion } = params
    const exports = Object.values(module)
    const constructors = []
    for (const e of exports) {
        if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
            return e as T
        }
        constructors.push(e?.constructor?.name)
    }

    throw new FlowError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
            entityType: 'piece',
            entityId: pieceName,
            message: `Failed to extract piece from module (version: ${pieceVersion}), found constructors: ${constructors.join(', ')}`,
            extra: { pieceName, pieceVersion },
        },
    })
}

export const getPieceMajorAndMinorVersion = (pieceVersion: string): string => {
    const minimumSemver = semverMinVersion(pieceVersion)
    return minimumSemver
        ? `${semverMajor(minimumSemver)}.${semverMinor(minimumSemver)}`
        : `${semverMajor(pieceVersion)}.${semverMinor(pieceVersion)}`
}

type GetPackageAliasForPieceParams = {
    pieceName: string
    pieceVersion: string
}

type ExtractPieceFromModuleParams = {
    module: Record<string, unknown>
    pieceName: string
    pieceVersion: string
}
