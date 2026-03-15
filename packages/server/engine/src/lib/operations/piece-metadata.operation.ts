import { PieceMetadata } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteExtractPieceMetadataOperation,
} from '@activepieces/shared'
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