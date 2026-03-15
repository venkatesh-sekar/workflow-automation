import { PieceMetadata } from '@flow/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteExtractPieceMetadataOperation,
} from '@flow/shared'
import { pieceHelper } from '../helper/piece-helper'


export const pieceMetadataOperation = {
    extract: async (operation: ExecuteExtractPieceMetadataOperation): Promise<EngineResponse<PieceMetadata>>  => {
        const input = operation as ExecuteExtractPieceMetadataOperation
        const output = await pieceHelper.extractPieceMetadata({
            params: input,
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}