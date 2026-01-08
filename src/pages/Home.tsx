import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import UsernameInput from '../components/UsernameInput'
import Game from '../components/Game'
import EmbedCode from '../components/EmbedCode'
import { ContributionData } from '../types'
import { fetchContributions } from '../utils/github'
import styles from './Home.module.css'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [username, setUsername] = useState<string | null>(null)
  const [contributions, setContributions] = useState<ContributionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle URL parameter for direct links
  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam && !username) {
      handleSubmit(userParam)
    }
  }, [searchParams])

  const handleSubmit = async (user: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchContributions(user)
      setUsername(user)
      setContributions(data)
      setSearchParams({ user })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contributions')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUsername(null)
    setContributions(null)
    setSearchParams({})
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Commit Breaker</h1>
        <p className={styles.subtitle}>
          Turn your GitHub contributions into a brick breaker game
        </p>
      </header>

      <main className={styles.main}>
        {!contributions ? (
          <UsernameInput onSubmit={handleSubmit} loading={loading} error={error} />
        ) : (
          <>
            <Game
              contributions={contributions}
              username={username!}
              onReset={handleReset}
            />
            <EmbedCode username={username!} />
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Built with React + Canvas
        </p>
      </footer>
    </div>
  )
}
