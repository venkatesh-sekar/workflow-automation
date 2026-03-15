# Build Audit Logs — Phase Learnings

## Entity Pattern
- Entities use TypeORM EntitySchema (not decorators) — see template.entity.ts for reference
- BaseColumnSchemaPart provides id (21-char ApId), created, updated timestamps
- Register new entities in database-connection.ts getEntities() array
- Use `created` column as the audit event timestamp (auto-set by TypeORM)

## Design Decisions
- Entity name: `audit_event` (table name in DB)
- data column: jsonb for flexible event payloads
- Relations to project and user with CASCADE delete
- Index on projectId for project-scoped queries

## Service Pattern
- Service uses repoFactory<AuditEventSchema>(AuditEventEntity) — same as template.service.ts
- list() uses simple .find() with createPage(data, null) — no cursor pagination needed for audit logs
- create() generates ID with apId() and lets TypeORM handle created/updated timestamps

## Module/Controller Pattern
- Use securityAccess.project() with ProjectResourceType.QUERY for project-scoped list endpoints
- Must include projectId in querystring schema when using ProjectResourceType.QUERY
- request.projectId is populated by the security middleware (not request.principal.projectId)
- UserPrincipal type does NOT have projectId — only available via request.projectId from project security
