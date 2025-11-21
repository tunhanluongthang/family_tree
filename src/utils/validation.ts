import type { Person, Relationship } from '../types'

export const validation = {
  // Validate age gap for parent-child relationship
  validateParentChildAge(parent: Person, child: Person): { valid: boolean; message?: string } {
    if (!parent.date_of_birth || !child.date_of_birth) {
      return { valid: true } // Skip if dates unknown
    }

    const parentBirth = new Date(parent.date_of_birth)
    const childBirth = new Date(child.date_of_birth)
    const ageGapYears = (childBirth.getTime() - parentBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    const MIN_PARENT_AGE = 12
    const MAX_PARENT_AGE = 70

    if (ageGapYears < MIN_PARENT_AGE) {
      return {
        valid: false,
        message: `Parent must be at least ${MIN_PARENT_AGE} years older than child`
      }
    }

    if (ageGapYears > MAX_PARENT_AGE) {
      return {
        valid: false,
        message: `Age gap seems unusual (${Math.floor(ageGapYears)} years). Please verify.`
      }
    }

    return { valid: true }
  },

  // Check if person is ancestor of another
  isAncestor(
    potentialAncestorId: string,
    personId: string,
    relationships: Relationship[],
    visited = new Set<string>()
  ): boolean {
    if (potentialAncestorId === personId) return true
    if (visited.has(personId)) return false

    visited.add(personId)

    // Get parents of person
    const parents = relationships
      .filter(r => r.type === 'PARENT_CHILD' && r.person2_id === personId)
      .map(r => r.person1_id)

    // Check if any parent is the ancestor or has the ancestor
    return parents.some(parentId =>
      this.isAncestor(potentialAncestorId, parentId, relationships, visited)
    )
  },

  // Validate parent-child relationship doesn't create loop
  validateNoLoop(
    parentId: string,
    childId: string,
    relationships: Relationship[]
  ): { valid: boolean; message?: string } {
    // Check if child is already an ancestor of parent
    if (this.isAncestor(childId, parentId, relationships)) {
      return {
        valid: false,
        message: 'This would create a loop: the child is already an ancestor of the parent'
      }
    }

    return { valid: true }
  },

  // Validate spouse relationship
  validateSpouse(
    person1: Person,
    person2: Person,
    relationships: Relationship[]
  ): { valid: boolean; message?: string } {
    // Check if they're direct blood relatives
    if (
      this.isAncestor(person1.id, person2.id, relationships) ||
      this.isAncestor(person2.id, person1.id, relationships)
    ) {
      return {
        valid: false,
        message: 'Cannot marry direct blood relative (parent/child/grandparent/etc)'
      }
    }

    // Check if they're siblings
    const areSiblings = relationships.some(
      r =>
        r.type === 'SIBLING' &&
        ((r.person1_id === person1.id && r.person2_id === person2.id) ||
          (r.person1_id === person2.id && r.person2_id === person1.id))
    )

    if (areSiblings) {
      return {
        valid: false,
        message: 'Cannot marry sibling'
      }
    }

    return { valid: true }
  },

  // Validate person data
  validatePerson(data: Partial<Person>): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required'
    }

    if (data.date_of_birth && data.date_of_death) {
      const birth = new Date(data.date_of_birth)
      const death = new Date(data.date_of_death)

      if (death < birth) {
        errors.date_of_death = 'Death date cannot be before birth date'
      }
    }

    if (data.date_of_birth) {
      const birth = new Date(data.date_of_birth)
      const now = new Date()

      if (birth > now) {
        errors.date_of_birth = 'Birth date cannot be in the future'
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }
}
