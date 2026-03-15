import { z } from 'zod'
import { FlowId } from '../../core/common/id-generator'

export const WebhookUrlParams = z.object({
    flowId: FlowId,
})

export type WebhookUrlParams = z.infer<typeof WebhookUrlParams>
