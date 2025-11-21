import { useState, useEffect } from 'react'
import { Plus, Users, Edit2, Trash2, UserPlus } from 'lucide-react'
import { familyGroupService } from '../services/familyGroupService'
import { usePersonStore } from '../store/usePersonStore'
import type { FamilyGroup } from '../types'

export function FamilyGroupsList() {
  const { persons } = usePersonStore()
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<{
    group: FamilyGroup
    memberIds: string[]
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setIsLoading(true)
      const data = await familyGroupService.getAll()
      setGroups(data)
    } catch (error) {
      console.error('Failed to load groups:', error)
      alert('Failed to load family groups')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingGroup(null)
    setFormData({ name: '', description: '' })
    setIsFormOpen(true)
  }

  const handleEdit = (group: FamilyGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || ''
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingGroup) {
        await familyGroupService.update(editingGroup.id, {
          name: formData.name || undefined,
          description: formData.description || undefined
        })
      } else {
        await familyGroupService.create(formData.name, formData.description || undefined)
      }
      setIsFormOpen(false)
      loadGroups()
    } catch (error) {
      console.error('Failed to save group:', error)
      alert('Failed to save family group')
    }
  }

  const handleDelete = async (group: FamilyGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return

    try {
      await familyGroupService.delete(group.id)
      loadGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete family group')
    }
  }

  const handleManageMembers = async (group: FamilyGroup) => {
    try {
      const memberIds = await familyGroupService.getPersons(group.id)
      setSelectedGroupMembers({ group, memberIds })
    } catch (error) {
      console.error('Failed to load members:', error)
      alert('Failed to load group members')
    }
  }

  const handleAddMember = async (personId: string) => {
    if (!selectedGroupMembers) return

    try {
      await familyGroupService.addPerson(personId, selectedGroupMembers.group.id)
      const memberIds = await familyGroupService.getPersons(selectedGroupMembers.group.id)
      setSelectedGroupMembers({ ...selectedGroupMembers, memberIds })
    } catch (error) {
      console.error('Failed to add member:', error)
      alert('Failed to add member')
    }
  }

  const handleRemoveMember = async (personId: string) => {
    if (!selectedGroupMembers) return

    try {
      await familyGroupService.removePerson(personId, selectedGroupMembers.group.id)
      const memberIds = await familyGroupService.getPersons(selectedGroupMembers.group.id)
      setSelectedGroupMembers({ ...selectedGroupMembers, memberIds })
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4">Loading family groups...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Family Groups</h2>
          <p className="text-gray-600 mt-1">
            Organize your family members into groups (e.g., Smith Family, Johnson Family)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No family groups yet</h3>
          <p className="text-gray-600 mb-6">Create your first family group to organize people</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Group</span>
          </button>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleManageMembers(group)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manage Members</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingGroup ? 'Edit Group' : 'Create Group'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Users className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Smith Family"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Extended Smith family..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {selectedGroupMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                Manage Members - {selectedGroupMembers.group.name}
              </h2>
              <button
                onClick={() => setSelectedGroupMembers(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Users className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                Current Members ({selectedGroupMembers.memberIds.length})
              </h3>

              {selectedGroupMembers.memberIds.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No members yet</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {selectedGroupMembers.memberIds.map((personId) => {
                    const person = persons.find((p) => p.id === personId)
                    if (!person) return null

                    return (
                      <div
                        key={personId}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <span className="font-medium text-gray-800">
                          {person.first_name} {person.last_name}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(personId)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <h3 className="font-semibold text-gray-800 mb-4 pt-4 border-t">Add Members</h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {persons
                  .filter((p) => !selectedGroupMembers.memberIds.includes(p.id))
                  .map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="font-medium text-gray-800">
                        {person.first_name} {person.last_name}
                      </span>
                      <button
                        onClick={() => handleAddMember(person.id)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>

              <div className="pt-6 border-t mt-6">
                <button
                  onClick={() => setSelectedGroupMembers(null)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
