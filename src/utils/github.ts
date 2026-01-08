import { ContributionData, ContributionWeek } from '../types'

// Cache for contribution data
const cache = new Map<string, { data: ContributionData; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function parseGitHubUsername(input: string): string | null {
  const trimmed = input.trim()

  // Direct username (alphanumeric and hyphens, 1-39 chars)
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
  if (usernameRegex.test(trimmed)) {
    return trimmed
  }

  // GitHub profile URL patterns
  const urlPatterns = [
    /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/?$/,
    /^github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/?$/,
  ]

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export async function fetchContributions(username: string): Promise<ContributionData> {
  const cacheKey = username.toLowerCase()
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Use GitHub's public contribution calendar endpoint (no auth required)
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found')
    }
    throw new Error('Failed to fetch contributions')
  }

  const data = await response.json()

  // Transform the API response to our format
  const contributionData = transformContributionData(data)

  cache.set(cacheKey, { data: contributionData, timestamp: Date.now() })

  return contributionData
}

function transformContributionData(apiData: {
  total: { lastYear: number }
  contributions: Array<{ date: string; count: number }>
}): ContributionData {
  const contributions = apiData.contributions || []

  // Group contributions by week (7 days each)
  const weeks: ContributionWeek[] = []
  let currentWeek: ContributionWeek = { contributionDays: [] }

  // Get the last 52 weeks of data
  const lastYear = contributions.slice(-364)

  lastYear.forEach((day, index) => {
    currentWeek.contributionDays.push({
      date: day.date,
      contributionCount: day.count,
    })

    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek)
      currentWeek = { contributionDays: [] }
    }
  })

  // Add remaining days if any
  if (currentWeek.contributionDays.length > 0) {
    weeks.push(currentWeek)
  }

  return {
    weeks,
    totalContributions: apiData.total?.lastYear || 0,
  }
}

export function getContributionColor(count: number, theme: 'light' | 'dark' = 'light'): string {
  if (count === 0) return 'transparent'

  const colors = theme === 'light'
    ? ['#9be9a8', '#40c463', '#30a14e', '#216e39']
    : ['#0e4429', '#006d32', '#26a641', '#39d353']

  if (count <= 3) return colors[0]
  if (count <= 9) return colors[1]
  if (count <= 15) return colors[2]
  return colors[3]
}

export function getBrickHits(contributionCount: number): number {
  if (contributionCount === 0) return 0
  if (contributionCount <= 3) return 1
  if (contributionCount <= 9) return 2
  return 3
}
