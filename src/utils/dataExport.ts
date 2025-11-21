import type { Person, Relationship, FamilyGroup } from '../types'

export interface FamilyTreeExport {
  version: string
  exportDate: string
  data: {
    persons: Person[]
    relationships: Relationship[]
    familyGroups?: FamilyGroup[]
  }
}

/**
 * Export family tree data to JSON
 */
export function exportFamilyTreeToJSON(
  persons: Person[],
  relationships: Relationship[],
  familyGroups?: FamilyGroup[]
): string {
  const exportData: FamilyTreeExport = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      persons,
      relationships,
      familyGroups
    }
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download JSON file to user's computer
 */
export function downloadJSON(jsonString: string, filename: string = 'family-tree-backup.json') {
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate imported JSON file
 */
export function parseImportedJSON(jsonString: string): FamilyTreeExport {
  try {
    const data = JSON.parse(jsonString) as FamilyTreeExport

    // Validate structure
    if (!data.version || !data.data || !data.data.persons || !data.data.relationships) {
      throw new Error('Invalid family tree backup file format')
    }

    // Validate persons array
    if (!Array.isArray(data.data.persons)) {
      throw new Error('Invalid persons data')
    }

    // Validate relationships array
    if (!Array.isArray(data.data.relationships)) {
      throw new Error('Invalid relationships data')
    }

    return data
  } catch (error: any) {
    throw new Error(`Failed to parse import file: ${error.message}`)
  }
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('File reading error'))
    reader.readAsText(file)
  })
}
