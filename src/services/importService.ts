import { supabase } from '../lib/supabase'
import type { FamilyTreeExport } from '../utils/dataExport'

export const importService = {
  /**
   * Detect duplicates between import data and existing data
   */
  async detectDuplicates(importData: FamilyTreeExport): Promise<{
    duplicatePersons: number
    duplicateRelationships: number
    newPersons: number
    newRelationships: number
  }> {
    // Get existing data
    const { data: existingPersons } = await supabase
      .from('person')
      .select('id')

    const { data: existingRelationships } = await supabase
      .from('relationship')
      .select('id')

    const existingPersonIds = new Set(existingPersons?.map(p => p.id) || [])
    const existingRelationshipIds = new Set(existingRelationships?.map(r => r.id) || [])

    const importPersonIds = importData.data.persons?.map(p => p.id) || []
    const importRelationshipIds = importData.data.relationships?.map(r => r.id) || []

    const duplicatePersons = importPersonIds.filter(id => existingPersonIds.has(id)).length
    const duplicateRelationships = importRelationshipIds.filter(id => existingRelationshipIds.has(id)).length

    return {
      duplicatePersons,
      duplicateRelationships,
      newPersons: importPersonIds.length - duplicatePersons,
      newRelationships: importRelationshipIds.length - duplicateRelationships
    }
  },

  /**
   * Import family tree data with duplicate handling
   */
  async importFamilyTree(
    importData: FamilyTreeExport,
    mode: 'replace' | 'merge' = 'merge'
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (mode === 'replace') {
        // Delete all existing data first
        await this.clearAllData()
      }

      const { persons, relationships, familyGroups } = importData.data

      // Import persons
      if (persons && persons.length > 0) {
        const personsToImport = persons.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          maiden_name: p.maiden_name,
          gender: p.gender,
          date_of_birth: p.date_of_birth,
          date_of_death: p.date_of_death,
          birth_place: p.birth_place,
          birth_order: p.birth_order,
          biography: p.biography,
          profile_photo_url: p.profile_photo_url
        }))

        if (mode === 'merge') {
          // In merge mode, use upsert to skip duplicates
          const { error: personsError } = await supabase
            .from('person')
            .upsert(personsToImport, {
              onConflict: 'id',
              ignoreDuplicates: true
            })

          if (personsError) throw personsError
        } else {
          // In replace mode, just insert (all data was cleared)
          const { error: personsError } = await supabase
            .from('person')
            .insert(personsToImport)

          if (personsError) throw personsError
        }
      }

      // Import relationships
      if (relationships && relationships.length > 0) {
        const relationshipsToImport = relationships.map(r => ({
          id: r.id,
          type: r.type,
          person1_id: r.person1_id,
          person2_id: r.person2_id,
          start_date: r.start_date,
          end_date: r.end_date,
          metadata: r.metadata
        }))

        if (mode === 'merge') {
          const { error: relationshipsError } = await supabase
            .from('relationship')
            .upsert(relationshipsToImport, {
              onConflict: 'id',
              ignoreDuplicates: true
            })

          if (relationshipsError) throw relationshipsError
        } else {
          const { error: relationshipsError } = await supabase
            .from('relationship')
            .insert(relationshipsToImport)

          if (relationshipsError) throw relationshipsError
        }
      }

      // Import family groups (if present)
      if (familyGroups && familyGroups.length > 0) {
        const groupsToImport = familyGroups.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description
        }))

        if (mode === 'merge') {
          const { error: groupsError } = await supabase
            .from('family_group')
            .upsert(groupsToImport, {
              onConflict: 'id',
              ignoreDuplicates: true
            })

          if (groupsError) throw groupsError
        } else {
          const { error: groupsError } = await supabase
            .from('family_group')
            .insert(groupsToImport)

          if (groupsError) throw groupsError
        }
      }

      const modeText = mode === 'merge' ? 'merged' : 'imported'
      return {
        success: true,
        message: `Successfully ${modeText} ${persons?.length || 0} people and ${relationships?.length || 0} relationships`
      }
    } catch (error: any) {
      console.error('Import error:', error)
      return {
        success: false,
        message: error.message || 'Failed to import data'
      }
    }
  },

  /**
   * Clear all existing data
   */
  async clearAllData(): Promise<void> {
    // Delete in order due to foreign key constraints
    await supabase.from('person_family_group').delete().neq('person_id', '')
    await supabase.from('relationship').delete().neq('id', '')
    await supabase.from('person').delete().neq('id', '')
    await supabase.from('family_group').delete().neq('id', '')
  },

  /**
   * Get import statistics without actually importing
   */
  async getImportStats(importData: FamilyTreeExport): Promise<{
    personsCount: number
    relationshipsCount: number
    familyGroupsCount: number
    exportDate: string
    version: string
  }> {
    return {
      personsCount: importData.data.persons?.length || 0,
      relationshipsCount: importData.data.relationships?.length || 0,
      familyGroupsCount: importData.data.familyGroups?.length || 0,
      exportDate: importData.exportDate,
      version: importData.version
    }
  }
}
