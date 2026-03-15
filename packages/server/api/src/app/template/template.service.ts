import { ActivepiecesError, apId, CreateTemplateRequestBody, ErrorCode, FlowVersionTemplate, isNil, ListTemplatesRequestQuery, SeekPage, spreadIfDefined, Template, TemplateStatus, TemplateType, UpdateTemplateRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, ArrayOverlap, Equal } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { templateValidator } from './template-validator'
import { TemplateEntity } from './template.entity'

const templateRepo = repoFactory<Template>(TemplateEntity)

export const templateService = (log: FastifyBaseLogger) => ({
    async getOne({ id }: GetParams): Promise<Template | null> {
        return templateRepo().findOneBy({ id })
    },
    async getOneOrThrow({ id }: GetParams): Promise<Template> {
        const template = await templateRepo().findOneBy({ id })
        if (isNil(template)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'template',
                    entityId: id,
                    message: `Template ${id} not found`,
                },
            })
        }
        return template
    },
    async create({ platformId, params }: CreateParams): Promise<Template> {
        const preparedTemplate = await templateValidator.validateAndPrepare({
            flows: params.flows,
            platformId,
            log,
        })

        const { flows, pieces } = preparedTemplate
        const { name, summary, description, tags, blogUrl, metadata, author, categories, scope } = params

        const newTags = tags ?? []

        const newTemplate: NewTemplate = {
            id: apId(),
            name,
            type: TemplateType.CUSTOM,
            summary,
            description,
            platformId,
            tags: newTags,
            blogUrl,
            metadata,
            author,
            categories,
            pieces,
            flows,
            scope,
            status: TemplateStatus.PUBLISHED,
        }
        return templateRepo().save(newTemplate)
    },

    async update({ id, params }: UpdateParams): Promise<Template> {
        const { name, summary, description, tags, blogUrl, metadata, categories, status } = params
        const template = await this.getOneOrThrow({ id })

        const newTags = tags ?? []

        let sanatizedFlows: FlowVersionTemplate[] | undefined = undefined
        let pieces: string[] | undefined = undefined
        if (!isNil(params.flows) && params.flows.length > 0) {
            const preparedTemplate = await templateValidator.validateAndPrepare({
                flows: params.flows,
                platformId: undefined,
                log,
            })
            sanatizedFlows = preparedTemplate.flows
            pieces = preparedTemplate.pieces
        }

        await templateRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('summary', summary),
            ...spreadIfDefined('description', description),
            ...spreadIfDefined('tags', tags),
            ...spreadIfDefined('blogUrl', blogUrl),
            ...spreadIfDefined('metadata', metadata),
            ...spreadIfDefined('categories', categories),
            ...spreadIfDefined('flows', sanatizedFlows),
            ...spreadIfDefined('pieces', pieces),
            ...spreadIfDefined('tags', newTags),
            ...spreadIfDefined('status', status),
        })
        return templateRepo().findOneByOrFail({ id })
    },

    async list({ platformId, pieces, tags, search, category }: ListParams): Promise<SeekPage<Template>> {
        const commonFilters: Record<string, unknown> = {}

        if (pieces) {
            commonFilters.pieces = ArrayOverlap(pieces)
        }
        if (category) {
            commonFilters.categories = ArrayContains([category])
        }
        commonFilters.type = Equal(TemplateType.CUSTOM)
        if (!isNil(platformId)) {
            commonFilters.platformId = Equal(platformId)
        }
        commonFilters.status = Equal(TemplateStatus.PUBLISHED)
        const queryBuilder = templateRepo()
            .createQueryBuilder('template')
            .where(commonFilters)

        if (tags && tags.length > 0) {
            queryBuilder.andWhere(
                '(SELECT array_agg(tag->>\'title\') FROM jsonb_array_elements(template.tags) tag) @> :tags::text[]',
                { tags },
            )
        }
        if (search) {
            queryBuilder.andWhere(
                '(template.name ILIKE :search OR template.summary ILIKE :search OR template.description ILIKE :search)',
                { search: `%${search}%` },
            )
        }

        const templates = await queryBuilder.getMany()
        return paginationHelper.createPage(templates, null)
    },

    async delete({ id }: DeleteParams): Promise<void> {
        await templateRepo().delete({ id })
    },
})

type GetParams = {
    id: string
}

type CreateParams = {
    platformId: string | undefined
    params: CreateTemplateRequestBody
}

type NewTemplate = Omit<Template, 'created' | 'updated'>

type ListParams = Omit<ListTemplatesRequestQuery, 'type'> & {
    platformId: string | null
}

type DeleteParams = {
    id: string
}

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}