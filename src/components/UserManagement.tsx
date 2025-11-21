import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Check, X, Shield, Eye, Edit2, Crown, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { UserProfile, UserRole } from '../types/auth'

interface UserWithDetails extends UserProfile {
  email: string
  claimed_person?: {
    first_name: string
    last_name: string | null
  }
}

export function UserManagement() {
  const { t } = useTranslation()
  const { userProfile, refreshUserProfile } = useAuth()
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check if current user is Owner
  const isOwner = userProfile?.role === 'OWNER'

  useEffect(() => {
    if (isOwner) {
      fetchUsers()
    }
  }, [isOwner])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch user profiles with email and claimed person info
      const { data: profiles, error: profileError } = await supabase
        .from('user_profile')
        .select(`
          *,
          claimed_person:person(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (profileError) throw profileError

      // Fetch auth users to get emails
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) throw authError

      // Combine profiles with auth user emails
      const usersWithDetails: UserWithDetails[] = profiles.map((profile: any) => {
        const authUser = authUsers.find(u => u.id === profile.id)
        return {
          ...profile,
          email: authUser?.email || 'Unknown',
          claimed_person: profile.claimed_person,
        }
      })

      setUsers(usersWithDetails)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ approved: true })
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
      await refreshUserProfile()
    } catch (err: any) {
      alert(`Failed to approve user: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return
    }

    setActionLoading(userId)
    try {
      // Delete user profile (cascade will handle auth.users)
      const { error } = await supabase
        .from('user_profile')
        .delete()
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
    } catch (err: any) {
      alert(`Failed to reject user: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    // Prevent changing own role
    if (userId === userProfile?.id) {
      alert('You cannot change your own role')
      return
    }

    // Prevent demoting the last owner
    if (newRole !== 'OWNER') {
      const ownerCount = users.filter(u => u.role === 'OWNER').length
      const user = users.find(u => u.id === userId)
      if (user?.role === 'OWNER' && ownerCount === 1) {
        alert('Cannot change role: There must be at least one Owner')
        return
      }
    }

    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
      await refreshUserProfile()
    } catch (err: any) {
      alert(`Failed to change role: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-purple-600" />
      case 'CONTRIBUTOR':
        return <Edit2 className="w-4 h-4 text-blue-600" />
      case 'VIEWER':
        return <Eye className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'CONTRIBUTOR':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (!isOwner) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Access denied. Only Owners can manage users.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    )
  }

  const pendingUsers = users.filter(u => !u.approved)
  const approvedUsers = users.filter(u => u.approved)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        </div>
        <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{user.email}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </div>
                  {user.claimed_person && (
                    <p className="text-sm text-gray-600">
                      Claimed: {user.claimed_person.first_name} {user.claimed_person.last_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Registered: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === user.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Users */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Approved Users ({approvedUsers.length})
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claimed Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {approvedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                      disabled={actionLoading === user.id || user.id === userProfile?.id}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-1 ${getRoleBadgeColor(user.role)} disabled:opacity-50`}
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.claimed_person ? (
                      <>
                        {user.claimed_person.first_name} {user.claimed_person.last_name}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Not claimed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.id === userProfile?.id ? (
                      <span className="text-gray-500 italic">You</span>
                    ) : (
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        disabled={actionLoading === user.id}
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
