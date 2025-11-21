import { supabase } from '../lib/supabase'
import type { Person, PersonInput } from '../types'

export const personService = {
  // Get all persons
  async getAll(): Promise<Person[]> {
    const { data, error } = await supabase
      .from('person')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get person by ID
  async getById(id: string): Promise<Person | null> {
    const { data, error } = await supabase
      .from('person')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create person
  async create(personData: PersonInput): Promise<Person> {
    const { data, error } = await supabase
      .from('person')
      .insert(personData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update person
  async update(id: string, personData: Partial<PersonInput>): Promise<Person> {
    const { data, error } = await supabase
      .from('person')
      .update(personData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete person
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('person')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search persons
  async search(query: string): Promise<Person[]> {
    const { data, error } = await supabase
      .from('person')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order('first_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Upload profile photo
  async uploadPhoto(personId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${personId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}
