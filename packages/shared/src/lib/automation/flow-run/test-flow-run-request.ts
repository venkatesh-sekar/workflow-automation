import { z } from 'zod'
import { FlowId } from '../../core/common/id-generator'
import { FlowRunStatus } from './execution/flow-execution'
import { FlowRetryStrategy } from './flow-run'

export const TestFlowRunRequestBody = z.object({
    flowVersionId: FlowId,
})

export type TestFlowRunRequestBody = z.infer<typeof TestFlowRunRequestBody>

export const RetryFlowRequestBody = z.object({
    strategy: z.nativeEnum(FlowRetryStrategy),
    projectId: FlowId,
})

export type RetryFlowRequestBody = z.infer<typeof RetryFlowRequestBody>


export const BulkActionOnRunsRequestBody = z.object({
    projectId: FlowId,
    flowRunIds: z.array(FlowId).optional(),
    excludeFlowRunIds: z.array(FlowId).optional(),
    strategy: z.nativeEnum(FlowRetryStrategy),
    status: z.array(z.nativeEnum(FlowRunStatus)).optional(),
    flowId: z.array(FlowId).optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
    failedStepName: z.string().optional(),
})

export type BulkActionOnRunsRequestBody = z.infer<typeof BulkActionOnRunsRequestBody>

export const BulkCancelFlowRequestBody = z.object({
    projectId: FlowId,
    flowRunIds: z.array(FlowId).optional(),
    excludeFlowRunIds: z.array(FlowId).optional(),
    status: z.array(z.union([
        z.literal(FlowRunStatus.PAUSED),
        z.literal(FlowRunStatus.QUEUED),
    ])).optional(),
    flowId: z.array(FlowId).optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
})

export type BulkCancelFlowRequestBody = z.infer<typeof BulkCancelFlowRequestBody>

export const BulkArchiveActionOnRunsRequestBody = z.object({
    projectId: FlowId,
    flowRunIds: z.array(FlowId).optional(),
    excludeFlowRunIds: z.array(FlowId).optional(),
    status: z.array(z.nativeEnum(FlowRunStatus)).optional(),
    flowId: z.array(FlowId).optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
    failedStepName: z.string().optional(),
})

export type BulkArchiveActionOnRunsRequestBody = z.infer<typeof BulkArchiveActionOnRunsRequestBody>
