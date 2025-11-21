// Authentication and Authorization Types

export type UserRole = 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'

export interface UserProfile {
  id: string
  role: UserRole
  claimed_person_id: string | null
  email_verified: boolean
  approved: boolean
  created_at: string
  updated_at: string
}

export interface RoleUpgradeRequest {
  id: string
  user_id: string
  requested_role: 'CONTRIBUTOR'
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface UserWithProfile {
  id: string
  email: string
  profile: UserProfile
  claimed_person?: {
    id: string
    first_name: string
    last_name: string | null
  }
}

// Permission helper type
export interface Permissions {
  canViewAll: boolean
  canAdd: boolean
  canEditOwn: boolean
  canEditAll: boolean
  canDelete: boolean
  canManageUsers: boolean
  isApproved: boolean
}
