import { useState, FormEvent } from 'react'
import { parseGitHubUsername } from '../utils/github'
import styles from './UsernameInput.module.css'

interface Props {
  onSubmit: (username: string) => void
  loading: boolean
  error: string | null
}

export default function UsernameInput({ onSubmit, loading, error }: Props) {
  const [input, setInput] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const username = parseGitHubUsername(input)
    if (!username) {
      setValidationError('Please enter a valid GitHub username or profile URL')
      return
    }

    setValidationError(null)
    onSubmit(username)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setValidationError(null)
          }}
          placeholder="GitHub username or profile URL"
          className={styles.input}
          disabled={loading}
          autoFocus
        />
        <button type="submit" className={styles.button} disabled={loading || !input.trim()}>
          {loading ? 'Loading...' : 'Play'}
        </button>
      </div>
      {(validationError || error) && (
        <p className={styles.error}>{validationError || error}</p>
      )}
    </form>
  )
}
