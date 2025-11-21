import { useState } from 'react'
import { X, Download, Upload, FileJson } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { exportFamilyTreeToJSON, downloadJSON, readFileAsText, parseImportedJSON } from '../utils/dataExport'
import { importService } from '../services/importService'
import { usePersonStore } from '../store/usePersonStore'

interface ExportImportModalProps {
  onClose: () => void
  onImportSuccess: () => void
}

export function ExportImportModal({ onClose, onImportSuccess }: ExportImportModalProps) {
  const { t } = useTranslation()
  const { persons, relationships } = usePersonStore()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null)

  const handleExport = () => {
    const jsonString = exportFamilyTreeToJSON(persons, relationships)
    const timestamp = new Date().toISOString().split('T')[0]
    downloadJSON(jsonString, `family-tree-backup-${timestamp}.json`)
    alert(t('exportImport.export.successMessage'))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportFile(file)
    setDuplicateInfo(null)

    try {
      const content = await readFileAsText(file)
      const parsed = parseImportedJSON(content)
      const stats = await importService.getImportStats(parsed)
      const duplicates = await importService.detectDuplicates(parsed)

      setImportPreview(stats)
      setDuplicateInfo(duplicates)
    } catch (error: any) {
      setImportError(error.message)
      setImportFile(null)
      setImportPreview(null)
      setDuplicateInfo(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    // Different confirmation messages based on mode
    let confirmMessage = ''
    if (importMode === 'replace') {
      confirmMessage = t('exportImport.import.confirmReplaceDialog')
    } else {
      // Merge mode
      if (duplicateInfo && duplicateInfo.duplicatePersons > 0) {
        confirmMessage = t('exportImport.import.confirmMergeDialog', {
          newPeople: duplicateInfo.newPersons,
          newRelationships: duplicateInfo.newRelationships,
          duplicatePeople: duplicateInfo.duplicatePersons,
          duplicateRelationships: duplicateInfo.duplicateRelationships
        })
      } else {
        confirmMessage = t('exportImport.import.confirmMergeSafe', {
          newPeople: duplicateInfo?.newPersons || 0,
          newRelationships: duplicateInfo?.newRelationships || 0
        })
      }
    }

    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    setIsImporting(true)
    try {
      const content = await readFileAsText(importFile)
      const parsed = parseImportedJSON(content)
      const result = await importService.importFamilyTree(parsed, importMode)

      if (result.success) {
        alert(t('exportImport.import.success', { message: result.message }))
        onImportSuccess()
        onClose()
      } else {
        setImportError(result.message)
      }
    } catch (error: any) {
      setImportError(error.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{t('exportImport.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Download className="w-5 h-5 inline mr-2" />
            {t('exportImport.exportTab')}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            {t('exportImport.importTab')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{t('exportImport.export.heading')}</h3>
                <p className="text-blue-800 text-sm">
                  {t('exportImport.export.description')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('exportImport.export.stats.people')}</span>
                  <span className="font-semibold text-gray-800">{persons.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('exportImport.export.stats.relationships')}</span>
                  <span className="font-semibold text-gray-800">{relationships.length}</span>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={persons.length === 0}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t('exportImport.export.downloadButton')}
              </button>

              <p className="text-gray-500 text-xs text-center">
                {t('exportImport.export.fileInfo')}
              </p>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Import Mode Selector */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">{t('exportImport.import.mode.title')}</h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={(e) => setImportMode(e.target.value as 'merge')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-blue-900">{t('exportImport.import.mode.merge.title')}</div>
                      <div className="text-sm text-blue-800">
                        {t('exportImport.import.mode.merge.description')}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value as 'replace')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-red-900">{t('exportImport.import.mode.replace.title')}</div>
                      <div className="text-sm text-red-800">
                        {t('exportImport.import.mode.replace.description')}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                    {t('exportImport.import.chooseFile')}
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-1">{t('exportImport.import.dragDrop')}</p>
              </div>

              {importFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{t('exportImport.import.selectedFile')}</h4>
                  <p className="text-sm text-gray-600 mb-3">{importFile.name}</p>

                  {importPreview && (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('exportImport.import.fileStats.totalPeople')}</span>
                        <span className="font-semibold text-gray-800">{importPreview.personsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('exportImport.import.fileStats.totalRelationships')}</span>
                        <span className="font-semibold text-gray-800">{importPreview.relationshipsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('exportImport.import.fileStats.exportDate')}</span>
                        <span className="font-semibold text-gray-800">
                          {new Date(importPreview.exportDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Detection Info */}
                  {duplicateInfo && importMode === 'merge' && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-800 mb-2">{t('exportImport.import.analysis.title')}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700 font-medium">{t('exportImport.import.analysis.newPeople')}</span>
                          <span className="font-semibold text-green-700">{duplicateInfo.newPersons}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700 font-medium">{t('exportImport.import.analysis.newRelationships')}</span>
                          <span className="font-semibold text-green-700">{duplicateInfo.newRelationships}</span>
                        </div>
                        {duplicateInfo.duplicatePersons > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-700 font-medium">{t('exportImport.import.analysis.skipDuplicatePeople')}</span>
                              <span className="font-semibold text-orange-700">{duplicateInfo.duplicatePersons}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-700 font-medium">{t('exportImport.import.analysis.skipDuplicateRelationships')}</span>
                              <span className="font-semibold text-orange-700">{duplicateInfo.duplicateRelationships}</span>
                            </div>
                          </>
                        )}
                        {duplicateInfo.duplicatePersons === 0 && (
                          <div className="text-sm text-gray-600 italic">
                            {t('exportImport.import.analysis.noDuplicates')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{importError}</p>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!importFile || isImporting || !!importError}
                className={`w-full px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 ${
                  importMode === 'replace'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Upload className="w-5 h-5" />
                {isImporting
                  ? t('exportImport.import.importing')
                  : importMode === 'replace'
                  ? t('exportImport.import.mode.replace.button')
                  : t('exportImport.import.mode.merge.button')}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-gray-600 text-sm text-center">
            {t('exportImport.tip')}
          </p>
        </div>
      </div>
    </div>
  )
}
