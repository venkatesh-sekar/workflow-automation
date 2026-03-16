import { PieceMetadata } from '@flow/pieces-framework'
import { pieceRegistry } from '@flow/piece-registry'
import { FastifyBaseLogger } from 'fastify'

export const filePiecesUtils = (_log: FastifyBaseLogger) => ({

    loadAllPiecesMetadata: async (): Promise<PieceMetadata[]> => {
        return Array.from(pieceRegistry.values()).map(piece => piece.metadata())
    },
})
