import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Mail, Lock, User, Loader, Search, Apple } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Person } from '../types'

interface SignUpWithClaimProps {
  onSwitchToLogin: () => void
}

export function SignUpWithClaim({ onSwitchToLogin }: SignUpWithClaimProps) {
  const { t } = useTranslation()
  const { signUp, signInWithGoogle, signInWithApple } = useAuth()

  // Form states
  const [step, setStep] = useState<'auth' | 'claim'>('auth')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Person search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Person[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleGoogleSignIn = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
      // OAuth will redirect, so no need to handle success here
    } catch (err: any) {
      setError(err.message || t('auth.errors.signUpFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppleSignIn = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      const { error } = await signInWithApple()
      if (error) {
        setError(error.message)
      }
      // OAuth will redirect, so no need to handle success here
    } catch (err: any) {
      setError(err.message || t('auth.errors.signUpFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!fullName || !email || !password || !confirmPassword) {
      setError(t('auth.errors.fillAllFields'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.errors.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'))
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await signUp(email, password, fullName)

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.errors.emailExists'))
        } else {
          setError(error.message)
        }
        setIsSubmitting(false)
      } else {
        // Move to claim step
        setStep('claim')
        setSearchQuery(fullName)
        setIsSubmitting(false)
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.signUpFailed'))
      setIsSubmitting(false)
    }
  }

  const searchPersons = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('person')
        .select('*')
        .or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`
        )
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])
      if (data?.length === 0) {
        setError(t('auth.claim.noResults'))
      }
    } catch (err: any) {
      setError(err.message || t('auth.claim.searchError'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleClaimPerson = async (person: Person) => {
    setError('')

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(t('auth.errors.notAuthenticated'))
        return
      }

      // Update user profile with claimed person
      const { error } = await supabase
        .from('user_profile')
        .update({ claimed_person_id: person.id })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || t('auth.claim.claimError'))
    }
  }

  const handleCreateNewPerson = () => {
    setSuccess(true)
    // User will create their person later in the app
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {t('auth.claim.successTitle')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('auth.claim.successMessage')}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-6">
            {t('auth.claim.pendingApproval')}
          </div>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('auth.claim.returnToLogin')}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'claim') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('auth.claim.title')}
            </h1>
            <p className="text-gray-600">{t('auth.claim.subtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.claim.searchLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPersons()}
                placeholder={t('auth.claim.searchPlaceholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={searchPersons}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {t('auth.claim.search')}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('auth.claim.resultsTitle')}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {person.first_name} {person.last_name}
                      </p>
                      {person.date_of_birth && (
                        <p className="text-sm text-gray-600">
                          {t('auth.claim.bornOn')}{' '}
                          {new Date(person.date_of_birth).toLocaleDateString(
                            'vi-VN'
                          )}
                        </p>
                      )}
                      {person.birth_place && (
                        <p className="text-sm text-gray-600">
                          {person.birth_place}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleClaimPerson(person)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      {t('auth.claim.claimButton')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-600 text-center mb-4">
              {t('auth.claim.notFound')}
            </p>
            <button
              onClick={handleCreateNewPerson}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              {t('auth.claim.createNew')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('auth.signUp.title')}
          </h1>
          <p className="text-gray-600">{t('auth.signUp.subtitle')}</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700">
              {t('auth.oauth.google')}
            </span>
          </button>

          <button
            onClick={handleAppleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Apple className="w-5 h-5" />
            <span className="font-medium">{t('auth.oauth.apple')}</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              {t('auth.oauth.or')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.signUp.fullName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.signUp.fullNamePlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.signUp.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.signUp.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.signUp.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.signUp.passwordPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('auth.signUp.passwordHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.signUp.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {t('auth.signUp.creatingAccount')}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {t('auth.signUp.submit')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('auth.signUp.hasAccount')}{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('auth.signUp.loginLink')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
