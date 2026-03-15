import { z } from 'zod'
import { OptionalArrayFromQuery, OptionalBooleanFromQuery } from '../../../core/common/base-model'
import { FlowId } from '../../../core/common/id-generator'
import { FlowRunStatus } from '../execution/flow-execution'

export const ListFlowRunsRequestQuery = z.object({
    flowId: OptionalArrayFromQuery(FlowId),
    tags: OptionalArrayFromQuery(z.string()),
    status: OptionalArrayFromQuery(z.nativeEnum(FlowRunStatus)),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
    projectId: FlowId,
    failedStepName: z.string().optional(),
    flowRunIds: OptionalArrayFromQuery(FlowId),
    includeArchived: OptionalBooleanFromQuery,
})

export type ListFlowRunsRequestQuery = z.infer<typeof ListFlowRunsRequestQuery>
