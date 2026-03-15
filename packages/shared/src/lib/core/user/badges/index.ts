import { z } from 'zod'
import { BaseModelSchema } from '../../common'

export const UserBadge = z.object({
    ...BaseModelSchema,
    name: z.string(),
    userId: z.string(),

})

export type UserBadge = z.infer<typeof UserBadge>

export const BADGES = {
    'first-build': {
        imageUrl: '',
        title: 'First Build',
        description: 'I had published my first flow and automation is officially real.',
    },
    'on-a-roll': {
        imageUrl: '',
        title: 'On a Roll',
        description: 'I have 5 active flows and I\'m getting the hang of this.',
    },
    'automation-addict': {
        imageUrl: '',
        title: 'Automation Addict',
        description: 'I have 10 active flows and I\'m basically an automation pro.',
    },
    'cant-stop': {
        imageUrl: '',
        title: 'Can\'t Stop',
        description: 'I have 50 active flows and automation just happens around me.',
    },
    'webhook-wizard': {
        imageUrl: '',
        title: 'Webhook Wizard',
        description: 'I used webhooks and my triggers are endless now.',
    },
    'agentic-genius': {
        imageUrl: '',
        title: 'Agentic Genius',
        description: 'I used AI and my automation just got smarter.',
    },
    'coding-chad': {
        imageUrl: '',
        title: 'Coding Chad',
        description: 'I used custom code and made my flow do tricks no one else can.',
    },
    'back-again': {
        imageUrl: '',
        title: 'Back Again',
        description: 'I tested a flow and it failed to run... but I learned something valuable.',
    },
    'victory': {
        imageUrl: '',
        title: 'Victory',
        description: 'I tested a flow and it ran successfully... the joy is real!',
    },
} as const
