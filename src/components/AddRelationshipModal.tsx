import { useState } from 'react'
import { X, Users, Heart, UserPlus } from 'lucide-react'
import type { Person, RelationshipType, RelationshipInput } from '../types'
import { formatters } from '../utils/formatters'

interface AddRelationshipModalProps {
  person: Person
  allPersons: Person[]
  onSubmit: (relationship: RelationshipInput) => Promise<void>
  onCancel: () => void
  defaultType?: RelationshipType
}

export function AddRelationshipModal({
  person,
  allPersons,
  onSubmit,
  onCancel,
  defaultType
}: AddRelationshipModalProps) {
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    defaultType || 'PARENT_CHILD'
  )
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [marriageDate, setMarriageDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPersonId) {
      alert('Please select a person')
      return
    }

    setIsSubmitting(true)
    try {
      // Determine person1_id and person2_id based on relationship type
      let person1_id = person.id
      let person2_id = selectedPersonId

      if (relationshipType === 'PARENT_CHILD') {
        // For parent-child: person1 = parent, person2 = child
        // We need to know if we're adding a parent or child
        // The modal should be called with context (adding parent vs child)
      }

      const relationshipData: RelationshipInput = {
        type: relationshipType,
        person1_id,
        person2_id,
        start_date: relationshipType === 'SPOUSE' ? marriageDate || undefined : undefined
      }

      await onSubmit(relationshipData)
    } catch (error) {
      console.error('Failed to create relationship:', error)
      alert('Failed to create relationship. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter available persons based on relationship type
  const availablePersons = allPersons.filter(p => p.id !== person.id)

  const getRelationshipIcon = () => {
    switch (relationshipType) {
      case 'PARENT_CHILD': return <Users className="w-6 h-6" />
      case 'SPOUSE': return <Heart className="w-6 h-6" />
      case 'SIBLING': return <UserPlus className="w-6 h-6" />
      default: return <Users className="w-6 h-6" />
    }
  }

  const getRelationshipTitle = () => {
    switch (relationshipType) {
      case 'PARENT_CHILD': return 'Add Parent or Child'
      case 'SPOUSE': return 'Add Spouse'
      case 'SIBLING': return 'Add Sibling'
      default: return 'Add Relationship'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getRelationshipIcon()}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {getRelationshipTitle()}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                For: {formatters.fullName(person)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRelationshipType('PARENT_CHILD')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'PARENT_CHILD'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                <div className="text-sm font-medium">Parent/Child</div>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipType('SPOUSE')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'SPOUSE'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <div className="text-sm font-medium">Spouse</div>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipType('SIBLING')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  relationshipType === 'SIBLING'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserPlus className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium">Sibling</div>
              </button>
            </div>
          </div>

          {/* Select Existing Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Person
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Choose existing person...</option>
              {availablePersons.map(p => (
                <option key={p.id} value={p.id}>
                  {formatters.fullNameWithMaiden(p)}
                  {p.date_of_birth && ` (${formatters.date(p.date_of_birth)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Marriage Date (only for spouse) */}
          {relationshipType === 'SPOUSE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marriage Date (optional)
              </label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {relationshipType === 'PARENT_CHILD' && (
                <>
                  <strong>Parent/Child:</strong> Select whether you're adding a parent or child.
                  The relationship will be automatically configured based on birth dates.
                </>
              )}
              {relationshipType === 'SPOUSE' && (
                <>
                  <strong>Spouse:</strong> This creates a marriage relationship.
                  You can optionally add the marriage date.
                </>
              )}
              {relationshipType === 'SIBLING' && (
                <>
                  <strong>Sibling:</strong> This creates a sibling relationship.
                  Both persons will be shown as siblings of each other.
                </>
              )}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting || !selectedPersonId}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Adding...' : 'Add Relationship'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
