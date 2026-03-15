import { PieceMetadata } from '@activepieces/pieces-framework'
import { AppSystemProp, rejectedPromiseHandler, WorkerSystemProp } from '@activepieces/server-common'
import { ApEnvironment, AppConnectionWithoutSensitiveData, ApplicationEventName, AuthenticationEvent, ConnectionEvent, Flow, FlowCreatedEvent, FlowDeletedEvent, FlowRun, FlowRunEvent, FlowUpdatedEvent, Folder, FolderEvent, ProjectWithLimits, spreadIfDefined, Template, UserInvitation, UserWithMetaInformation } from '@activepieces/shared'
import swagger from '@fastify/swagger'
import { createAdapter } from '@socket.io/redis-adapter'
import { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import fastifySocketIO from 'fastify-socket'
import { Socket } from 'socket.io'
import { aiProviderService } from './ai/ai-provider-service'
import { aiProviderModule } from './ai/ai-provider.module'
import { auditEventModule } from './audit-event/audit-event.module'
import { platformAnalyticsModule } from './analytics/platform-analytics.module'
import { appConnectionModule } from './app-connection/app-connection.module'
import { authenticationModule } from './authentication/authentication.module'
import { rateLimitModule } from './core/security/rate-limit'
import { authenticationMiddleware } from './core/security/v2/authn/authentication-middleware'
import { authorizationMiddleware } from './core/security/v2/authz/authorization-middleware'
import { websocketService } from './core/websockets.service'
import { distributedLock, redisConnections } from './database/redis-connections'
import { fileModule } from './file/file.module'
import { flagModule } from './flags/flag.module'
import { flowBackgroundJobs } from './flows/flow/flow.jobs'
import { humanInputModule } from './flows/flow/human-input/human-input.module'
import { flowRunModule } from './flows/flow-run/flow-run-module'
import { flowModule } from './flows/flow.module'
import { folderModule } from './flows/folder/folder.module'
import { openapiModule } from './helper/openapi/openapi.module'
import { system } from './helper/system/system'
import { SystemJobName } from './helper/system-jobs/common'
import { systemJobHandlers } from './helper/system-jobs/job-handlers'
import { systemJobsSchedule } from './helper/system-jobs/system-job'
import { validateEnvPropsOnStartup } from './helper/system-validator'
import { mcpServerModule } from './mcp/mcp-module'
import { communityPiecesModule } from './pieces/community-piece-module'
import { pieceModule } from './pieces/metadata/piece-metadata-controller'
import { pieceMetadataService } from './pieces/metadata/piece-metadata-service'
import { pieceSyncService } from './pieces/piece-sync-service'
import { tagsModule } from './pieces/tags/tags-module'
import { platformModule } from './platform/platform.module'
import { projectModule } from './project/project-module'
import { storeEntryModule } from './store-entry/store-entry.module'
import { tablesModule } from './tables/tables.module'
import { templateModule } from './template/template.module'
import { appEventRoutingModule } from './trigger/app-event-routing/app-event-routing.module'
import { triggerModule } from './trigger/trigger.module'
import { userBadgeModule } from './user/badges/badge-module'
import { platformUserModule } from './user/platform/platform-user-module'
import { invitationModule } from './user-invitations/user-invitation.module'
import { webhookModule } from './webhooks/webhook-module'
import { engineResponseWatcher } from './workers/engine-response-watcher'
import { queueMetricsModule } from './workers/queue/metrics/queue-metrics.module'
import { migrateQueuesAndRunConsumers, workerModule } from './workers/worker-module'

export const setupApp = async (app: FastifyInstance): Promise<FastifyInstance> => {

    app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, async (_request: FastifyRequest, payload: unknown) => {
        return payload as Buffer
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await app.register(swagger as any, {
        hideUntagged: true,
        openapi: {
            servers: [
                {
                    url: 'https://cloud.activepieces.com/api',
                    description: 'Production Server',
                },
            ],
            components: {
                securitySchemes: {
                    apiKey: {
                        type: 'http',
                        description: 'Use your api key generated from the admin console',
                        scheme: 'bearer',
                    },
                },
                schemas: {
                    [ApplicationEventName.FLOW_CREATED]: FlowCreatedEvent,
                    [ApplicationEventName.FLOW_UPDATED]: FlowUpdatedEvent,
                    [ApplicationEventName.FLOW_DELETED]: FlowDeletedEvent,
                    [ApplicationEventName.CONNECTION_UPSERTED]: ConnectionEvent,
                    [ApplicationEventName.CONNECTION_DELETED]: ConnectionEvent,
                    [ApplicationEventName.FOLDER_CREATED]: FolderEvent,
                    [ApplicationEventName.FOLDER_UPDATED]: FolderEvent,
                    [ApplicationEventName.FOLDER_DELETED]: FolderEvent,
                    [ApplicationEventName.FLOW_RUN_STARTED]: FlowRunEvent,
                    [ApplicationEventName.FLOW_RUN_FINISHED]: FlowRunEvent,
                    [ApplicationEventName.USER_SIGNED_UP]: AuthenticationEvent,
                    [ApplicationEventName.USER_SIGNED_IN]: AuthenticationEvent,
                    [ApplicationEventName.USER_PASSWORD_RESET]: AuthenticationEvent,
                    [ApplicationEventName.USER_EMAIL_VERIFIED]: AuthenticationEvent,
                    'template': Template,
                    'folder': Folder,
                    'user': UserWithMetaInformation,
                    'user-invitation': UserInvitation,
                    project: ProjectWithLimits,
                    flow: Flow,
                    'flow-run': FlowRun,
                    'app-connection': AppConnectionWithoutSensitiveData,
                    piece: PieceMetadata,

                },
            },
            info: {
                title: 'Flow Documentation',
                version: '0.0.0',
            },
            externalDocs: {
                url: 'https://www.activepieces.com/docs',
                description: 'Find more info here',
            },
        },
    })


    await app.register(rateLimitModule)
    app.addHook('onResponse', async (request, reply) => {
        // eslint-disable-next-line
        reply.header('x-request-id', request.id)
    })
    app.addHook('onRequest', async (request, reply) => {
        const route = app.hasRoute({
            method: request.method as HTTPMethods,
            url: request.routeOptions.url!,
        })
        if (!route) {
            return reply.code(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Route not found',
            })
        }
    })

    app.addHook('preHandler', authenticationMiddleware)
    app.addHook('preHandler', authorizationMiddleware)

    await systemJobsSchedule(app.log).init()
    await app.register(fileModule)
    await app.register(flagModule)
    await app.register(storeEntryModule)
    await app.register(folderModule)
    await pieceSyncService(app.log).setup()
    await pieceMetadataService(app.log).setup()
    await app.register(pieceModule)
    await app.register(flowModule)
    await app.register(flowRunModule)
    await app.register(webhookModule)
    await app.register(appConnectionModule)
    await app.register(openapiModule)
    await app.register(appEventRoutingModule)
    await app.register(authenticationModule)
    await app.register(triggerModule)
    await app.register(platformModule)
    await app.register(humanInputModule)
    await app.register(tagsModule)
    await app.register(mcpServerModule)
    await app.register(platformUserModule)
    await app.register(invitationModule)
    await app.register(workerModule)
    await aiProviderService(app.log).setup()
    await app.register(aiProviderModule)
    await app.register(tablesModule)
    await app.register(templateModule)
    await app.register(auditEventModule)
    await app.register(userBadgeModule)
    await app.register(platformAnalyticsModule)
    await app.register(projectModule)
    await app.register(communityPiecesModule)
    await app.register(queueMetricsModule)
    systemJobHandlers.registerJobHandler(SystemJobName.DELETE_FLOW, (data) => flowBackgroundJobs(app.log).deleteFlowHandler(data))
    systemJobHandlers.registerJobHandler(SystemJobName.UPDATE_FLOW_STATUS, (data) => flowBackgroundJobs(app.log).updateStatusHandler(data))



    app.get(
        '/redirect',
        async (
            request: FastifyRequest<{ Querystring: { code: string } }>,
            reply,
        ) => {
            const params = {
                code: request.query.code,
            }
            if (!params.code) {
                return reply.send('The code is missing in url')
            }
            else {
                return reply
                    .type('text/html')
                    .send(
                        `<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(
                            params.code,
                        )}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`,
                    )
            }
        },
    )
    await app.register(fastifySocketIO, {
        cors: {
            origin: '*',
        },
        maxHttpBufferSize: 1e8,
        ...spreadIfDefined('adapter', await getAdapter()),
        transports: ['websocket'],
    })
    app.io.use((socket: Socket, next: (err?: Error) => void) => {
        websocketService
            .verifyPrincipal(socket)
            .then(() => next())
            .catch(() => next(new Error('Authentication error')))
    })

    app.io.on('connection', (socket: Socket) => rejectedPromiseHandler(websocketService.init(socket, app.log), app.log))
    app.io.on('disconnect', (socket: Socket) => rejectedPromiseHandler(websocketService.onDisconnect(socket), app.log))

    await validateEnvPropsOnStartup(app.log)

    app.addHook('onClose', async () => {
        app.log.info('Shutting down')
        await systemJobsSchedule(app.log).close()
        await redisConnections.destroy()
        await distributedLock(app.log).destroy()
        await engineResponseWatcher(app.log).shutdown()
    })

    return app
}



async function getAdapter() {
    const redisConnectionInstance = await redisConnections.useExisting()
    const sub = redisConnectionInstance.duplicate()
    const pub = redisConnectionInstance.duplicate()
    return createAdapter(pub, sub, {
        requestsTimeout: 30000,
    })
}


export async function appPostBoot(app: FastifyInstance): Promise<void> {

    const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL) ?? 'http://localhost:4200'
    app.log.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${frontendUrl}, as specified by the FRONTEND_URL variable.`)

    const environment = system.get(AppSystemProp.ENVIRONMENT)
    const pieces = process.env.FLOW_DEV_PIECES

    await migrateQueuesAndRunConsumers(app)
    app.log.info('Queues migrated and consumers run')
    if (environment === ApEnvironment.DEVELOPMENT) {
        app.log.warn(
            `[WARNING]: The application is running in ${environment} mode.`,
        )
        app.log.warn(
            `[WARNING]: This is only shows pieces specified in FLOW_DEV_PIECES ${pieces} environment variable.`,
        )
    }
}
