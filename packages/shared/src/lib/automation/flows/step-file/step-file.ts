import { z } from 'zod'
import { FlowMultipartFile } from '../../../core/common'

export const StepFileUpsertRequest = z.object({
    flowId: z.string(),
    stepName: z.string(),
    file: FlowMultipartFile.pick({ data: true }).optional(),
    contentLength: z.coerce.number().int().nonnegative(),
    fileName: z.string(),
})

export type StepFileUpsert = z.infer<typeof StepFileUpsertRequest>

export const StepFileUpsertResponse = z.object({
    uploadUrl: z.string().optional(),
    url: z.string(),
})

export type StepFileUpsertResponse = z.infer<typeof StepFileUpsertResponse>
