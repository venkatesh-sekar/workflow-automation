import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
} from '@activepieces/shared'
import { pieceHelper } from '../helper/piece-helper'

export const authValidationOperation = {
    execute: async (operation: ExecuteValidateAuthOperation): Promise<EngineResponse<ExecuteValidateAuthResponse>> => {
        const input = operation as ExecuteValidateAuthOperation
        const output = await pieceHelper.executeValidateAuth({
            params: input,
        })

        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}