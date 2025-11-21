import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { User, Calendar } from 'lucide-react'
import type { Person } from '../types'
import { formatters } from '../utils/formatters'

interface PersonNodeProps {
  data: {
    person: Person
    generation: number
    parents: Person[]
    children: Person[]
    spouses: Person[]
  }
  selected?: boolean
}

function PersonNodeComponent({ data, selected }: PersonNodeProps) {
  const { person, generation } = data
  const age = formatters.age(person.date_of_birth, person.date_of_death)

  // Gender-based colors
  const getBorderColor = () => {
    if (selected) return 'border-indigo-600'
    switch (person.gender) {
      case 'male': return 'border-blue-400'
      case 'female': return 'border-pink-400'
      default: return 'border-gray-300'
    }
  }

  const getBackgroundColor = () => {
    if (selected) return 'bg-indigo-50'
    switch (person.gender) {
      case 'male': return 'bg-blue-50'
      case 'female': return 'bg-pink-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 ${getBorderColor()} ${getBackgroundColor()}
        shadow-md hover:shadow-lg transition-shadow
        min-w-[180px] max-w-[220px]
        ${selected ? 'ring-4 ring-indigo-300' : ''}
      `}
    >
      {/* Top handle for incoming edges (parents) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Profile Photo or Icon */}
      <div className="flex items-center gap-3 mb-2">
        {person.profile_photo_url ? (
          <img
            src={person.profile_photo_url}
            alt={formatters.fullName(person)}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${person.gender === 'male' ? 'bg-blue-200' : person.gender === 'female' ? 'bg-pink-200' : 'bg-gray-200'} flex items-center justify-center`}>
            <User className={`w-5 h-5 ${person.gender === 'male' ? 'text-blue-600' : person.gender === 'female' ? 'text-pink-600' : 'text-gray-600'}`} />
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 truncate">
            {person.first_name}
          </div>
          {person.last_name && (
            <div className="text-xs text-gray-600 truncate">
              {person.last_name}
            </div>
          )}
        </div>
      </div>

      {/* Birth Date & Age */}
      {person.date_of_birth && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span className="truncate">
            {new Date(person.date_of_birth).getFullYear()}
            {age && ` (${age})`}
          </span>
        </div>
      )}

      {/* Death indicator */}
      {person.date_of_death && (
        <div className="text-xs text-gray-500 mt-1">
          † {new Date(person.date_of_death).getFullYear()}
        </div>
      )}

      {/* Birth Order Badge */}
      {person.birth_order && (
        <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {person.birth_order}
        </div>
      )}

      {/* Generation Badge */}
      <div className="absolute -top-2 -left-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full shadow">
        G{generation}
      </div>

      {/* Bottom handle for outgoing edges (children) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Side handles for spouse connections */}
      <Handle
        type="source"
        position={Position.Left}
        id="spouse-left"
        className="!bg-red-500 !w-2 !h-2 !border-2 !border-white opacity-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="spouse-right"
        className="!bg-red-500 !w-2 !h-2 !border-2 !border-white opacity-0"
      />
    </div>
  )
}

export const PersonNode = memo(PersonNodeComponent)
