import { z } from 'zod'
import { FlowId } from '../../core/common/id-generator'

export enum TriggerTestStrategy {
    SIMULATION = 'SIMULATION',
    TEST_FUNCTION = 'TEST_FUNCTION',
}

export const TestTriggerRequestBody = z.object({
    projectId: FlowId,
    flowId: FlowId,
    flowVersionId: FlowId,
    testStrategy: z.nativeEnum(TriggerTestStrategy),
})

export type TestTriggerRequestBody = z.infer<typeof TestTriggerRequestBody>


export const CancelTestTriggerRequestBody = z.object({
    projectId: FlowId,
    flowId: FlowId,
})

export type CancelTestTriggerRequestBody = z.infer<typeof CancelTestTriggerRequestBody>
