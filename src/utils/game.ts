import { Ball, Brick, Paddle, ContributionData } from '../types'
import { getBrickHits } from './github'

export const GAME_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,
  paddleWidth: 100,
  paddleHeight: 12,
  paddleSpeed: 8,
  ballRadius: 6,
  ballSpeed: 5,
  brickPadding: 2,
  brickTopOffset: 40,
}

export function createBricksFromContributions(
  contributions: ContributionData,
  canvasWidth: number,
  canvasHeight: number
): Brick[] {
  const bricks: Brick[] = []
  const weeks = contributions.weeks

  if (weeks.length === 0) return bricks

  const cols = weeks.length
  const rows = 7 // Days in a week

  const brickWidth = (canvasWidth - GAME_CONFIG.brickPadding * (cols + 1)) / cols
  const brickHeight = Math.min(
    12,
    (canvasHeight * 0.4 - GAME_CONFIG.brickTopOffset - GAME_CONFIG.brickPadding * (rows + 1)) / rows
  )

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, dayIndex) => {
      const hits = getBrickHits(day.contributionCount)

      if (hits > 0) {
        bricks.push({
          x: GAME_CONFIG.brickPadding + weekIndex * (brickWidth + GAME_CONFIG.brickPadding),
          y: GAME_CONFIG.brickTopOffset + dayIndex * (brickHeight + GAME_CONFIG.brickPadding),
          width: brickWidth,
          height: brickHeight,
          hits,
          maxHits: hits,
          contributions: day.contributionCount,
          active: true,
        })
      }
    })
  })

  return bricks
}

export function createInitialBall(canvasWidth: number, canvasHeight: number): Ball {
  return {
    x: canvasWidth / 2,
    y: canvasHeight - 50,
    dx: GAME_CONFIG.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
    dy: -GAME_CONFIG.ballSpeed,
    radius: GAME_CONFIG.ballRadius,
  }
}

export function createInitialPaddle(canvasWidth: number, canvasHeight: number): Paddle {
  return {
    x: (canvasWidth - GAME_CONFIG.paddleWidth) / 2,
    y: canvasHeight - 30,
    width: GAME_CONFIG.paddleWidth,
    height: GAME_CONFIG.paddleHeight,
  }
}

export function checkBallPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  return (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  )
}

export function checkBallBrickCollision(ball: Ball, brick: Brick): boolean {
  if (!brick.active) return false

  return (
    ball.x + ball.radius > brick.x &&
    ball.x - ball.radius < brick.x + brick.width &&
    ball.y + ball.radius > brick.y &&
    ball.y - ball.radius < brick.y + brick.height
  )
}

export function getBrickColor(brick: Brick, theme: 'light' | 'dark' = 'light'): string {
  const intensity = brick.hits / brick.maxHits

  const colors = theme === 'light'
    ? ['#216e39', '#30a14e', '#40c463', '#9be9a8']
    : ['#39d353', '#26a641', '#006d32', '#0e4429']

  if (intensity > 0.66) return colors[0]
  if (intensity > 0.33) return colors[1]
  return colors[2]
}

export function updateBallPosition(
  ball: Ball,
  paddle: Paddle,
  bricks: Brick[],
  canvasWidth: number,
  canvasHeight: number
): { ball: Ball; bricks: Brick[]; score: number; lost: boolean } {
  let newBall = { ...ball }
  let newBricks = [...bricks]
  let score = 0
  let lost = false

  // Move ball
  newBall.x += newBall.dx
  newBall.y += newBall.dy

  // Wall collisions
  if (newBall.x - newBall.radius <= 0 || newBall.x + newBall.radius >= canvasWidth) {
    newBall.dx = -newBall.dx
    newBall.x = Math.max(newBall.radius, Math.min(canvasWidth - newBall.radius, newBall.x))
  }

  if (newBall.y - newBall.radius <= 0) {
    newBall.dy = -newBall.dy
    newBall.y = newBall.radius
  }

  // Paddle collision
  if (checkBallPaddleCollision(newBall, paddle)) {
    // Calculate angle based on where ball hits paddle
    const hitPos = (newBall.x - paddle.x) / paddle.width
    const angle = (hitPos - 0.5) * Math.PI * 0.7
    const speed = Math.sqrt(newBall.dx * newBall.dx + newBall.dy * newBall.dy)

    newBall.dx = speed * Math.sin(angle)
    newBall.dy = -Math.abs(speed * Math.cos(angle))
    newBall.y = paddle.y - newBall.radius
  }

  // Brick collisions
  for (let i = 0; i < newBricks.length; i++) {
    if (checkBallBrickCollision(newBall, newBricks[i])) {
      newBricks[i] = { ...newBricks[i], hits: newBricks[i].hits - 1 }

      if (newBricks[i].hits <= 0) {
        newBricks[i].active = false
        score = newBricks[i].contributions
      }

      // Determine collision side
      const brickCenterX = newBricks[i].x + newBricks[i].width / 2
      const brickCenterY = newBricks[i].y + newBricks[i].height / 2

      const dx = newBall.x - brickCenterX
      const dy = newBall.y - brickCenterY

      if (Math.abs(dx / newBricks[i].width) > Math.abs(dy / newBricks[i].height)) {
        newBall.dx = -newBall.dx
      } else {
        newBall.dy = -newBall.dy
      }

      break
    }
  }

  // Check if ball fell below
  if (newBall.y + newBall.radius >= canvasHeight) {
    lost = true
  }

  return { ball: newBall, bricks: newBricks, score, lost }
}
