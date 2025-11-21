import { useState } from 'react'
import { X, Users, Heart, Baby, UserPlus, Link } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person } from '../types'
import { formatters } from '../utils/formatters'
import { relationshipService } from '../services/relationshipService'

interface LinkExistingPersonModalProps {
  person: Person
  allPersons: Person[]
  onSuccess: () => void
  onCancel: () => void
}

export function LinkExistingPersonModal({
  person,
  allPersons,
  onSuccess,
  onCancel
}: LinkExistingPersonModalProps) {
  const { t } = useTranslation()
  const [relationshipType, setRelationshipType] = useState<'parent' | 'child' | 'spouse' | 'sibling'>('parent')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [marriageDate, setMarriageDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out the current person from selection
  const availablePersons = allPersons.filter(p => p.id !== person.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPersonId) {
      alert(t('linkExisting.selectPersonRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      // Create relationship based on type
      switch (relationshipType) {
        case 'parent':
          // Selected person is the parent, current person is the child
          await relationshipService.createParentChild(selectedPersonId, person.id)
          break
        case 'child':
          // Current person is the parent, selected person is the child
          await relationshipService.createParentChild(person.id, selectedPersonId)
          break
        case 'spouse':
          await relationshipService.createSpouse(
            person.id,
            selectedPersonId,
            marriageDate || undefined
          )
          break
        case 'sibling':
          await relationshipService.createSibling(person.id, selectedPersonId)
          break
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to create relationship:', error)
      alert(t('linkExisting.linkFailed', { message: error?.message || 'Unknown error' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIcon = () => {
    switch (relationshipType) {
      case 'parent': return <Users className="w-6 h-6 text-blue-600" />
      case 'child': return <Baby className="w-6 h-6 text-green-600" />
      case 'spouse': return <Heart className="w-6 h-6 text-red-500" />
      case 'sibling': return <UserPlus className="w-6 h-6 text-purple-600" />
    }
  }

  const getDescription = () => {
    const name = formatters.fullName(person)
    return t(`linkExisting.descriptions.${relationshipType}`, { name })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Link className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t('linkExisting.title')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('linkExisting.forPerson')} {formatters.fullName(person)}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Relationship Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('linkExisting.selectRelationshipType')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRelationshipType('parent')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'parent'
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">{t('linkExisting.relationshipOptions.addParent')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('linkExisting.relationshipOptions.parentDesc')}</div>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipType('child')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'child'
                    ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Baby className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium">{t('linkExisting.relationshipOptions.addChild')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('linkExisting.relationshipOptions.childDesc')}</div>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipType('spouse')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'spouse'
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <div className="text-sm font-medium">{t('linkExisting.relationshipOptions.addSpouse')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('linkExisting.relationshipOptions.spouseDesc')}</div>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipType('sibling')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'sibling'
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserPlus className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-sm font-medium">{t('linkExisting.relationshipOptions.addSibling')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('linkExisting.relationshipOptions.siblingDesc')}</div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            {getIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">
                {getDescription()}
              </p>
            </div>
          </div>

          {/* Select Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('linkExisting.selectPerson')} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">{t('linkExisting.choosePerson')}</option>
              {availablePersons.length === 0 && (
                <option value="" disabled>{t('linkExisting.noOtherPeople')}</option>
              )}
              {availablePersons.map(p => (
                <option key={p.id} value={p.id}>
                  {formatters.fullNameWithMaiden(p)}
                  {p.date_of_birth && ` (${t('linkExisting.born')} ${formatters.date(p.date_of_birth)})`}
                </option>
              ))}
            </select>
            {availablePersons.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                {t('linkExisting.noOtherPeopleWarning')}
              </p>
            )}
          </div>

          {/* Marriage Date (only for spouse) */}
          {relationshipType === 'spouse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linkExisting.marriageDateOptional')}
              </label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting || !selectedPersonId || availablePersons.length === 0}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? t('linkExisting.linking') : t('linkExisting.linkRelationship')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('linkExisting.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
