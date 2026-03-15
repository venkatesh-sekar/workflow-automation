import { FlowRun, FlowRunStatus } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'

const FAILURE_STATUSES: ReadonlySet<FlowRunStatus> = new Set([
    FlowRunStatus.FAILED,
    FlowRunStatus.INTERNAL_ERROR,
    FlowRunStatus.TIMEOUT,
    FlowRunStatus.QUOTA_EXCEEDED,
    FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
    FlowRunStatus.LOG_SIZE_EXCEEDED,
])

export type AlertHandler = {
    onFlowFailed(params: {
        flowId: string
        flowRunId: string
        projectId: string
        status: FlowRunStatus
        error: string | undefined
        timestamp: string
    }): void
}

function createStdoutAlertHandler(log: FastifyBaseLogger): AlertHandler {
    return {
        onFlowFailed({ flowId, flowRunId, projectId, status, error, timestamp }) {
            log.error({
                level: 'error',
                event: 'flow_failed',
                flowId,
                flowRunId,
                projectId,
                status,
                error: error ?? 'unknown',
                timestamp,
            })
        },
    }
}

export const alertService = (log: FastifyBaseLogger) => ({
    handleFlowRunFinish(flowRun: FlowRun): void {
        if (!FAILURE_STATUSES.has(flowRun.status)) {
            return
        }
        const handler = createStdoutAlertHandler(log)
        handler.onFlowFailed({
            flowId: flowRun.flowId,
            flowRunId: flowRun.id,
            projectId: flowRun.projectId,
            status: flowRun.status,
            error: flowRun.failedStep?.displayName ?? undefined,
            timestamp: new Date().toISOString(),
        })
    },
})
