import { useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person, PersonInput } from '../types'
import { validation } from '../utils/validation'

interface PersonFormProps {
  person?: Person
  onSubmit: (data: PersonInput, photoFile?: File | null) => Promise<void>
  onCancel: () => void
}

export function PersonForm({ person, onSubmit, onCancel }: PersonFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<PersonInput>({
    first_name: person?.first_name || '',
    last_name: person?.last_name || '',
    maiden_name: person?.maiden_name || '',
    gender: person?.gender || undefined,
    date_of_birth: person?.date_of_birth || '',
    date_of_death: person?.date_of_death || '',
    birth_place: person?.birth_place || '',
    birth_order: person?.birth_order || undefined,
    biography: person?.biography || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(person?.profile_photo_url || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const validationResult = validation.validatePerson(formData)
    if (!validationResult.valid) {
      setErrors(validationResult.errors)
      return
    }

    // Clean data: convert empty strings to null for optional fields (not undefined!)
    // Using null instead of undefined ensures Supabase properly clears fields

    // Determine photo URL:
    // - If user removed photo (no preview and person had one), set to null
    // - If editing and didn't change photo, keep existing URL
    // - If new photo selected, it will be uploaded separately and URL set after
    let photoUrl: string | null | undefined
    if (!photoPreview && person?.profile_photo_url) {
      // User removed the photo
      photoUrl = null
    } else if (!photoFile && person?.profile_photo_url) {
      // Editing, keeping existing photo
      photoUrl = person.profile_photo_url
    } else {
      // New person or will upload new photo
      photoUrl = undefined
    }

    const cleanedData: PersonInput = {
      first_name: formData.first_name,
      last_name: formData.last_name || null,
      maiden_name: formData.maiden_name || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      date_of_death: formData.date_of_death || null,
      birth_place: formData.birth_place || null,
      birth_order: formData.birth_order || null,
      biography: formData.biography || null,
      profile_photo_url: photoUrl
    }

    setIsSubmitting(true)
    try {
      // Pass both cleaned data and photo file to parent
      await onSubmit(cleanedData, photoFile)
    } catch (error: any) {
      console.error('Failed to save person:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error'
      alert(t('personForm.errors.saveFailed', { message: errorMessage }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof PersonInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(t('personForm.errors.invalidImage'))
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('personForm.errors.imageTooLarge'))
        return
      }

      setPhotoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {person ? t('personForm.titleEdit') : t('personForm.titleNew')}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Photo */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt={t('personForm.profilePreview')}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title={t('personForm.removePhoto')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('personForm.profilePhoto')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  file:cursor-pointer cursor-pointer"
              />
              <p className="text-gray-500 text-xs mt-1">
                {t('personForm.helpText.photoFormats')}
              </p>
            </div>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.firstName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('personForm.placeholders.firstName')}
              required
            />
            {errors.first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.lastName')}
            </label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('personForm.placeholders.lastName')}
            />
          </div>

          {/* Maiden Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.maidenName')}
            </label>
            <input
              type="text"
              value={formData.maiden_name || ''}
              onChange={(e) => handleChange('maiden_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('personForm.placeholders.maidenName')}
            />
            <p className="text-gray-500 text-sm mt-1">{t('personForm.helpText.maidenName')}</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.gender')}
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('personForm.selectGender')}</option>
              <option value="male">{t('personForm.genderOptions.male')}</option>
              <option value="female">{t('personForm.genderOptions.female')}</option>
              <option value="other">{t('personForm.genderOptions.other')}</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.birthDate')}
            </label>
            <input
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date_of_birth && (
              <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>
            )}
          </div>

          {/* Death Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.deathDate')}
            </label>
            <input
              type="date"
              value={formData.date_of_death || ''}
              onChange={(e) => handleChange('date_of_death', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.date_of_death ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date_of_death && (
              <p className="text-red-500 text-sm mt-1">{errors.date_of_death}</p>
            )}
          </div>

          {/* Birth Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.birthPlace')}
            </label>
            <input
              type="text"
              value={formData.birth_place || ''}
              onChange={(e) => handleChange('birth_place', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('personForm.placeholders.birthPlace')}
            />
          </div>

          {/* Birth Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.birthOrder')}
            </label>
            <input
              type="number"
              min="1"
              value={formData.birth_order || ''}
              onChange={(e) => handleChange('birth_order', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('personForm.placeholders.birthOrder')}
            />
            <p className="text-gray-500 text-sm mt-1">{t('personForm.helpText.birthOrder')}</p>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personForm.biography')}
            </label>
            <textarea
              value={formData.biography || ''}
              onChange={(e) => handleChange('biography', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('personForm.placeholders.biography')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? t('personForm.saving') : person ? t('personForm.updatePerson') : t('personForm.addPerson')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('personForm.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
