/**
 * Community-edition stubs for EE authorization hooks.
 * All hooks are no-ops — community edition has no plan-gated features,
 * no team-type project restrictions, and no platform ownership checks.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookHandler = (request: any, reply: any) => Promise<void>

export const platformMustHaveFeatureEnabled = (
    _handler: (platform: any) => boolean,
): HookHandler => async (_request, _reply) => {
    // No-op: community edition has no plan-gated features
}

export const platformMustBeOwnedByCurrentUser: HookHandler =
    async (_request, _reply) => {
        // No-op: community edition allows all platform access
    }

export const projectMustBeTeamType: HookHandler =
    async (_request, _reply) => {
        // No-op: community edition has no team-type project restrictions
    }
