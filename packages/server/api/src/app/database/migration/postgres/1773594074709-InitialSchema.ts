import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773594074709 implements MigrationInterface {
    name = 'InitialSchema1773594074709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "trigger_event" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "sourceName" character varying NOT NULL,
                "fileId" character varying NOT NULL,
                CONSTRAINT "PK_79bbc8c2af95776e801c7eaab11" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `);
        await queryRunner.query(`
            CREATE TABLE "app_event_routing" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "appName" character varying NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "identifierValue" character varying NOT NULL,
                "event" character varying NOT NULL,
                CONSTRAINT "PK_2107df2b2faf9d50435f9d5acd7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_event_routing_flow_id" ON "app_event_routing" ("flowId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_event_flow_id_project_id_appName_identifier_value_event" ON "app_event_routing" (
                "appName",
                "projectId",
                "flowId",
                "identifierValue",
                "event"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_event_appName_identifier_event" ON "app_event_routing" ("appName", "identifierValue", "event")
        `);
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21),
                "platformId" character varying(21),
                "data" bytea,
                "location" character varying NOT NULL,
                "fileName" character varying,
                "size" integer,
                "metadata" jsonb,
                "s3Key" character varying,
                "type" character varying NOT NULL DEFAULT 'UNKNOWN',
                "compression" character varying NOT NULL DEFAULT 'NONE',
                CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `);
        await queryRunner.query(`
            CREATE TABLE "flag" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "value" jsonb NOT NULL,
                CONSTRAINT "PK_17b74257294fdfd221178a132d4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "folderId" character varying(21),
                "status" character varying NOT NULL DEFAULT 'DISABLED',
                "externalId" character varying NOT NULL,
                "publishedVersionId" character varying(21),
                "metadata" jsonb,
                "operationStatus" character varying NOT NULL DEFAULT 'NONE',
                "timeSavedPerRun" integer,
                "ownerId" character varying,
                "templateId" character varying,
                CONSTRAINT "UQ_f6608fe13b916017a8202f993cb" UNIQUE ("publishedVersionId"),
                CONSTRAINT "REL_f6608fe13b916017a8202f993c" UNIQUE ("publishedVersionId"),
                CONSTRAINT "PK_6c2ad4a3e86394cd9bb7a80a228" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_owner_id" ON "flow" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `);
        await queryRunner.query(`
            CREATE TABLE "flow_version" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowId" character varying(21) NOT NULL,
                "displayName" character varying NOT NULL,
                "schemaVersion" character varying,
                "trigger" jsonb,
                "connectionIds" character varying array NOT NULL,
                "agentIds" character varying array NOT NULL,
                "updatedBy" character varying,
                "valid" boolean NOT NULL,
                "state" character varying NOT NULL,
                "backupFiles" jsonb,
                "notes" jsonb NOT NULL,
                CONSTRAINT "PK_2f20a52dcddf98d3fafe621a9f5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `);
        await queryRunner.query(`
            CREATE TABLE "flow_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "flowVersionId" character varying(21) NOT NULL,
                "environment" character varying,
                "logsFileId" character varying(21),
                "parentRunId" character varying(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT true,
                "status" character varying NOT NULL,
                "tags" character varying array,
                "startTime" TIMESTAMP WITH TIME ZONE,
                "triggeredBy" character varying,
                "finishTime" TIMESTAMP WITH TIME ZONE,
                "pauseMetadata" jsonb,
                "failedStep" jsonb,
                "archivedAt" character varying,
                "stepNameToTest" character varying,
                "stepsCount" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_858b1dd0d1055c44261ae00d45b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_flow_id_status_created_archived_" ON "flow_run" (
                "projectId",
                "environment",
                "flowId",
                "status",
                "created",
                "archivedAt"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "status",
                "created",
                "archivedAt"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "created",
                "archivedAt"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_flow_id_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "flowId",
                "created",
                "archivedAt"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_version_id" ON "flow_run" ("flowVersionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" TIMESTAMP WITH TIME ZONE,
                "ownerId" character varying(21) NOT NULL,
                "displayName" character varying NOT NULL,
                "type" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "externalId" character varying,
                "maxConcurrentJobs" integer,
                "icon" jsonb NOT NULL,
                "releasesEnabled" boolean NOT NULL DEFAULT false,
                "metadata" jsonb,
                "apiKeyHash" character varying,
                CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE deleted IS NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_api_key_hash" ON "project" ("apiKeyHash")
            WHERE "apiKeyHash" IS NOT NULL
                AND deleted IS NULL
        `);
        await queryRunner.query(`
            CREATE TABLE "store-entry" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "key" character varying(128) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "value" jsonb,
                CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d" UNIQUE ("projectId", "key"),
                CONSTRAINT "PK_afb44ca7c0b4606b19deb1680d6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "status" character varying NOT NULL,
                "platformRole" character varying NOT NULL,
                "identityId" character varying NOT NULL,
                "externalId" character varying,
                "platformId" character varying,
                "lastActiveDate" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_identity" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "verified" boolean NOT NULL DEFAULT false,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "tokenVersion" character varying,
                "provider" character varying NOT NULL,
                "imageUrl" character varying,
                CONSTRAINT "UQ_7ad44f9fcbfc95e0a8436bbb029" UNIQUE ("email"),
                CONSTRAINT "PK_87b5856b206b5b77e6e2fa29508" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `);
        await queryRunner.query(`
            CREATE TABLE "app_connection" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "externalId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "platformId" character varying NOT NULL,
                "pieceName" character varying NOT NULL,
                "ownerId" character varying,
                "projectIds" character varying array NOT NULL,
                "scope" character varying NOT NULL,
                "value" jsonb NOT NULL,
                "metadata" jsonb,
                "pieceVersion" character varying NOT NULL,
                "preSelectForNewProjects" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_9efa2d6633ecc57cc5adeafa039" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE TABLE "folder" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "displayOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `);
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "authors" character varying array NOT NULL,
                "displayName" character varying NOT NULL,
                "logoUrl" character varying NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT '0',
                "description" character varying,
                "platformId" character varying,
                "version" character varying COLLATE "en_natural" NOT NULL,
                "minimumSupportedRelease" character varying COLLATE "en_natural" NOT NULL,
                "maximumSupportedRelease" character varying COLLATE "en_natural" NOT NULL,
                "auth" json,
                "actions" json NOT NULL,
                "triggers" json NOT NULL,
                "pieceType" character varying NOT NULL,
                "categories" character varying array,
                "packageType" character varying NOT NULL,
                "archiveId" character varying(21),
                "i18n" json,
                CONSTRAINT "REL_b43d7b070f0fc309932d4cf016" UNIQUE ("archiveId"),
                CONSTRAINT "PK_b045821e9caf2be9aba520d96da" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_platform_id_version" ON "piece_metadata" ("name", "version", "platformId")
        `);
        await queryRunner.query(`
            CREATE TABLE "platform" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "ownerId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "primaryColor" character varying NOT NULL,
                "logoIconUrl" character varying NOT NULL,
                "fullLogoUrl" character varying NOT NULL,
                "favIconUrl" character varying NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT true,
                "filteredPieceNames" character varying array NOT NULL,
                "filteredPieceBehavior" character varying NOT NULL,
                "allowedAuthDomains" character varying array NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" jsonb NOT NULL,
                "pinnedPieces" character varying array NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_0aaf8e30187e0b89ebc9c4764ba" UNIQUE ("platformId", "name"),
                CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "piece_tag" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "pieceName" character varying NOT NULL,
                "tagId" character varying NOT NULL,
                CONSTRAINT "UQ_84a810ed305b758e07fa57f604a" UNIQUE ("tagId", "pieceName"),
                CONSTRAINT "PK_f06201adf8d82249e8f2f390426" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "tag_platformId" ON "piece_tag" ("platformId")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_invitation" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "platformRole" character varying,
                "email" character varying NOT NULL,
                "projectId" character varying,
                "status" character varying NOT NULL,
                "projectRoleId" character varying,
                CONSTRAINT "PK_41026b90b70299ac5dc0183351a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `);
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "config" json NOT NULL,
                "auth" json NOT NULL,
                "provider" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "displayName" character varying NOT NULL,
                CONSTRAINT "PK_1046c2cb42f99614e1c7873744b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `);
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "folderId" character varying(21),
                "externalId" character varying NOT NULL,
                "trigger" character varying,
                "status" character varying,
                "projectId" character varying(21) NOT NULL,
                CONSTRAINT "PK_28914b55c485fc2d7a101b1b2a4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_table_folder_id" ON "table" ("folderId")
        `);
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "tableId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "externalId" character varying NOT NULL,
                "data" jsonb,
                CONSTRAINT "PK_39379bba786d7a75226b358f81e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `);
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tableId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                CONSTRAINT "PK_5cb1f4d1aff275cf9001f4343b9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_record_table_id_project_id_record_id" ON "record" ("tableId", "projectId", "id")
        `);
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "recordId" character varying(21) NOT NULL,
                "fieldId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "value" character varying NOT NULL,
                CONSTRAINT "PK_6f34717c251843e5ca32fc1b2b8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `);
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "tableId" character varying(21) NOT NULL,
                "events" character varying array NOT NULL,
                "flowId" character varying(21) NOT NULL,
                CONSTRAINT "PK_69093ef390cfa098e6404cc85a8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_server" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "token" character varying NOT NULL,
                "enabledTools" jsonb,
                CONSTRAINT "PK_940f98ed91dd060f63e6fc5634e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `);
        await queryRunner.query(`
            CREATE TABLE "trigger_source" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" TIMESTAMP WITH TIME ZONE,
                "flowId" character varying NOT NULL,
                "flowVersionId" character varying NOT NULL,
                "triggerName" character varying NOT NULL,
                "projectId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "schedule" jsonb,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "simulate" boolean NOT NULL,
                CONSTRAINT "PK_aaccba5b6e8aa2f14f108504508" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_flow_id" ON "trigger_source" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_project_id" ON "trigger_source" ("projectId")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_badge" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "userId" character varying(21) NOT NULL,
                CONSTRAINT "idx_user_badge_user_id_name" UNIQUE ("userId", "name"),
                CONSTRAINT "PK_c5db2542e028558c5306c9d7f42" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_badge_user_id" ON "user_badge" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "template" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "summary" character varying NOT NULL,
                "description" character varying NOT NULL,
                "type" character varying NOT NULL,
                "scope" character varying NOT NULL DEFAULT 'TEAM',
                "platformId" character varying,
                "status" character varying NOT NULL,
                "flows" jsonb,
                "tables" jsonb,
                "tags" jsonb NOT NULL,
                "blogUrl" character varying,
                "metadata" jsonb,
                "author" character varying NOT NULL,
                "categories" character varying array NOT NULL,
                "pieces" character varying array NOT NULL,
                CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_template_pieces" ON "template" ("pieces")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_template_categories" ON "template" ("categories")
        `);
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "outdated" boolean NOT NULL,
                "cachedAt" TIMESTAMP NOT NULL,
                "runs" jsonb NOT NULL,
                "flows" jsonb NOT NULL,
                "users" jsonb NOT NULL,
                CONSTRAINT "PK_8b060dc8b2e5d9d91162ce2cc11" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "event_destination" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "scope" character varying NOT NULL,
                "events" character varying array NOT NULL,
                "url" character varying NOT NULL,
                CONSTRAINT "PK_e0fe710f7b5b768b59270f7ac05" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_event_destination_platform_scope" ON "event_destination" ("platformId")
            WHERE scope = 'PLATFORM'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_event_destination_project_scope" ON "event_destination" ("projectId")
            WHERE scope = 'PROJECT'
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_event" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying NOT NULL,
                "userId" character varying NOT NULL,
                "event" character varying NOT NULL,
                "data" jsonb NOT NULL,
                CONSTRAINT "PK_481efbe8b0a403efe3f47a6528f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_audit_event_project_id" ON "audit_event" ("projectId")
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD CONSTRAINT "fk_trigger_event_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_triggered_by_user_id" FOREIGN KEY ("triggeredBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_flow_version_id" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "folder"
            ADD CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
        await queryRunner.query(`
            ALTER TABLE "tag"
            ADD CONSTRAINT "FK_9dec09e187398715b7f1e32a6cb" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_tag"
            ADD CONSTRAINT "FK_6ee5c7cca2b33700e400ea2703e" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_tag"
            ADD CONSTRAINT "FK_5f483919deb37416ff32594918a" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
            ADD CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_record_id" FOREIGN KEY ("recordId") REFERENCES "record"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_field_id" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_badge"
            ADD CONSTRAINT "FK_dc6bb11dce7a0a591b5cae0af25" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD CONSTRAINT "fk_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD CONSTRAINT "fk_event_destination_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD CONSTRAINT "fk_event_destination_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ADD CONSTRAINT "fk_audit_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ADD CONSTRAINT "fk_audit_event_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "audit_event" DROP CONSTRAINT "fk_audit_event_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_event" DROP CONSTRAINT "fk_audit_event_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_destination" DROP CONSTRAINT "fk_event_destination_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_destination" DROP CONSTRAINT "fk_event_destination_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template" DROP CONSTRAINT "fk_template_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_badge" DROP CONSTRAINT "FK_dc6bb11dce7a0a591b5cae0af25"
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450"
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_flow_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_table_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_field_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_record_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "record" DROP CONSTRAINT "fk_record_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "record" DROP CONSTRAINT "fk_record_table_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "fk_field_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "fk_field_table_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_folder_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP CONSTRAINT "fk_ai_provider_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_tag" DROP CONSTRAINT "FK_5f483919deb37416ff32594918a"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_tag" DROP CONSTRAINT "FK_6ee5c7cca2b33700e400ea2703e"
        `);
        await queryRunner.query(`
            ALTER TABLE "tag" DROP CONSTRAINT "FK_9dec09e187398715b7f1e32a6cb"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform" DROP CONSTRAINT "fk_platform_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_file"
        `);
        await queryRunner.query(`
            ALTER TABLE "folder" DROP CONSTRAINT "fk_folder_project"
        `);
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP CONSTRAINT "fk_app_connection_owner_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "FK_dea97e26c765a4cdb575957a146"
        `);
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_owner_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_logs_file_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_flow_version_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_flow_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_triggered_by_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP CONSTRAINT "fk_flow_version_flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP CONSTRAINT "fk_updated_by_user_flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_published_version"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_folder_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_owner_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "file" DROP CONSTRAINT "fk_file_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_flow_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_file_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_audit_event_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_event"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_event_destination_project_scope"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_event_destination_platform_scope"
        `);
        await queryRunner.query(`
            DROP TABLE "event_destination"
        `);
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_template_categories"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_template_pieces"
        `);
        await queryRunner.query(`
            DROP TABLE "template"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_badge_user_id"
        `);
        await queryRunner.query(`
            DROP TABLE "user_badge"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_flow_id_simulate"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_project_id_flow_id_simulate"
        `);
        await queryRunner.query(`
            DROP TABLE "trigger_source"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."mcp_server_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_server"
        `);
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_cell_project_id_field_id_record_id_unique"
        `);
        await queryRunner.query(`
            DROP TABLE "cell"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_record_table_id_project_id_record_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_record_project_id_table_id"
        `);
        await queryRunner.query(`
            DROP TABLE "record"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_field_project_id_table_id_name"
        `);
        await queryRunner.query(`
            DROP TABLE "field"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_table_folder_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_table_project_id_name"
        `);
        await queryRunner.query(`
            DROP TABLE "table"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_provider_platform_id_provider"
        `);
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_invitation_email_platform_project"
        `);
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."tag_platformId"
        `);
        await queryRunner.query(`
            DROP TABLE "piece_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "tag"
        `);
        await queryRunner.query(`
            DROP TABLE "platform"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_piece_metadata_name_platform_id_version"
        `);
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_folder_project_id_display_name"
        `);
        await queryRunner.query(`
            DROP TABLE "folder"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_connection_owner_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_connection_platform_id_and_external_id"
        `);
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_identity_email"
        `);
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_email"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            DROP TABLE "store-entry"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_api_key_hash"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_platform_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_owner_id"
        `);
        await queryRunner.query(`
            DROP TABLE "project"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_flow_version_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_parent_run_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_logs_file_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_project_id_environment_flow_id_created_archived_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_project_id_environment_created_archived_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_project_id_environment_status_created_archived_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_project_id_environment_flow_id_status_created_archived_"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_run"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_version_schema_version"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_version_flow_id_created_desc"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_version"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_folder_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_owner_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "flow"
        `);
        await queryRunner.query(`
            DROP TABLE "flag"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_file_type_created_desc"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_file_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "file"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_event_appName_identifier_event"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_event_flow_id_project_id_appName_identifier_value_event"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_event_routing_flow_id"
        `);
        await queryRunner.query(`
            DROP TABLE "app_event_routing"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_event_file_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_event_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_event_project_id_flow_id"
        `);
        await queryRunner.query(`
            DROP TABLE "trigger_event"
        `);
    }

}
