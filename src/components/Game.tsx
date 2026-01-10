import { useRef, useEffect, useCallback, useState } from 'react'
import { ContributionData, GameState, Theme } from '../types'
import {
  createBricksFromContributions,
  createInitialBall,
  createInitialPaddle,
  updateBallPosition,
  getBrickColor,
  GAME_CONFIG,
} from '../utils/game'
import styles from './Game.module.css'

interface Props {
  contributions: ContributionData
  username: string
  theme?: Theme
  autoplay?: boolean
  onReset?: () => void
  embedded?: boolean
}

export default function Game({
  contributions,
  username,
  theme = 'light',
  autoplay = false,
  onReset,
  embedded = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>(() => initializeGame())
  const [dimensions, setDimensions] = useState({
    width: GAME_CONFIG.canvasWidth,
    height: GAME_CONFIG.canvasHeight,
  })

  const keysRef = useRef<Set<string>>(new Set())
  const touchRef = useRef<number | null>(null)
  const frameRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  function initializeGame(): GameState {
    const bricks = createBricksFromContributions(
      contributions,
      GAME_CONFIG.canvasWidth,
      GAME_CONFIG.canvasHeight
    )
    return {
      status: autoplay ? 'playing' : 'idle',
      score: 0,
      bricks,
      ball: createInitialBall(GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight),
      paddle: createInitialPaddle(GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight),
    }
  }

  const resetGame = useCallback(() => {
    setGameState(initializeGame())
  }, [contributions, autoplay])

  const restartGame = useCallback(() => {
    const bricks = createBricksFromContributions(
      contributions,
      GAME_CONFIG.canvasWidth,
      GAME_CONFIG.canvasHeight
    )

    setGameState({
      status: 'playing',
      score: 0,
      bricks,
      ball: createInitialBall(GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight),
      paddle: createInitialPaddle(GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight),
    })
  }, [contributions])

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement
      if (!container) return

      const maxWidth = Math.min(container.clientWidth - 32, GAME_CONFIG.canvasWidth)
      const scale = maxWidth / GAME_CONFIG.canvasWidth
      const height = GAME_CONFIG.canvasHeight * scale

      setDimensions({ width: maxWidth, height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) {
        e.preventDefault()
        keysRef.current.add(e.key)

        if (e.key === ' ') {
          if (gameState.status === 'idle') {
            setGameState((prev) => ({ ...prev, status: 'playing' }))
          } else if (gameState.status === 'won' || gameState.status === 'lost') {
            restartGame()
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState.status])

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (gameState.status === 'idle') {
        setGameState((prev) => ({ ...prev, status: 'playing' }))
      } else if (gameState.status === 'won' || gameState.status === 'lost') {
        restartGame()
      }
      touchRef.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (touchRef.current === null) return

      const scale = dimensions.width / GAME_CONFIG.canvasWidth
      const touchX = e.touches[0].clientX
      const delta = (touchX - touchRef.current) / scale

      setGameState((prev) => {
        const newX = Math.max(
          0,
          Math.min(
            GAME_CONFIG.canvasWidth - prev.paddle.width,
            prev.paddle.x + delta
          )
        )
        return { ...prev, paddle: { ...prev.paddle, x: newX } }
      })

      touchRef.current = touchX
    }

    const handleTouchEnd = () => {
      touchRef.current = null
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState.status, dimensions.width])

  // Mouse control
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scale = dimensions.width / GAME_CONFIG.canvasWidth
      const mouseX = (e.clientX - rect.left) / scale

      setGameState((prev) => {
        const newX = Math.max(
          0,
          Math.min(
            GAME_CONFIG.canvasWidth - prev.paddle.width,
            mouseX - prev.paddle.width / 2
          )
        )
        return { ...prev, paddle: { ...prev.paddle, x: newX } }
      })
    }

    const handleClick = () => {
      if (gameState.status === 'idle') {
        setGameState((prev) => ({ ...prev, status: 'playing' }))
      } else if (gameState.status === 'won' || gameState.status === 'lost') {
        restartGame()
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [gameState.status, dimensions.width])

  // Game loop
  useEffect(() => {
    if (gameState.status !== 'playing') return

    const gameLoop = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp
      }

      const rawDelta = (timestamp - lastFrameTimeRef.current) / 16.67 // Normalize to 60fps
      const deltaTime = Math.min(rawDelta, 2) // Cap deltaTime to prevent ball tunneling
      lastFrameTimeRef.current = timestamp

      setGameState((prev) => {
        // Handle keyboard paddle movement
        let newPaddle = { ...prev.paddle }
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          newPaddle.x = Math.max(0, newPaddle.x - GAME_CONFIG.paddleSpeed * deltaTime)
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          newPaddle.x = Math.min(
            GAME_CONFIG.canvasWidth - newPaddle.width,
            newPaddle.x + GAME_CONFIG.paddleSpeed * deltaTime
          )
        }

        const { ball, bricks, score, lost } = updateBallPosition(
          prev.ball,
          newPaddle,
          prev.bricks,
          GAME_CONFIG.canvasWidth,
          GAME_CONFIG.canvasHeight,
          deltaTime
        )

        const activeBricks = bricks.filter((b) => b.active)
        const won = activeBricks.length === 0

        return {
          ...prev,
          ball,
          bricks,
          paddle: newPaddle,
          score: prev.score + score,
          status: lost ? 'lost' : won ? 'won' : 'playing',
        }
      })

      frameRef.current = requestAnimationFrame(gameLoop)
    }

    lastFrameTimeRef.current = 0
    frameRef.current = requestAnimationFrame(gameLoop)
    return () => {
      cancelAnimationFrame(frameRef.current)
      lastFrameTimeRef.current = 0
    }
  }, [gameState.status])

  // Render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = dimensions.width / GAME_CONFIG.canvasWidth

    // Clear canvas with transparency to show glass morphism background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    ctx.save()
    ctx.scale(scale, scale)

    // Draw bricks (no shadows for performance)
    gameState.bricks.forEach((brick) => {
      if (!brick.active) return

      const color = getBrickColor(brick, theme)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3)
      ctx.fill()

      // Subtle highlight border for depth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // Draw paddle with glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.beginPath()
    ctx.roundRect(
      gameState.paddle.x,
      gameState.paddle.y,
      gameState.paddle.width,
      gameState.paddle.height,
      6
    )
    ctx.fill()

    // Paddle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Draw ball with subtle glow
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.restore()

    // Draw overlays
    if (gameState.status === 'idle') {
      drawOverlay(ctx, 'Click or press Space to start', dimensions)
    } else if (gameState.status === 'won') {
      drawOverlay(ctx, 'You won!', dimensions)
    } else if (gameState.status === 'lost') {
      drawOverlay(ctx, 'Game over!', dimensions)
    }
  }, [gameState, theme, dimensions])

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    text: string,
    dims: { width: number; height: number }
  ) {
    // Glass overlay effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, dims.width, dims.height)

    // Glass card in center
    const cardWidth = Math.min(400, dims.width * 0.8)
    const cardHeight = 80
    const cardX = (dims.width - cardWidth) / 2
    const cardY = (dims.height - cardHeight) / 2

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Text with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.max(16, dims.width / 30)}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, dims.width / 2, dims.height / 2)
    ctx.shadowBlur = 0
  }

  const activeBricks = gameState.bricks.filter((b) => b.active).length
  const totalBricks = gameState.bricks.length

  return (
    <div className={styles.container} data-theme={theme}>
      {!embedded && (
        <div className={styles.header}>
          <div className={styles.info}>
            <span className={styles.username}>@{username}</span>
            <span className={styles.stats}>
              {contributions.totalContributions.toLocaleString()} contributions
            </span>
          </div>
          <div className={styles.score}>
            Score: {gameState.score} | Bricks: {totalBricks - activeBricks}/{totalBricks}
          </div>
        </div>
      )}

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={styles.canvas}
        />
      </div>

      {embedded && (
        <div className={styles.embedScore}>
          Score: {gameState.score} | @{username}
        </div>
      )}

      {!embedded && (
        <div className={styles.actions} style={{ visibility: (gameState.status === 'won' || gameState.status === 'lost') ? 'visible' : 'hidden' }}>
          <button onClick={resetGame} className={styles.button}>
            Play Again
          </button>
          {onReset && (
            <button onClick={onReset} className={styles.buttonSecondary}>
              New User
            </button>
          )}
        </div>
      )}

      {embedded && (gameState.status === 'won' || gameState.status === 'lost') && (
        <button onClick={resetGame} className={styles.embedButton}>
          Play Again
        </button>
      )}
    </div>
  )
}
