import { supabase } from '../lib/supabase'
import type { Relationship, RelationshipInput } from '../types'

export const relationshipService = {
  // Get all relationships
  async getAll(): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('relationship')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get relationships for a person
  async getForPerson(personId: string): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('relationship')
      .select('*')
      .or(`person1_id.eq.${personId},person2_id.eq.${personId}`)

    if (error) throw error
    return data || []
  },

  // Create relationship
  async create(relationshipData: RelationshipInput): Promise<Relationship> {
    // Validation: prevent self-relationships
    if (relationshipData.person1_id === relationshipData.person2_id) {
      throw new Error('A person cannot have a relationship with themselves')
    }

    const { data, error } = await supabase
      .from('relationship')
      .insert(relationshipData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Create parent-child relationship
  async createParentChild(parentId: string, childId: string): Promise<Relationship> {
    return this.create({
      type: 'PARENT_CHILD',
      person1_id: parentId,
      person2_id: childId
    })
  },

  // Create spouse relationship
  async createSpouse(person1Id: string, person2Id: string, marriageDate?: string): Promise<Relationship> {
    return this.create({
      type: 'SPOUSE',
      person1_id: person1Id,
      person2_id: person2Id,
      start_date: marriageDate
    })
  },

  // Create sibling relationship
  async createSibling(person1Id: string, person2Id: string): Promise<Relationship> {
    return this.create({
      type: 'SIBLING',
      person1_id: person1Id,
      person2_id: person2Id
    })
  },

  // Update relationship
  async update(id: string, relationshipData: Partial<RelationshipInput>): Promise<Relationship> {
    const { data, error } = await supabase
      .from('relationship')
      .update(relationshipData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete relationship
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('relationship')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get parent-child relationships
  async getParentChild(): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('relationship')
      .select('*')
      .eq('type', 'PARENT_CHILD')

    if (error) throw error
    return data || []
  },

  // Get spouse relationships
  async getSpouses(): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('relationship')
      .select('*')
      .eq('type', 'SPOUSE')

    if (error) throw error
    return data || []
  }
}
