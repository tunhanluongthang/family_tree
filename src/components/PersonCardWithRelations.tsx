import { User, Calendar, MapPin, Edit, Trash2, UserPlus, Baby, Heart, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person } from '../types'
import { formatters } from '../utils/formatters'
import { usePersonStore } from '../store/usePersonStore'

interface PersonCardWithRelationsProps {
  person: Person
  onEdit?: (person: Person) => void
  onDelete?: (person: Person) => void
  onClick?: (person: Person) => void
  onAddParent?: (person: Person) => void
  onAddChild?: (person: Person) => void
  onAddSpouse?: (person: Person) => void
  onAddSibling?: (person: Person) => void
  onLinkExisting?: (person: Person) => void
}

export function PersonCardWithRelations({
  person,
  onEdit,
  onDelete,
  onClick,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onAddSibling,
  onLinkExisting
}: PersonCardWithRelationsProps) {
  const { t } = useTranslation()
  const { getParents, getChildren, getSpouses, getSiblings } = usePersonStore()

  const age = formatters.age(person.date_of_birth, person.date_of_death)
  const parents = getParents(person.id)
  const children = getChildren(person.id)
  const spouses = getSpouses(person.id)
  const siblings = getSiblings(person.id)

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      {/* Profile Photo */}
      <div
        className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 relative cursor-pointer"
        onClick={() => onClick?.(person)}
      >
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
        <h3
          className="text-lg font-bold text-gray-800 mb-1 cursor-pointer hover:text-indigo-600"
          onClick={() => onClick?.(person)}
        >
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

          {/* Birth Order */}
          {person.birth_order && (
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="font-semibold">#{person.birth_order}</span>
              <span>{formatters.birthOrder(person.birth_order)}</span>
            </div>
          )}
        </div>

        {/* Relationships Summary */}
        {(parents.length > 0 || children.length > 0 || spouses.length > 0 || siblings.length > 0) && (
          <div className="mt-3 pt-3 border-t space-y-1 text-xs">
            {parents.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-3 h-3" />
                <span>
                  {t('personCard.relationships.parents')} {parents.map(p => formatters.fullName(p)).join(', ')}
                </span>
              </div>
            )}
            {spouses.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <Heart className="w-3 h-3" />
                <span>
                  {t('personCard.relationships.spouse')} {spouses.map(s => formatters.fullName(s)).join(', ')}
                </span>
              </div>
            )}
            {children.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <Baby className="w-3 h-3" />
                <span>
                  {t('personCard.relationships.children')} {children.length}
                </span>
              </div>
            )}
            {siblings.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <UserPlus className="w-3 h-3" />
                <span>
                  {t('personCard.relationships.siblings')} {siblings.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick Add Relationships */}
        {(onAddParent || onAddChild || onAddSpouse || onAddSibling || onLinkExisting) && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-medium text-gray-700 mb-2">{t('personCard.addRelationships')}</div>

            {/* Link Existing Button */}
            {onLinkExisting && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLinkExisting(person)
                }}
                className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium shadow-sm"
              >
                <Users className="w-4 h-4" />
                {t('personCard.linkToExisting')}
              </button>
            )}

            {/* Quick Add New Person */}
            {(onAddParent || onAddChild || onAddSpouse || onAddSibling) && (
              <>
                <div className="text-xs font-medium text-gray-500 mb-2 mt-3">{t('personCard.quickAddNew')}</div>
                <div className="grid grid-cols-2 gap-2">
              {onAddParent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddParent(person)
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {t('personCard.relationships.parent')}
                </button>
              )}
              {onAddChild && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddChild(person)
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                >
                  <Baby className="w-3 h-3" />
                  {t('personCard.relationships.child')}
                </button>
              )}
              {onAddSpouse && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddSpouse(person)
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-pink-50 text-pink-700 rounded hover:bg-pink-100 transition-colors"
                >
                  <Heart className="w-3 h-3" />
                  {t('personCard.relationships.spouseLabel')}
                </button>
              )}
              {onAddSibling && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddSibling(person)
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  {t('personCard.relationships.sibling')}
                </button>
              )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Edit/Delete Actions */}
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
