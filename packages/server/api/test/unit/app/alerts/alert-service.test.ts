import { describe, it, expect, vi } from 'vitest'
import { FlowRunStatus, FlowRun, RunEnvironment } from '@activepieces/shared'
import { alertService } from '../../../../src/app/alerts/alert-service'
import { FastifyBaseLogger } from 'fastify'

function createMockLogger(): FastifyBaseLogger {
    return {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        child: vi.fn(),
        silent: vi.fn(),
        level: 'info',
    } as unknown as FastifyBaseLogger
}

function createFlowRun(overrides: Partial<FlowRun> = {}): FlowRun {
    return {
        id: 'run-1',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId: 'project-1',
        flowId: 'flow-1',
        flowVersionId: 'version-1',
        status: FlowRunStatus.SUCCEEDED,
        environment: RunEnvironment.PRODUCTION,
        logsFileId: null,
        failParentOnFailure: false,
        steps: {},
        archivedAt: null,
        ...overrides,
    } as FlowRun
}

describe('alertService', () => {
    describe('handleFlowRunFinish', () => {
        it('should log structured error on FAILED status', () => {
            const log = createMockLogger()
            const run = createFlowRun({
                status: FlowRunStatus.FAILED,
                failedStep: { name: 'step_1', displayName: 'Send Email' },
            })

            alertService(log).handleFlowRunFinish(run)

            expect(log.error).toHaveBeenCalledOnce()
            const loggedData = (log.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(loggedData).toMatchObject({
                level: 'error',
                event: 'flow_failed',
                flowId: 'flow-1',
                flowRunId: 'run-1',
                projectId: 'project-1',
                status: FlowRunStatus.FAILED,
                error: 'Send Email',
            })
            expect(loggedData.timestamp).toBeDefined()
        })

        it('should log structured error on INTERNAL_ERROR status', () => {
            const log = createMockLogger()
            const run = createFlowRun({ status: FlowRunStatus.INTERNAL_ERROR })

            alertService(log).handleFlowRunFinish(run)

            expect(log.error).toHaveBeenCalledOnce()
            const loggedData = (log.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(loggedData.status).toBe(FlowRunStatus.INTERNAL_ERROR)
            expect(loggedData.error).toBe('unknown')
        })

        it('should log structured error on TIMEOUT status', () => {
            const log = createMockLogger()
            const run = createFlowRun({ status: FlowRunStatus.TIMEOUT })

            alertService(log).handleFlowRunFinish(run)

            expect(log.error).toHaveBeenCalledOnce()
        })

        it('should NOT log on SUCCEEDED status', () => {
            const log = createMockLogger()
            const run = createFlowRun({ status: FlowRunStatus.SUCCEEDED })

            alertService(log).handleFlowRunFinish(run)

            expect(log.error).not.toHaveBeenCalled()
        })

        it('should NOT log on RUNNING status', () => {
            const log = createMockLogger()
            const run = createFlowRun({ status: FlowRunStatus.RUNNING })

            alertService(log).handleFlowRunFinish(run)

            expect(log.error).not.toHaveBeenCalled()
        })

        it('should use "unknown" when no failedStep is present', () => {
            const log = createMockLogger()
            const run = createFlowRun({
                status: FlowRunStatus.FAILED,
                failedStep: undefined,
            })

            alertService(log).handleFlowRunFinish(run)

            const loggedData = (log.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(loggedData.error).toBe('unknown')
        })
    })
})
