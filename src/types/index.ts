export interface ContributionDay {
  date: string
  contributionCount: number
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface ContributionData {
  weeks: ContributionWeek[]
  totalContributions: number
}

export interface Brick {
  x: number
  y: number
  width: number
  height: number
  hits: number
  maxHits: number
  contributions: number
  active: boolean
}

export interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

export interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'won' | 'lost'
  score: number
  bricks: Brick[]
  ball: Ball
  paddle: Paddle
}

export type Theme = 'light' | 'dark'
