import { supabase } from '../lib/supabase'
import type { FamilyGroup, PersonFamilyGroup, FamilyRole } from '../types'

export const familyGroupService = {
  // Get all family groups
  async getAll(): Promise<FamilyGroup[]> {
    const { data, error } = await supabase
      .from('family_group')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get family group by ID
  async getById(id: string): Promise<FamilyGroup | null> {
    const { data, error } = await supabase
      .from('family_group')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create family group
  async create(name: string, description?: string): Promise<FamilyGroup> {
    const { data, error } = await supabase
      .from('family_group')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update family group
  async update(id: string, updates: { name?: string; description?: string }): Promise<FamilyGroup> {
    const { data, error } = await supabase
      .from('family_group')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete family group
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('family_group')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add person to family group
  async addPerson(personId: string, familyGroupId: string, role: FamilyRole = 'MEMBER'): Promise<PersonFamilyGroup> {
    const { data, error } = await supabase
      .from('person_family_group')
      .insert({
        person_id: personId,
        family_group_id: familyGroupId,
        role
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Remove person from family group
  async removePerson(personId: string, familyGroupId: string): Promise<void> {
    const { error } = await supabase
      .from('person_family_group')
      .delete()
      .eq('person_id', personId)
      .eq('family_group_id', familyGroupId)

    if (error) throw error
  },

  // Get persons in family group
  async getPersons(familyGroupId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('person_family_group')
      .select('person_id')
      .eq('family_group_id', familyGroupId)

    if (error) throw error
    return data?.map(d => d.person_id) || []
  },

  // Get family groups for person
  async getForPerson(personId: string): Promise<FamilyGroup[]> {
    const { data, error } = await supabase
      .from('person_family_group')
      .select('family_group_id, family_group(*)')
      .eq('person_id', personId)

    if (error) throw error
    return data?.map(d => (d as any).family_group).filter(Boolean) || []
  }
}
