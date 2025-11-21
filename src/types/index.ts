export interface Person {
  id: string
  first_name: string
  last_name: string | null
  maiden_name: string | null
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  date_of_death: string | null
  birth_place: string | null
  birth_order: number | null
  biography: string | null
  profile_photo_url: string | null
  created_at: string
  updated_at: string
}

export type RelationshipType = 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING' | 'ADOPTED' | 'STEP'

export interface Relationship {
  id: string
  type: RelationshipType
  person1_id: string
  person2_id: string
  start_date: string | null
  end_date: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface FamilyGroup {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type FamilyRole = 'FOUNDER' | 'MEMBER' | 'MARRIED_IN'

export interface PersonFamilyGroup {
  person_id: string
  family_group_id: string
  role: FamilyRole | null
  added_at: string
}

// Extended types with relationships
export interface PersonWithRelationships extends Person {
  parents?: Person[]
  children?: Person[]
  spouses?: Person[]
  siblings?: Person[]
}

// Form input types
export interface PersonInput {
  first_name: string
  last_name?: string | null
  maiden_name?: string | null
  gender?: 'male' | 'female' | 'other' | null
  date_of_birth?: string | null
  date_of_death?: string | null
  birth_place?: string | null
  birth_order?: number | null
  biography?: string | null
  profile_photo_url?: string | null
}

export interface RelationshipInput {
  type: RelationshipType
  person1_id: string
  person2_id: string
  start_date?: string
  end_date?: string
  metadata?: Record<string, any>
}
