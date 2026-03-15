import { apId, SeekPage } from '@flow/shared'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { AuditEventEntity, AuditEventSchema } from './audit-event.entity'

const auditEventRepo = repoFactory<AuditEventSchema>(AuditEventEntity)

export const auditEventService = {
    async create(params: {
        projectId: string
        userId: string
        event: string
        data: Record<string, unknown>
    }): Promise<AuditEventSchema> {
        const auditEvent = {
            id: apId(),
            projectId: params.projectId,
            userId: params.userId,
            event: params.event,
            data: params.data,
        }
        return auditEventRepo().save(auditEvent)
    },

    async list(params: {
        projectId: string
        limit?: number
    }): Promise<SeekPage<AuditEventSchema>> {
        const events = await auditEventRepo().find({
            where: { projectId: params.projectId },
            order: { created: 'DESC' },
            take: params.limit ?? 50,
        })
        return paginationHelper.createPage(events, null)
    },
}
