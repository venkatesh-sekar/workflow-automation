# Learnings: modify-templates

## Template Structure
- TemplateType now has CUSTOM only (OFFICIAL/SHARED stripped in #101)
- Template entity has platformId (nullable) — will need scope field (TEAM/GLOBAL) added
- Migration files have their own local TemplateType enums — left untouched
- community-templates.service.ts is now dead code (no importers) — can be deleted
- type field removed from CreateTemplateRequestBody and ListTemplatesRequestQuery
- UI files in packages/web/ still reference TemplateType.OFFICIAL/SHARED — will break on frontend phases
- TemplateScope enum added: TEAM (project-scoped, default) and GLOBAL (visible to all)
- scope field added to Template, entity (default 'TEAM'), create request (optional default TEAM), list query (optional filter)
- Scope filtering implemented in list() — filters by Equal(scope) when provided
- Still need: tests for template scope behavior
- Categories endpoint removed from controller (was CLOUD-only)
