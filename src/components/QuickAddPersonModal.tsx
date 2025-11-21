import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person, PersonInput } from '../types'
import { personService } from '../services/personService'
import { relationshipService } from '../services/relationshipService'
import { formatters } from '../utils/formatters'

interface QuickAddPersonModalProps {
  basePerson: Person
  relationshipType: 'parent' | 'child' | 'spouse' | 'sibling'
  onSuccess: () => void
  onCancel: () => void
}

export function QuickAddPersonModal({
  basePerson,
  relationshipType,
  onSuccess,
  onCancel
}: QuickAddPersonModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<PersonInput>({
    first_name: '',
    last_name: basePerson.last_name || '',
    gender: undefined,
    date_of_birth: '',
  })
  const [marriageDate, setMarriageDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getTitle = () => {
    const typeName = t(`quickAdd.types.${relationshipType}`)
    return t('quickAdd.titleWithName', { type: typeName, name: formatters.fullName(basePerson) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Clean data
      const cleanedData: PersonInput = {
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        maiden_name: formData.maiden_name || undefined,
        gender: formData.gender || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        birth_place: formData.birth_place || undefined,
      }

      // Create the person
      const newPerson = await personService.create(cleanedData)

      // Create the relationship
      switch (relationshipType) {
        case 'parent':
          // parent is person1, child is person2
          await relationshipService.createParentChild(newPerson.id, basePerson.id)
          break
        case 'child':
          // parent is person1, child is person2
          await relationshipService.createParentChild(basePerson.id, newPerson.id)
          break
        case 'spouse':
          await relationshipService.createSpouse(
            basePerson.id,
            newPerson.id,
            marriageDate || undefined
          )
          break
        case 'sibling':
          await relationshipService.createSibling(basePerson.id, newPerson.id)
          break
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to create person and relationship:', error)
      alert(t('quickAdd.errors.failedToAdd'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('quickAdd.firstName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('quickAdd.placeholders.firstName')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('quickAdd.lastName')}
            </label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('quickAdd.placeholders.lastName')}
            />
          </div>

          {relationshipType === 'spouse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quickAdd.maidenName')}
              </label>
              <input
                type="text"
                value={formData.maiden_name || ''}
                onChange={(e) => setFormData({ ...formData, maiden_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('quickAdd.placeholders.maidenName')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('quickAdd.gender')}
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('quickAdd.selectGender')}</option>
              <option value="male">{t('personForm.genderOptions.male')}</option>
              <option value="female">{t('personForm.genderOptions.female')}</option>
              <option value="other">{t('personForm.genderOptions.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('quickAdd.birthDate')}
            </label>
            <input
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {relationshipType === 'spouse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quickAdd.marriageDate')}
              </label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? t('quickAdd.adding') : t('quickAdd.add', { type: t(`quickAdd.types.${relationshipType}`) })}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('quickAdd.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
