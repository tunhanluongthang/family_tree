import { useState } from 'react'
import { Users, TreePine, Network, UsersRound, Moon, Sun, Languages, LogOut, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonList } from './components/PersonList'
import { FamilyTreeView } from './components/FamilyTreeView'
import { FamilyGroupsList } from './components/FamilyGroupsList'
import { Login } from './components/Login'
import { SignUpWithClaim } from './components/SignUpWithClaim'
import { UserManagement } from './components/UserManagement'
import { usePersonStore } from './store/usePersonStore'
import { useTheme } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'

type View = 'home' | 'people' | 'tree' | 'groups' | 'users'
type AuthView = 'login' | 'signup'

function App() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [authView, setAuthView] = useState<AuthView>('login')
  const { persons } = usePersonStore()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const { user, userProfile, permissions, loading, signOut } = useAuth()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Show auth screens if not logged in
  if (!user) {
    return (
      <>
        {authView === 'login' && (
          <Login onSwitchToSignUp={() => setAuthView('signup')} />
        )}
        {authView === 'signup' && (
          <SignUpWithClaim onSwitchToLogin={() => setAuthView('login')} />
        )}
      </>
    )
  }

  // Show pending approval message if user is not approved
  if (userProfile && !userProfile.approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Pending Approval
          </h1>
          <p className="text-gray-600 mb-6">
            Your account is awaiting approval from an administrator. You'll receive an email notification once your account is approved.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-6">
            <p className="font-medium mb-2">Account Details:</p>
            <p>Role: {userProfile.role}</p>
            <p>Email: {user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Main app (user is authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TreePine className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{t('app.title')}</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-13">{t('app.subtitle')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleLanguage()
                }}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle language"
                type="button"
              >
                <div className="flex items-center gap-2 pointer-events-none">
                  <Languages className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {i18n.language === 'en' ? 'VI' : 'EN'}
                  </span>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleTheme()
                }}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('theme.toggleLabel')}
                type="button"
              >
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-yellow-500 pointer-events-none" />
                ) : (
                  <Moon className="w-6 h-6 text-indigo-600 pointer-events-none" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSignOut()
                }}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label={t('auth.logout')}
                type="button"
              >
                <LogOut className="w-6 h-6 text-red-600 dark:text-red-400 pointer-events-none" />
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                currentView === 'home'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <TreePine className="w-5 h-5" />
              <span>{t('nav.home')}</span>
            </button>
            <button
              onClick={() => setCurrentView('people')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                currentView === 'people'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>{t('nav.people')}</span>
            </button>
            <button
              onClick={() => setCurrentView('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                currentView === 'tree'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Network className="w-5 h-5" />
              <span>{t('nav.tree')}</span>
            </button>
            <button
              onClick={() => setCurrentView('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                currentView === 'groups'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <UsersRound className="w-5 h-5" />
              <span>{t('nav.groups')}</span>
            </button>
            {userProfile?.role === 'OWNER' && (
              <button
                onClick={() => setCurrentView('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  currentView === 'users'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Users</span>
              </button>
            )}
          </div>
        </nav>

        {/* Main Content */}
        {currentView === 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center py-12">
              <Users className="w-24 h-24 text-indigo-400 dark:text-indigo-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('home.welcome')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {t('home.description')}
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentView('people')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors font-medium"
                >
                  {t('home.getStarted')}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{persons.length}</div>
                <div className="text-gray-600 dark:text-gray-300">{t('home.stats.familyMembers')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">0</div>
                <div className="text-gray-600 dark:text-gray-300">{t('home.stats.generations')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">0</div>
                <div className="text-gray-600 dark:text-gray-300">{t('home.stats.familyGroups')}</div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'people' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <PersonList />
          </div>
        )}

        {currentView === 'tree' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <FamilyTreeView />
          </div>
        )}

        {currentView === 'groups' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <FamilyGroupsList />
          </div>
        )}

        {currentView === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
