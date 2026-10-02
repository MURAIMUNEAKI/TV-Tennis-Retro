export type GameMode = 'VS_CPU' | 'TWO_PLAYERS' | 'WALL_PRACTICE' | 'RALLY_ATTACK';

export type CpuDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export type ColorTheme = 'GREEN' | 'MONO' | 'AMBER' | 'ARCADE';

export type GameStatus = 'TITLE' | 'PLAYING' | 'POINT_SCORED' | 'GAME_OVER' | 'PAUSED';

export interface ThemeColors {
  name: string;
  jpName: string;
  bg: string;
  fg: string;
  accent: string;
  paddleP1: string;
  paddleP2: string;
  ball: string;
  net: string;
  glow: string;
  border: string;
}

export const THEMES: Record<ColorTheme, ThemeColors> = {
  GREEN: {
    name: 'Green Phosphor',
    jpName: '昭和グリーン',
    bg: '#051307',
    fg: '#33ff33',
    accent: '#55ff55',
    paddleP1: '#33ff33',
    paddleP2: '#33ff33',
    ball: '#e2ffe2',
    net: '#1f6624',
    glow: 'rgba(51, 255, 51, 0.4)',
    border: '#17401c',
  },
  MONO: {
    name: '1975 B&W',
    jpName: '初代モノクロ',
    bg: '#0a0a0c',
    fg: '#ffffff',
    accent: '#e5e7eb',
    paddleP1: '#ffffff',
    paddleP2: '#ffffff',
    ball: '#ffffff',
    net: '#4b5563',
    glow: 'rgba(255, 255, 255, 0.3)',
    border: '#27272a',
  },
  AMBER: {
    name: 'Amber CRT',
    jpName: '琥珀アンバー',
    bg: '#140c02',
    fg: '#ffb000',
    accent: '#ffd043',
    paddleP1: '#ffb000',
    paddleP2: '#ffb000',
    ball: '#fff3d1',
    net: '#6b4600',
    glow: 'rgba(255, 176, 0, 0.4)',
    border: '#452b02',
  },
  ARCADE: {
    name: 'Arcade Neon',
    jpName: 'アーケードカラー',
    bg: '#090915',
    fg: '#38bdf8',
    accent: '#f43f5e',
    paddleP1: '#38bdf8', // Cyan
    paddleP2: '#f43f5e', // Magenta/Pink
    ball: '#fef08a',     // Bright Yellow
    net: '#334155',
    glow: 'rgba(56, 189, 248, 0.4)',
    border: '#1e293b',
  },
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface ScoreState {
  p1: number;
  p2: number;
  rally: number;
  maxRally: number;
  targetScore: number;
}
