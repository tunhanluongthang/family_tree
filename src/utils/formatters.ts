import { format, formatDistance } from 'date-fns'

export const formatters = {
  // Format person's full name
  fullName(person: { first_name: string; last_name?: string | null }): string {
    return [person.first_name, person.last_name].filter(Boolean).join(' ')
  },

  // Format person's name with maiden name if applicable
  fullNameWithMaiden(person: {
    first_name: string
    last_name?: string | null
    maiden_name?: string | null
  }): string {
    const parts = [person.first_name]

    if (person.maiden_name) {
      parts.push(`(${person.maiden_name})`)
    }

    if (person.last_name) {
      parts.push(person.last_name)
    }

    return parts.join(' ')
  },

  // Format date
  date(dateString: string | null | undefined, fallback = 'Unknown'): string {
    if (!dateString) return fallback
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return fallback
    }
  },

  // Format date range (birth - death)
  lifespan(
    birthDate: string | null | undefined,
    deathDate: string | null | undefined
  ): string {
    const birth = birthDate ? this.date(birthDate, '?') : '?'
    const death = deathDate ? this.date(deathDate, '?') : 'Present'
    return `${birth} - ${death}`
  },

  // Calculate age
  age(birthDate: string | null | undefined, deathDate?: string | null): string | null {
    if (!birthDate) return null

    try {
      const birth = new Date(birthDate)
      const end = deathDate ? new Date(deathDate) : new Date()

      const years = end.getFullYear() - birth.getFullYear()
      const monthDiff = end.getMonth() - birth.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        return `${years - 1} years`
      }

      return `${years} years`
    } catch {
      return null
    }
  },

  // Format relative time
  relativeTime(dateString: string | null | undefined): string {
    if (!dateString) return 'Unknown'
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  },

  // Format generation number
  generation(gen: number): string {
    if (gen === 0) return 'Current'
    if (gen === -1) return '1st Generation (Parents)'
    if (gen === -2) return '2nd Generation (Grandparents)'
    if (gen === -3) return '3rd Generation (Great-Grandparents)'
    if (gen < 0) return `${Math.abs(gen)}th Generation`
    if (gen === 1) return '1st Generation (Children)'
    if (gen === 2) return '2nd Generation (Grandchildren)'
    return `${gen}th Generation`
  },

  // Format birth order
  birthOrder(order: number | null | undefined): string | null {
    if (!order) return null

    const suffixes = ['th', 'st', 'nd', 'rd']
    const lastDigit = order % 10
    const lastTwoDigits = order % 100

    // Special cases for 11th, 12th, 13th
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${order}th child`
    }

    const suffix = lastDigit < 4 ? suffixes[lastDigit] : suffixes[0]
    return `${order}${suffix} child`
  }
}
