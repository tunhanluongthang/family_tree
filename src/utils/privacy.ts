// Privacy utilities for filtering person data based on relationships

import type { Person, Relationship } from '../types'
import type { UserProfile } from '../types/auth'

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null

  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Check if two persons are biological parent-child
 */
export function isParentChild(
  personId: string,
  otherPersonId: string,
  relationships: Relationship[]
): boolean {
  return relationships.some(
    rel =>
      rel.type === 'PARENT_CHILD' &&
      ((rel.person1_id === personId && rel.person2_id === otherPersonId) ||
        (rel.person1_id === otherPersonId && rel.person2_id === personId))
  )
}

/**
 * Check if two persons are biological siblings
 */
export function isSibling(
  personId: string,
  otherPersonId: string,
  relationships: Relationship[]
): boolean {
  return relationships.some(
    rel =>
      rel.type === 'SIBLING' &&
      ((rel.person1_id === personId && rel.person2_id === otherPersonId) ||
        (rel.person1_id === otherPersonId && rel.person2_id === personId))
  )
}

/**
 * Check if user can see detailed info of a person
 * Detailed info visible to: biological parents, biological siblings, biological children
 */
export function canSeeDetailedInfo(
  personId: string,
  userProfile: UserProfile | null,
  relationships: Relationship[]
): boolean {
  // Owner/Admin can see everything
  if (userProfile?.role === 'OWNER' || userProfile?.role === 'ADMIN') {
    return true
  }

  // If user hasn't claimed a person, they only see basic info
  if (!userProfile?.claimed_person_id) {
    return false
  }

  const viewerPersonId = userProfile.claimed_person_id

  // Check if viewer is viewing their own profile
  if (viewerPersonId === personId) {
    return true
  }

  // Check if viewer is parent, child, or sibling
  if (isParentChild(viewerPersonId, personId, relationships)) {
    return true
  }

  if (isSibling(viewerPersonId, personId, relationships)) {
    return true
  }

  // Not close family, only basic info
  return false
}

/**
 * Filter person data based on privacy rules
 * Returns person with only basic info if user can't see detailed info
 */
export function filterPersonData(
  person: Person,
  userProfile: UserProfile | null,
  relationships: Relationship[]
): Person {
  // If user can see detailed info, return full person data
  if (canSeeDetailedInfo(person.id, userProfile, relationships)) {
    return person
  }

  // Otherwise, return filtered data with only basic info
  return {
    ...person,
    // Hide sensitive fields
    date_of_birth: null, // Will show age instead via calculateAge
    maiden_name: null,
    biography: person.biography ? '[Hidden for privacy]' : null,
    // Keep basic fields
    // first_name, last_name, gender, birth_place, profile_photo_url are visible
  }
}

/**
 * Get display age or date of birth based on privacy
 * Returns age string for basic info, full DOB for detailed info
 */
export function getDisplayAge(
  person: Person,
  userProfile: UserProfile | null,
  relationships: Relationship[]
): string {
  if (!person.date_of_birth) {
    return ''
  }

  // If user can see detailed info, show full DOB
  if (canSeeDetailedInfo(person.id, userProfile, relationships)) {
    return new Date(person.date_of_birth).toLocaleDateString('vi-VN')
  }

  // Otherwise, show only age
  const age = calculateAge(person.date_of_birth)
  return age !== null ? `${age} tuổi` : ''
}

/**
 * Check if maiden name field should be shown
 * Currently always hidden from UI (but kept in database)
 */
export function shouldShowMaidenName(): boolean {
  return false // Always hide maiden_name field from UI
}

/**
 * Get permission helper based on user role
 */
export function getPermissions(userProfile: UserProfile | null): {
  canViewAll: boolean
  canAdd: boolean
  canEditOwn: boolean
  canEditAll: boolean
  canDelete: boolean
  canManageUsers: boolean
  isApproved: boolean
} {
  if (!userProfile) {
    return {
      canViewAll: false,
      canAdd: false,
      canEditOwn: false,
      canEditAll: false,
      canDelete: false,
      canManageUsers: false,
      isApproved: false,
    }
  }

  const { role, approved } = userProfile

  switch (role) {
    case 'OWNER':
      return {
        canViewAll: approved,
        canAdd: approved,
        canEditOwn: approved,
        canEditAll: approved,
        canDelete: approved,
        canManageUsers: approved,
        isApproved: approved,
      }
    case 'ADMIN':
      return {
        canViewAll: approved,
        canAdd: approved,
        canEditOwn: approved,
        canEditAll: approved,
        canDelete: approved,
        canManageUsers: false,
        isApproved: approved,
      }
    case 'CONTRIBUTOR':
      return {
        canViewAll: approved,
        canAdd: approved,
        canEditOwn: approved,
        canEditAll: false,
        canDelete: false,
        canManageUsers: false,
        isApproved: approved,
      }
    case 'VIEWER':
      return {
        canViewAll: approved,
        canAdd: false,
        canEditOwn: false,
        canEditAll: false,
        canDelete: false,
        canManageUsers: false,
        isApproved: approved,
      }
    default:
      return {
        canViewAll: false,
        canAdd: false,
        canEditOwn: false,
        canEditAll: false,
        canDelete: false,
        canManageUsers: false,
        isApproved: false,
      }
  }
}
