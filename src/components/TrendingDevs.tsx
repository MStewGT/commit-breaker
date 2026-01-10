import styles from './TrendingDevs.module.css'

interface Developer {
  username: string
  name: string
  avatar: string
}

// Curated list of active developers with interesting contribution graphs
const FEATURED_DEVS: Developer[] = [
  { username: 'sindresorhus', name: 'Sindre Sorhus', avatar: 'https://avatars.githubusercontent.com/u/170270?s=96&v=4' },
  { username: 'tj', name: 'TJ Holowaychuk', avatar: 'https://avatars.githubusercontent.com/u/25254?s=96&v=4' },
  { username: 'yyx990803', name: 'Evan You', avatar: 'https://avatars.githubusercontent.com/u/499550?s=96&v=4' },
  { username: 'gaearon', name: 'Dan Abramov', avatar: 'https://avatars.githubusercontent.com/u/810438?s=96&v=4' },
  { username: 'addyosmani', name: 'Addy Osmani', avatar: 'https://avatars.githubusercontent.com/u/110953?s=96&v=4' },
  { username: 'kentcdodds', name: 'Kent C. Dodds', avatar: 'https://avatars.githubusercontent.com/u/1500684?s=96&v=4' },
  { username: 'antfu', name: 'Anthony Fu', avatar: 'https://avatars.githubusercontent.com/u/11247099?s=96&v=4' },
  { username: 'torvalds', name: 'Linus Torvalds', avatar: 'https://avatars.githubusercontent.com/u/1024025?s=96&v=4' },
]

interface Props {
  onSelect: (username: string) => void
  disabled?: boolean
}

export default function TrendingDevs({ onSelect, disabled }: Props) {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Or try a popular developer:</p>
      <div className={styles.grid}>
        {FEATURED_DEVS.map((dev) => (
          <button
            key={dev.username}
            className={styles.card}
            onClick={() => onSelect(dev.username)}
            disabled={disabled}
            title={`Play as @${dev.username}`}
          >
            <img
              src={dev.avatar}
              alt={dev.name}
              className={styles.avatar}
              loading="lazy"
            />
            <div className={styles.info}>
              <span className={styles.name}>{dev.name}</span>
              <span className={styles.username}>@{dev.username}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
