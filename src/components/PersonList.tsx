import { useState, useEffect } from 'react'
import { Plus, Search, Users, Database, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonCardWithRelations } from './PersonCardWithRelations'
import { PersonForm } from './PersonForm'
import { QuickAddPersonModal } from './QuickAddPersonModal'
import { LinkExistingPersonModal } from './LinkExistingPersonModal'
import { ExportImportModal } from './ExportImportModal'
import { personService } from '../services/personService'
import { relationshipService } from '../services/relationshipService'
import { usePersonStore } from '../store/usePersonStore'
import type { Person, PersonInput } from '../types'

export function PersonList() {
  const { t } = useTranslation()
  const {
    persons,
    setPersons,
    addPerson,
    updatePerson,
    deletePerson,
    setRelationships
  } = usePersonStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | undefined>()

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all')
  const [photoFilter, setPhotoFilter] = useState<'all' | 'with' | 'without'>('all')
  const [livingFilter, setLivingFilter] = useState<'all' | 'living' | 'deceased'>('all')

  // Quick add relationship modal
  const [quickAddModal, setQuickAddModal] = useState<{
    person: Person
    type: 'parent' | 'child' | 'spouse' | 'sibling'
  } | null>(null)

  // Link existing person modal
  const [linkExistingModal, setLinkExistingModal] = useState<Person | null>(null)

  // Export/Import modal
  const [isExportImportOpen, setIsExportImportOpen] = useState(false)

  // Load persons and relationships on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [personsData, relationshipsData] = await Promise.all([
        personService.getAll(),
        relationshipService.getAll()
      ])
      setPersons(personsData)
      setRelationships(relationshipsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load family members. Check your Supabase setup.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingPerson(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (person: Person) => {
    setEditingPerson(person)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: PersonInput, photoFile?: File | null) => {
    try {
      let savedPerson: Person

      if (editingPerson) {
        // Update existing
        savedPerson = await personService.update(editingPerson.id, data)
        updatePerson(editingPerson.id, savedPerson)
      } else {
        // Create new
        savedPerson = await personService.create(data)
        addPerson(savedPerson)
      }

      // Upload photo if provided
      if (photoFile && savedPerson.id) {
        try {
          const photoUrl = await personService.uploadPhoto(savedPerson.id, photoFile)
          // Update person with photo URL
          const updatedWithPhoto = await personService.update(savedPerson.id, {
            profile_photo_url: photoUrl
          })
          updatePerson(savedPerson.id, updatedWithPhoto)
        } catch (photoError) {
          console.error('Failed to upload photo:', photoError)
          alert('Person saved, but photo upload failed. Please try editing the person to upload the photo again.')
        }
      }

      setIsFormOpen(false)
      setEditingPerson(undefined)
    } catch (error) {
      throw error // Let form handle the error
    }
  }

  const handleDelete = async (person: Person) => {
    try {
      await personService.delete(person.id)
      deletePerson(person.id)
    } catch (error) {
      console.error('Failed to delete person:', error)
      alert('Failed to delete. Please try again.')
    }
  }

  // Filter persons based on search and filters
  const filteredPersons = persons.filter((person) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        person.first_name.toLowerCase().includes(query) ||
        person.last_name?.toLowerCase().includes(query) ||
        person.maiden_name?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Gender filter
    if (genderFilter !== 'all' && person.gender !== genderFilter) {
      return false
    }

    // Photo filter
    if (photoFilter === 'with' && !person.profile_photo_url) {
      return false
    }
    if (photoFilter === 'without' && person.profile_photo_url) {
      return false
    }

    // Living status filter
    if (livingFilter === 'living' && person.date_of_death) {
      return false
    }
    if (livingFilter === 'deceased' && !person.date_of_death) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('people.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('people.count', { count: persons.length })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsExportImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <Database className="w-5 h-5" />
            <span>{t('people.backup')}</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>{t('people.addPerson')}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('people.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium ${
              showFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>{t('people.filters')}</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('people.filter.gender.label')}</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              >
                <option value="all">{t('people.filter.gender.all')}</option>
                <option value="male">{t('people.filter.gender.male')}</option>
                <option value="female">{t('people.filter.gender.female')}</option>
                <option value="other">{t('people.filter.gender.other')}</option>
              </select>
            </div>

            {/* Photo Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('people.filter.photo.label')}</label>
              <select
                value={photoFilter}
                onChange={(e) => setPhotoFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              >
                <option value="all">{t('people.filter.photo.all')}</option>
                <option value="with">{t('people.filter.photo.with')}</option>
                <option value="without">{t('people.filter.photo.without')}</option>
              </select>
            </div>

            {/* Living Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('people.filter.status.label')}</label>
              <select
                value={livingFilter}
                onChange={(e) => setLivingFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              >
                <option value="all">{t('people.filter.status.all')}</option>
                <option value="living">{t('people.filter.status.living')}</option>
                <option value="deceased">{t('people.filter.status.deceased')}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">{t('people.loading')}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && persons.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('people.noMembers.title')}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('people.noMembers.description')}</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>{t('people.addFirstPerson')}</span>
          </button>
        </div>
      )}

      {/* Person Grid */}
      {!isLoading && filteredPersons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersons.map((person) => (
            <PersonCardWithRelations
              key={person.id}
              person={person}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddParent={(p) => setQuickAddModal({ person: p, type: 'parent' })}
              onAddChild={(p) => setQuickAddModal({ person: p, type: 'child' })}
              onAddSpouse={(p) => setQuickAddModal({ person: p, type: 'spouse' })}
              onAddSibling={(p) => setQuickAddModal({ person: p, type: 'sibling' })}
              onLinkExisting={(p) => setLinkExistingModal(p)}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && persons.length > 0 && filteredPersons.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('people.noResults.title')}</h3>
          <p className="text-gray-600 dark:text-gray-300">{t('people.noResults.description')}</p>
        </div>
      )}

      {/* Person Form Modal */}
      {isFormOpen && (
        <PersonForm
          person={editingPerson}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingPerson(undefined)
          }}
        />
      )}

      {/* Quick Add Relationship Modal */}
      {quickAddModal && (
        <QuickAddPersonModal
          basePerson={quickAddModal.person}
          relationshipType={quickAddModal.type}
          onSuccess={() => {
            setQuickAddModal(null)
            loadData() // Reload to get new person and relationship
          }}
          onCancel={() => setQuickAddModal(null)}
        />
      )}

      {/* Link Existing Person Modal */}
      {linkExistingModal && (
        <LinkExistingPersonModal
          person={linkExistingModal}
          allPersons={persons}
          onSuccess={() => {
            setLinkExistingModal(null)
            loadData() // Reload to get new relationship
          }}
          onCancel={() => setLinkExistingModal(null)}
        />
      )}

      {/* Export/Import Modal */}
      {isExportImportOpen && (
        <ExportImportModal
          onClose={() => setIsExportImportOpen(false)}
          onImportSuccess={() => {
            setIsExportImportOpen(false)
            loadData() // Reload all data after import
          }}
        />
      )}
    </div>
  )
}
