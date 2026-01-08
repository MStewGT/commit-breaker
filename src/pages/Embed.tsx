import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Game from '../components/Game'
import { ContributionData, Theme } from '../types'
import { fetchContributions } from '../utils/github'
import styles from './Embed.module.css'

export default function Embed() {
  const [searchParams] = useSearchParams()
  const [contributions, setContributions] = useState<ContributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const username = searchParams.get('user')
  const theme = (searchParams.get('theme') as Theme) || 'light'
  const autoplay = searchParams.get('autoplay') === 'true'

  useEffect(() => {
    if (!username) {
      setError('Missing user parameter')
      setLoading(false)
      return
    }

    fetchContributions(username)
      .then(setContributions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className={styles.container} data-theme={theme}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error || !contributions || !username) {
    return (
      <div className={styles.container} data-theme={theme}>
        <div className={styles.error}>{error || 'Failed to load'}</div>
      </div>
    )
  }

  return (
    <div className={styles.container} data-theme={theme}>
      <Game
        contributions={contributions}
        username={username}
        theme={theme}
        autoplay={autoplay}
        embedded
      />
    </div>
  )
}
