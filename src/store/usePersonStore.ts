import { create } from 'zustand'
import type { Person, Relationship } from '../types'

interface PersonStore {
  persons: Person[]
  relationships: Relationship[]
  selectedPersonId: string | null

  // Actions
  setPersons: (persons: Person[]) => void
  addPerson: (person: Person) => void
  updatePerson: (id: string, person: Partial<Person>) => void
  deletePerson: (id: string) => void

  setRelationships: (relationships: Relationship[]) => void
  addRelationship: (relationship: Relationship) => void
  deleteRelationship: (id: string) => void

  setSelectedPerson: (id: string | null) => void

  // Helper getters
  getPersonById: (id: string) => Person | undefined
  getRelationshipsForPerson: (personId: string) => Relationship[]
  getParents: (personId: string) => Person[]
  getChildren: (personId: string) => Person[]
  getSpouses: (personId: string) => Person[]
  getSiblings: (personId: string) => Person[]
}

export const usePersonStore = create<PersonStore>((set, get) => ({
  persons: [],
  relationships: [],
  selectedPersonId: null,

  setPersons: (persons) => set({ persons }),

  addPerson: (person) => set((state) => ({
    persons: [...state.persons, person]
  })),

  updatePerson: (id, updates) => set((state) => ({
    persons: state.persons.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),

  deletePerson: (id) => set((state) => ({
    persons: state.persons.filter(p => p.id !== id),
    relationships: state.relationships.filter(r =>
      r.person1_id !== id && r.person2_id !== id
    )
  })),

  setRelationships: (relationships) => set({ relationships }),

  addRelationship: (relationship) => set((state) => ({
    relationships: [...state.relationships, relationship]
  })),

  deleteRelationship: (id) => set((state) => ({
    relationships: state.relationships.filter(r => r.id !== id)
  })),

  setSelectedPerson: (id) => set({ selectedPersonId: id }),

  getPersonById: (id) => {
    return get().persons.find(p => p.id === id)
  },

  getRelationshipsForPerson: (personId) => {
    return get().relationships.filter(r =>
      r.person1_id === personId || r.person2_id === personId
    )
  },

  getParents: (personId) => {
    const relationships = get().relationships
    const persons = get().persons

    return relationships
      .filter(r => r.type === 'PARENT_CHILD' && r.person2_id === personId)
      .map(r => persons.find(p => p.id === r.person1_id))
      .filter(Boolean) as Person[]
  },

  getChildren: (personId) => {
    const relationships = get().relationships
    const persons = get().persons

    const children = relationships
      .filter(r => r.type === 'PARENT_CHILD' && r.person1_id === personId)
      .map(r => persons.find(p => p.id === r.person2_id))
      .filter(Boolean) as Person[]

    // Sort by birth_order first (if available), then by birth_date
    return children.sort((a, b) => {
      // If both have birth_order, sort by that
      if (a.birth_order != null && b.birth_order != null) {
        return a.birth_order - b.birth_order
      }

      // If only one has birth_order, prioritize it
      if (a.birth_order != null) return -1
      if (b.birth_order != null) return 1

      // If neither has birth_order, sort by birth_date
      if (a.date_of_birth && b.date_of_birth) {
        return new Date(a.date_of_birth).getTime() - new Date(b.date_of_birth).getTime()
      }

      // If only one has birth_date, prioritize it
      if (a.date_of_birth) return -1
      if (b.date_of_birth) return 1

      // If neither has birth_date or birth_order, maintain original order
      return 0
    })
  },

  getSpouses: (personId) => {
    const relationships = get().relationships
    const persons = get().persons

    return relationships
      .filter(r => r.type === 'SPOUSE' && (r.person1_id === personId || r.person2_id === personId))
      .map(r => {
        const spouseId = r.person1_id === personId ? r.person2_id : r.person1_id
        return persons.find(p => p.id === spouseId)
      })
      .filter(Boolean) as Person[]
  },

  getSiblings: (personId) => {
    const parents = get().getParents(personId)
    if (parents.length === 0) return []

    // Get all children of the same parents
    const allChildren = new Set<Person>()
    parents.forEach(parent => {
      get().getChildren(parent.id).forEach(child => {
        if (child.id !== personId) {
          allChildren.add(child)
        }
      })
    })

    return Array.from(allChildren)
  }
}))
