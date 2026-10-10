// Shared contract between the frontend and backend sessions (.claude/docs/plans/CONTRACTS.md, C1).
// Change only by agreement, in a PR titled with [contract].

export type CategoryId = 'coconut' | 'construction';

// What a role is allowed to do in the job engine. Code checks capabilities, never role ids.
export type Capability = 'poster' | 'bidder' | 'crew';

export type CategoryRoleId = 'owner' | 'agent' | 'client' | 'contractor' | 'worker';

export interface Membership {
  category: CategoryId;
  role: CategoryRoleId;
}
