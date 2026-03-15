# Learnings: rename-ap-system-props

- SharedSystemProp does NOT exist in the codebase — tracker criterion is N/A, will mark as satisfied
- SystemProp type alias in system-props.ts combines AppSystemProp | WorkerSystemProp — needs updating after both renames
- All system prop enums defined in packages/server/common/src/lib/system-props.ts
- environmentVariables helper uses WorkerSystemProp | AppSystemProp in function signatures — needs updating
- apVersionUtil.getLatestRelease() has hardcoded activepieces GitHub URL — belongs to strip-telemetry phase
