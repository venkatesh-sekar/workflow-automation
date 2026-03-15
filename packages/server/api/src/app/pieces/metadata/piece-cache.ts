import { AppSystemProp } from '@flow/server-common'
import { FlowEnvironment, isNil, LocalesEnum, PieceType } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { system } from '../../helper/system/system'
import { PieceMetadataSchema } from './piece-metadata-entity'
import { filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadLocalPieces } from './utils'

export const PIECE_METADATA_REFRESH_CHANNEL = 'piece-metadata-refresh'

export enum PieceMetadataRefreshType {
    CREATE = 'CREATE',
    DELETE = 'DELETE',
    UPDATE_USAGE = 'UPDATE_USAGE',
}

export type PieceMetadataRefreshMessage =
    | { type: PieceMetadataRefreshType.CREATE, piece: PieceMetadataSchema }
    | { type: PieceMetadataRefreshType.DELETE, pieces: { name: string, version: string }[] }
    | { type: PieceMetadataRefreshType.UPDATE_USAGE, piece: { name: string, version: string, platformId?: string, projectUsage: number } }

let cache: LRU<unknown>
const environment = system.get<FlowEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === FlowEnvironment.TESTING

const CACHE_KEY = {
    list: (locale: LocalesEnum): string => `list:${locale}`,
    piece: (name: string, version: string): string => `piece:${name}:${version}`,
    registry: (): string => 'registry',
}

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
            cache = lru(cacheMaxSize)
            log.info('[pieceCache] Piece cache initialized, loading all pieces from local source')
        },

        async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
            const { platformId, locale = LocalesEnum.ENGLISH } = params
            const cacheKey = CACHE_KEY.list(locale)

            const pieces = await getCachedOrFetch(cacheKey, () => loadLocalPieces(log))

            const filteredPieces = pieces.filter((piece) =>
                filterPieceBasedOnType(platformId, piece),
            )
            return lastVersionOfEachPiece(filteredPieces)
        },

        async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
            const { pieceName, version } = params
            const cacheKey = CACHE_KEY.piece(pieceName, version)

            return getCachedOrFetch(cacheKey, async () => {
                const allPieces = await loadLocalPieces(log)
                const piece = allPieces.find(p => p.name === pieceName && p.version === version)
                return piece ?? null
            })
        },

        async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
            const { release, platformId } = params
            const cacheKey = CACHE_KEY.registry()

            const allPieces = await getCachedOrFetch(cacheKey, async () => {
                const pieces = await loadLocalPieces(log)
                return pieces.map(toRegistryEntry)
            })

            return allPieces
                .filter((piece) => filterPieceBasedOnType(platformId, piece))
                .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
        },
    }
}

function toRegistryEntry(piece: PieceMetadataSchema): PieceRegistryEntry {
    return {
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
        platformId: piece.platformId,
        pieceType: piece.pieceType,
    }
}

const inFlightQueries = new Map<string, Promise<unknown>>()

async function getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
): Promise<T> {
    if (isTestingEnvironment) {
        return fetchFn()
    }

    const cached = cache.get(cacheKey) as T | undefined
    if (!isNil(cached)) {
        return cached
    }

    const existingQuery = inFlightQueries.get(cacheKey) as Promise<T> | undefined
    if (!isNil(existingQuery)) {
        return existingQuery
    }

    const queryPromise = (async (): Promise<T> => {
        try {
            const result = await fetchFn()
            cache.set(cacheKey, result)
            return result
        }
        finally {
            inFlightQueries.delete(cacheKey)
        }
    })()

    inFlightQueries.set(cacheKey, queryPromise)

    return queryPromise
}

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type GetPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
}

type GetListParams = {
    platformId?: string
    locale?: LocalesEnum
}

type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}
