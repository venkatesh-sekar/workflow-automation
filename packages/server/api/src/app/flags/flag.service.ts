import { FlowSystemProp, apVersionUtil, webhookSecretsUtils } from '@flow/server-common'
import { FlowEdition, FlowFlagId, ExecutionMode, Flag, isNil } from '@flow/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { domainHelper } from '../helper/domain-helper'
import { system } from '../helper/system/system'
import { FlagEntity } from './flag.entity'
import { defaultTheme } from './theme'

const flagRepo = repoFactory(FlagEntity)

export const flagService = (log: FastifyBaseLogger) => ({
    save: async (flag: FlagType): Promise<Flag> => {
        return flagRepo().save({
            id: flag.id,
            value: flag.value,
        })
    },
    async getOne(flagId: FlowFlagId): Promise<Flag | null> {
        return flagRepo().findOneBy({ id: flagId })
    },
    async getAll(): Promise<Flag[]> {
        const flags = await flagRepo().findBy({
            id: In([
                FlowFlagId.SHOW_POWERED_BY_IN_FORM,
                FlowFlagId.CLOUD_AUTH_ENABLED,
                FlowFlagId.CURRENT_VERSION,
                FlowFlagId.EDITION,
                FlowFlagId.EMAIL_AUTH_ENABLED,
                FlowFlagId.EXECUTION_DATA_RETENTION_DAYS,
                FlowFlagId.ENVIRONMENT,
                FlowFlagId.PUBLIC_URL,
                FlowFlagId.LATEST_VERSION,
                FlowFlagId.PRIVACY_POLICY_URL,
                FlowFlagId.PRIVATE_PIECES_ENABLED,
                FlowFlagId.FLOW_RUN_TIME_SECONDS,
                FlowFlagId.SHOW_COMMUNITY,
                FlowFlagId.SUPPORTED_APP_WEBHOOKS,
                FlowFlagId.TELEMETRY_ENABLED,
                FlowFlagId.TEMPLATES_PROJECT_ID,
                FlowFlagId.TERMS_OF_SERVICE_URL,
                FlowFlagId.THEME,
                FlowFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
                FlowFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
                FlowFlagId.SAML_AUTH_ACS_URL,
                FlowFlagId.USER_CREATED,
                FlowFlagId.WEBHOOK_URL_PREFIX,
                FlowFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
                FlowFlagId.MAX_FIELDS_PER_TABLE,
                FlowFlagId.MAX_RECORDS_PER_TABLE,
                FlowFlagId.MAX_FILE_SIZE_MB,
                FlowFlagId.TEMPLATES_CATEGORIES,
            ]),
        })
        const now = dayjs().toISOString()
        const created = now
        const updated = now
        const currentVersion = await apVersionUtil.getCurrentRelease()
        const latestVersion = await apVersionUtil.getLatestRelease()
        flags.push(
            {
                id: FlowFlagId.ENVIRONMENT,
                value: system.get(FlowSystemProp.ENVIRONMENT),
                created,
                updated,
            },
            {
                id: FlowFlagId.AGENTS_CONFIGURED,
                // TODO (@abuaboud): add new check
                value: true,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_ALERTS,
                value: system.getEdition() !== FlowEdition.COMMUNITY,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_PROJECT_MEMBERS,
                value: system.getEdition() !== FlowEdition.COMMUNITY,
                created,
                updated,
            },
            {
                id: FlowFlagId.CAN_CONFIGURE_AI_PROVIDER,
                value: true,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_BADGES,
                value: true,
                created,
                updated,
            },
            {
                id: FlowFlagId.CAN_BUY_ACTIVE_FLOWS,
                value: system.getEdition() === FlowEdition.CLOUD,
                created,
                updated,
            },
            {
                id: FlowFlagId.CAN_BUY_AI_CREDITS,
                value: false,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_BILLING_LIMITS_ON_SIDEBAR,
                value: system.getEdition() === FlowEdition.CLOUD,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_BILLING_PAGE,
                value: system.getEdition() === FlowEdition.CLOUD,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_POWERED_BY_IN_FORM,
                value: true,
                created,
                updated,
            },
            {
                id: FlowFlagId.ENABLE_FLOW_ON_PUBLISH,
                value: system.getBoolean(FlowSystemProp.ENABLE_FLOW_ON_PUBLISH) ?? true,
                created,
                updated,
            },
            {
                id: FlowFlagId.EXECUTION_DATA_RETENTION_DAYS,
                value: system.getNumber(FlowSystemProp.EXECUTION_DATA_RETENTION_DAYS),
                created,
                updated,
            },
            {
                id: FlowFlagId.CLOUD_AUTH_ENABLED,
                value: system.getBoolean(FlowSystemProp.CLOUD_AUTH_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: FlowFlagId.EDITION,
                value: system.getEdition(),
                created,
                updated,
            },
            {
                id: FlowFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
                value: {},
                created,
                updated,
            },
            {
                id: FlowFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
                value: '',
                created,
                updated,
            },
            {
                id: FlowFlagId.EMAIL_AUTH_ENABLED,
                value: true,
                created,
                updated,
            },
            {
                id: FlowFlagId.THEME,
                value: defaultTheme,
                created,
                updated,
            },
            {
                id: FlowFlagId.SHOW_COMMUNITY,
                value: system.getEdition() !== FlowEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: FlowFlagId.PRIVATE_PIECES_ENABLED,
                value: system.getEdition() !== FlowEdition.COMMUNITY,
                created,
                updated,
            },
            {
                id: FlowFlagId.PRIVACY_POLICY_URL,
                value: 'https://www.activepieces.com/privacy',
                created,
                updated,
            },
            {
                id: FlowFlagId.TERMS_OF_SERVICE_URL,
                value: 'https://www.activepieces.com/terms',
                created,
                updated,
            },
            {
                id: FlowFlagId.TELEMETRY_ENABLED,
                value: system.getBoolean(FlowSystemProp.TELEMETRY_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: FlowFlagId.PUBLIC_URL,
                value: await domainHelper.getPublicUrl({
                    path: '',
                }),
                created,
                updated,
            },
            {
                id: FlowFlagId.FLOW_RUN_TIME_SECONDS,
                value: system.getNumberOrThrow(FlowSystemProp.FLOW_TIMEOUT_SECONDS),
                created,
                updated,
            },
            {
                id: FlowFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
                value: system.getNumber(FlowSystemProp.SANDBOX_MEMORY_LIMIT),
                created,
                updated,
            },
            {
                id: FlowFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
                value: system.getNumber(FlowSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                created,
                updated,
            },
            {
                id: FlowFlagId.WEBHOOK_TIMEOUT_SECONDS,
                value: system.getNumber(FlowSystemProp.WEBHOOK_TIMEOUT_SECONDS),
                created,
                updated,
            },
            {
                id: FlowFlagId.CURRENT_VERSION,
                value: currentVersion,
                created,
                updated,
            },
            {
                id: FlowFlagId.LATEST_VERSION,
                value: latestVersion,
                created,
                updated,
            },
            {
                id: FlowFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
                value: system.get(FlowSystemProp.EXECUTION_MODE) !== ExecutionMode.SANDBOX_CODE_ONLY,
                created,
                updated,
            },
            {
                id: FlowFlagId.MAX_RECORDS_PER_TABLE,
                value: system.getNumber(FlowSystemProp.MAX_RECORDS_PER_TABLE),
                created,
                updated,
            },
            {
                id: FlowFlagId.MAX_FIELDS_PER_TABLE,
                value: system.getNumber(FlowSystemProp.MAX_FIELDS_PER_TABLE),
                created,
                updated,
            },
            {
                id: FlowFlagId.MAX_FILE_SIZE_MB,
                value: system.getNumber(FlowSystemProp.MAX_FILE_SIZE_MB),
                created,
                updated,
            },
        )

        if (system.isApp()) {
            flags.push(
                {
                    id: FlowFlagId.WEBHOOK_URL_PREFIX,
                    value: await domainHelper.getPublicApiUrl({
                        path: 'v1/webhooks',
                    }),
                    created,
                    updated,
                },
                {
                    id: FlowFlagId.SUPPORTED_APP_WEBHOOKS,
                    value: getSupportedAppWebhooks(),
                    created,
                    updated,
                },
            )
        }
        return flags
    },

    aiCreditsEnabled(): boolean {
        return false
    },
})



function getSupportedAppWebhooks(): string[] {
    const webhookSecrets = system.get(FlowSystemProp.APP_WEBHOOK_SECRETS)
    if (isNil(webhookSecrets)) {
        return []
    }
    const parsed = webhookSecretsUtils.parseWebhookSecrets(webhookSecrets)
    return Object.keys(parsed)
}

export type FlagType =
    | BaseFlagStructure<FlowFlagId.PUBLIC_URL, string>
    | BaseFlagStructure<FlowFlagId.TELEMETRY_ENABLED, boolean>
    | BaseFlagStructure<FlowFlagId.USER_CREATED, boolean>
    | BaseFlagStructure<FlowFlagId.WEBHOOK_URL_PREFIX, string>
    | BaseFlagStructure<FlowFlagId.TEMPLATES_CATEGORIES, string[]>

type BaseFlagStructure<K extends FlowFlagId, V> = {
    id: K
    value: V
}