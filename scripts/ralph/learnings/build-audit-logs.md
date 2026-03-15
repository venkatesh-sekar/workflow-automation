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
