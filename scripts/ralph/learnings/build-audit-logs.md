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

## Audit Hook Pattern
- Add audit calls in controller (not service) — controller has request context with principal type and userId
- Guard audit calls with `request.principal.type === PrincipalType.USER` to skip SERVICE principals
- For flow updates, detect CHANGE_STATUS/LOCK_AND_PUBLISH to emit FLOW_STATUS_CHANGED vs FLOW_UPDATED
- FlowOperationRequest.request is a union type — cast to `{ status?: string }` to access status field safely

## Member Change Hooks
- User invitations are the member management mechanism (no direct project_member CRUD exposed)
- Invitation create with InvitationType.PROJECT = member invited; delete = member removed
- Guard with both PrincipalType.USER and InvitationType.PROJECT to avoid logging platform-level invitations
- invitation.email available on both create (from request.body) and delete (from fetched invitation)

## Test Pattern
- Integration tests use createTestContext(app!) for authenticated project-scoped requests
- Audit events can be inserted directly via db.save('audit_event', {...}) for list endpoint tests
- Flow controller hooks verified end-to-end: POST /v1/flows creates FLOW_CREATED event, DELETE creates FLOW_DELETED
- Test baseline after audit event tests: 22 suites, 178 tests
