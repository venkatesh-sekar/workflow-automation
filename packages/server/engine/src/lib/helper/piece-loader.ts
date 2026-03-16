import { Action, Piece, PiecePropertyMap, Trigger } from '@flow/pieces-framework'
import { pieceRegistry } from '@flow/piece-registry'
import { FlowError, EngineGenericError, ErrorCode, isNil } from '@flow/shared'

export const pieceLoader = {
    loadPieceOrThrow: async (
        { pieceName, pieceVersion }: LoadPieceParams,
    ): Promise<Piece> => {
        const piece = pieceRegistry.get(pieceName)
        if (isNil(piece)) {
            throw new EngineGenericError('PieceNotFoundError', `Piece not found for piece: ${pieceName}, pieceVersion: ${pieceVersion}`)
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
            throw new FlowError({
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
            throw new FlowError({
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
            throw new FlowError({
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
