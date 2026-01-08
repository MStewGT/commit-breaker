import { useState } from 'react'
import styles from './EmbedCode.module.css'

interface Props {
  username: string
}

export default function EmbedCode({ username }: Props) {
  const [copied, setCopied] = useState(false)

  const embedCode = `<iframe
  src="${window.location.origin}/embed?user=${username}"
  width="800"
  height="500"
  frameborder="0"
  title="Commit Breaker - ${username}">
</iframe>`

  const shareUrl = `${window.location.origin}/?user=${username}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.title}>Share Link</h3>
        <div className={styles.codeWrapper}>
          <code className={styles.code}>{shareUrl}</code>
          <button
            onClick={() => copyToClipboard(shareUrl)}
            className={styles.copyButton}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.title}>Embed Code</h3>
        <div className={styles.codeWrapper}>
          <pre className={styles.pre}>{embedCode}</pre>
          <button
            onClick={() => copyToClipboard(embedCode)}
            className={styles.copyButton}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
