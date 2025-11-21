import { User, Calendar, MapPin, Edit, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person } from '../types'
import { formatters } from '../utils/formatters'

interface PersonCardProps {
  person: Person
  onEdit?: (person: Person) => void
  onDelete?: (person: Person) => void
  onClick?: (person: Person) => void
}

export function PersonCard({ person, onEdit, onDelete, onClick }: PersonCardProps) {
  const { t } = useTranslation()
  const age = formatters.age(person.date_of_birth, person.date_of_death)

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden cursor-pointer"
      onClick={() => onClick?.(person)}
    >
      {/* Profile Photo */}
      <div className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 relative">
        {person.profile_photo_url ? (
          <img
            src={person.profile_photo_url}
            alt={formatters.fullName(person)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-white opacity-75" />
          </div>
        )}
      </div>

      {/* Person Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          {formatters.fullNameWithMaiden(person)}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          {/* Birth Date & Age */}
          {person.date_of_birth && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {formatters.date(person.date_of_birth)}
                {age && ` (${age})`}
              </span>
            </div>
          )}

          {/* Death Date */}
          {person.date_of_death && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{t('personCard.died')} {formatters.date(person.date_of_death)}</span>
            </div>
          )}

          {/* Birth Place */}
          {person.birth_place && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{person.birth_place}</span>
            </div>
          )}
        </div>

        {/* Biography Preview */}
        {person.biography && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {person.biography}
          </p>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(person)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>{t('personCard.edit')}</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(t('personCard.deleteConfirm', { name: formatters.fullName(person) }))) {
                    onDelete(person)
                  }
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
