import {
    FlowError,
    ErrorCode,
    ListTemplatesRequestQuery,
    SeekPage,
    Template,
} from '@flow/shared'

export const communityTemplates = {
    getOrThrow: async (id: string): Promise<Template> => {
        throw new FlowError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'template',
                entityId: id,
                message: `Template ${id} not found`,
            },
        })
    },
    getCategories: async (): Promise<string[]> => {
        return []
    },
    list: async (_request: ListTemplatesRequestQuery): Promise<SeekPage<Template>> => {
        return { data: [], next: null, previous: null }
    },
}
