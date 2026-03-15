import { flowId, FlowAction, FlowActionType, FlowOperationStatus, FlowStatus, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState, PopulatedFlow, PropertyExecutionType } from '@flow/shared'
import { faker } from '@faker-js/faker'


export const flowGenerator = {
    simpleActionAndTrigger(externalId?: string): PopulatedFlow {
        return flowGenerator.randomizeMetadata(externalId, flowVersionGenerator.simpleActionAndTrigger())
    },
    randomizeMetadata(externalId: string | undefined, version: Omit<FlowVersion, 'flowId'>): PopulatedFlow {
        const flowId = flowId()
        const result: PopulatedFlow = {
            externalId: externalId ?? flowId,
            version: {
                ...version,
                trigger: randomizeTriggerMetadata(version.trigger),
                flowId,
            },
            operationStatus: FlowOperationStatus.NONE,
            status: faker.helpers.enumValue(FlowStatus),
            id: flowId,
            projectId: flowId(),
            folderId: flowId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
        }
        return result
    },
}

const flowVersionGenerator = {
    simpleActionAndTrigger(): Omit<FlowVersion, 'flowId'> {
        return {
            id: flowId(),
            displayName: faker.animal.dog(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            updatedBy: flowId(),
            valid: true,
            trigger: {
                ...randomizeTriggerMetadata(generateTrigger()),
                nextAction: generateAction(),
            },
            state: FlowVersionState.DRAFT,
            connectionIds: [],
            agentIds: [],
            notes: [],
        }
    },
}

function randomizeTriggerMetadata(trigger: FlowTrigger): FlowTrigger {
    return {
        ...trigger,
        settings: {
            ...trigger.settings,
            propertySettings: {
                server: { type: PropertyExecutionType.MANUAL },
                port: { type: PropertyExecutionType.MANUAL },
                username: { type: PropertyExecutionType.DYNAMIC },
                password: { type: PropertyExecutionType.MANUAL },
            },
        },
    }
}
function generateAction(): FlowAction {
    return {
        type: FlowActionType.PIECE,
        displayName: faker.hacker.noun(),
        name: flowId(),
        skip: false,
        settings: {
            input: {},
            pieceName: faker.helpers.arrayElement(['@flow/piece-schedule', '@flow/piece-webhook']),
            pieceVersion: faker.system.semver(),
            actionName: faker.hacker.noun(),
            propertySettings: {},
        },
        valid: true,
    }
}

function generateTrigger(): FlowTrigger {
    return {
        type: FlowTriggerType.PIECE,
        displayName: faker.hacker.noun(),
        name: flowId(),
        settings: {
            pieceName: faker.helpers.arrayElement(['@flow/piece-schedule', '@flow/piece-webhook']),
            pieceVersion: faker.system.semver(),
            triggerName: faker.hacker.noun(),
            input: {},
            propertySettings: {},
        },
        valid: true,
    }
}