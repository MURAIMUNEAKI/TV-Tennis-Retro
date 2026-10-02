import React, { useRef, useEffect, useCallback } from 'react';
import { GameMode, CpuDifficulty, ThemeColors, GameStatus, Particle, ScoreState } from '../types/game';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  gameMode: GameMode;
  difficulty: CpuDifficulty;
  theme: ThemeColors;
  gameStatus: GameStatus;
  onStatusChange: (status: GameStatus) => void;
  scores: ScoreState;
  onScoreUpdate: (scores: ScoreState) => void;
  isCrtFilter: boolean;
  p1KnobValue: number;
  onP1KnobChange: (val: number) => void;
  p2KnobValue: number;
  onP2KnobChange: (val: number) => void;
  winner: 'P1' | 'P2' | null;
  onGameOver: (winner: 'P1' | 'P2') => void;
  onRestartGame?: () => void;
}

const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 72;
const BALL_SIZE = 12;
const INITIAL_BALL_SPEED = 6.2;
const MAX_BALL_SPEED = 14.5;
const SPEED_INCREMENT = 0.35;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  difficulty,
  theme,
  gameStatus,
  onStatusChange,
  scores,
  onScoreUpdate,
  isCrtFilter,
  p1KnobValue,
  onP1KnobChange,
  p2KnobValue,
  onP2KnobChange,
  winner,
  onGameOver,
  onRestartGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Paddles state
  const p1Y = useRef<number>((COURT_HEIGHT - PADDLE_HEIGHT) / 2);
  const p2Y = useRef<number>((COURT_HEIGHT - PADDLE_HEIGHT) / 2);

  // Ball state
  const ball = useRef({
    x: COURT_WIDTH / 2 - BALL_SIZE / 2,
    y: COURT_HEIGHT / 2 - BALL_SIZE / 2,
    vx: INITIAL_BALL_SPEED,
    vy: (Math.random() - 0.5) * 4,
    speed: INITIAL_BALL_SPEED,
    active: false,
    servingPlayer: 1, // 1 or 2
  });

  // Ball trail for CRT persistence
  const ballTrail = useRef<{ x: number; y: number }[]>([]);

  // Particles
  const particles = useRef<Particle[]>([]);

  // Keyboard keys active
  const keys = useRef<{ [key: string]: boolean }>({});

  // Sync with knob value updates from parent
  useEffect(() => {
    p1Y.current = p1KnobValue * (COURT_HEIGHT - PADDLE_HEIGHT);
  }, [p1KnobValue]);

  useEffect(() => {
    p2Y.current = p2KnobValue * (COURT_HEIGHT - PADDLE_HEIGHT);
  }, [p2KnobValue]);

  // Spawn retro pixel sparks
  const spawnSparks = useCallback((x: number, y: number, color: string, count = 10, dirX = 0) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = Math.random() * 5 + 2;
      particles.current.push({
        x,
        y,
        vx: dirX !== 0 ? Math.sign(dirX) * Math.abs(Math.cos(angle) * speed) : (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() > 0.5 ? 4 : 2,
        color,
        life: 1.0,
        maxLife: Math.random() * 12 + 10,
      });
    }
  }, []);

  // Reset ball for next serve
  const resetBall = useCallback((server: 1 | 2 = 1) => {
    ball.current.speed = INITIAL_BALL_SPEED;
    ball.current.active = false;
    ball.current.servingPlayer = server;
    ballTrail.current = [];

    if (server === 1) {
      ball.current.x = 30 + PADDLE_WIDTH + 6;
      ball.current.y = p1Y.current + PADDLE_HEIGHT / 2 - BALL_SIZE / 2;
      ball.current.vx = INITIAL_BALL_SPEED;
      ball.current.vy = (Math.random() - 0.5) * 3;
    } else {
      if (gameMode === 'WALL_PRACTICE') {
        ball.current.x = 30 + PADDLE_WIDTH + 6;
        ball.current.y = p1Y.current + PADDLE_HEIGHT / 2 - BALL_SIZE / 2;
        ball.current.vx = INITIAL_BALL_SPEED;
        ball.current.vy = (Math.random() - 0.5) * 3;
      } else {
        ball.current.x = COURT_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE - 6;
        ball.current.y = p2Y.current + PADDLE_HEIGHT / 2 - BALL_SIZE / 2;
        ball.current.vx = -INITIAL_BALL_SPEED;
        ball.current.vy = (Math.random() - 0.5) * 3;
      }
    }
  }, [gameMode]);

  // Serve trigger
  const triggerServe = useCallback(() => {
    if (gameStatus === 'GAME_OVER') return;
    ball.current.active = true;
    sound.playServe();
    onStatusChange('PLAYING');
  }, [gameStatus, onStatusChange]);

  // Start game / Initial reset & reset on TITLE
  useEffect(() => {
    resetBall(1);
    particles.current = [];
  }, [gameMode, resetBall]);

  useEffect(() => {
    if (gameStatus === 'TITLE') {
      resetBall(1);
      particles.current = [];
    }
  }, [gameStatus, resetBall]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'GAME_OVER') {
          resetBall(1);
          onRestartGame?.();
        } else if (gameStatus === 'TITLE' || gameStatus === 'POINT_SCORED') {
          triggerServe();
        } else if (gameStatus === 'PLAYING') {
          onStatusChange('PAUSED');
        } else if (gameStatus === 'PAUSED') {
          onStatusChange('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, triggerServe, onStatusChange, onRestartGame, resetBall]);

  // Pointer / Touch tracking on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (gameStatus === 'GAME_OVER') {
      resetBall(1);
      onRestartGame?.();
      return;
    }
    if (gameStatus === 'TITLE' || gameStatus === 'POINT_SCORED') {
      triggerServe();
      return;
    }
    if (gameStatus === 'PAUSED') {
      onStatusChange('PLAYING');
      return;
    }

    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleY = COURT_HEIGHT / rect.height;
    const scaleX = COURT_WIDTH / rect.width;

    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    // Check if 2P mode and user touched right side
    if (gameMode === 'TWO_PLAYERS' && clientX > COURT_WIDTH / 2) {
      const targetP2 = Math.max(0, Math.min(COURT_HEIGHT - PADDLE_HEIGHT, clientY - PADDLE_HEIGHT / 2));
      p2Y.current = targetP2;
      onP2KnobChange(targetP2 / (COURT_HEIGHT - PADDLE_HEIGHT));
    } else {
      const targetP1 = Math.max(0, Math.min(COURT_HEIGHT - PADDLE_HEIGHT, clientY - PADDLE_HEIGHT / 2));
      p1Y.current = targetP1;
      onP1KnobChange(targetP1 / (COURT_HEIGHT - PADDLE_HEIGHT));
    }
  };

  // Main game update & render loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updatePhysics = () => {
      const paddleSpeed = 8;

      // Keyboard input for P1 (W / S)
      if (keys.current['KeyW'] || keys.current['KeyK']) {
        p1Y.current = Math.max(0, p1Y.current - paddleSpeed);
        onP1KnobChange(p1Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
      }
      if (keys.current['KeyS'] || keys.current['KeyJ']) {
        p1Y.current = Math.min(COURT_HEIGHT - PADDLE_HEIGHT, p1Y.current + paddleSpeed);
        onP1KnobChange(p1Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
      }

      // Keyboard input for P2 in 2P mode (Arrow Up / Down)
      if (gameMode === 'TWO_PLAYERS') {
        if (keys.current['ArrowUp']) {
          p2Y.current = Math.max(0, p2Y.current - paddleSpeed);
          onP2KnobChange(p2Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
        }
        if (keys.current['ArrowDown']) {
          p2Y.current = Math.min(COURT_HEIGHT - PADDLE_HEIGHT, p2Y.current + paddleSpeed);
          onP2KnobChange(p2Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
        }
      }

      // CPU AI Logic
      if (gameMode === 'VS_CPU') {
        let cpuSpeed = 5.2;
        let reactionThreshold = 45;
        let predictionError = 0;

        if (difficulty === 'EASY') {
          cpuSpeed = 3.8;
          reactionThreshold = 75;
          predictionError = (Math.sin(Date.now() / 600) * 20);
        } else if (difficulty === 'HARD') {
          cpuSpeed = 7.4;
          reactionThreshold = 20;
          predictionError = 0;
        }

        // Only track when ball is moving towards CPU or past halfway
        const paddleCenter = p2Y.current + PADDLE_HEIGHT / 2;
        const targetY = ball.current.y + BALL_SIZE / 2 + predictionError;

        if (ball.current.vx > 0 && ball.current.x > COURT_WIDTH * 0.25) {
          if (Math.abs(targetY - paddleCenter) > reactionThreshold) {
            if (targetY > paddleCenter) {
              p2Y.current = Math.min(COURT_HEIGHT - PADDLE_HEIGHT, p2Y.current + cpuSpeed);
            } else {
              p2Y.current = Math.max(0, p2Y.current - cpuSpeed);
            }
            onP2KnobChange(p2Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
          }
        } else {
          // Relax towards center when ball is far away
          const courtCenter = COURT_HEIGHT / 2;
          if (Math.abs(courtCenter - paddleCenter) > 40) {
            p2Y.current += (courtCenter - paddleCenter) * 0.02;
            onP2KnobChange(p2Y.current / (COURT_HEIGHT - PADDLE_HEIGHT));
          }
        }
      }

      // If ball is not served yet, stick to the server's paddle
      if (!ball.current.active) {
        if (ball.current.servingPlayer === 1) {
          ball.current.x = 30 + PADDLE_WIDTH + 6;
          ball.current.y = p1Y.current + PADDLE_HEIGHT / 2 - BALL_SIZE / 2;
        } else {
          ball.current.x = COURT_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE - 6;
          ball.current.y = p2Y.current + PADDLE_HEIGHT / 2 - BALL_SIZE / 2;
        }
        return;
      }

      // Ball physics when active
      ball.current.x += ball.current.vx;
      ball.current.y += ball.current.vy;

      // Record trail
      ballTrail.current.unshift({ x: ball.current.x, y: ball.current.y });
      if (ballTrail.current.length > 5) {
        ballTrail.current.pop();
      }

      // Top and bottom boundary bounces
      if (ball.current.y <= 12) {
        ball.current.y = 12;
        ball.current.vy = Math.abs(ball.current.vy);
        sound.playWallBounce();
        spawnSparks(ball.current.x + BALL_SIZE / 2, 12, theme.accent, 8);
      } else if (ball.current.y + BALL_SIZE >= COURT_HEIGHT - 12) {
        ball.current.y = COURT_HEIGHT - 12 - BALL_SIZE;
        ball.current.vy = -Math.abs(ball.current.vy);
        sound.playWallBounce();
        spawnSparks(ball.current.x + BALL_SIZE / 2, COURT_HEIGHT - 12, theme.accent, 8);
      }

      // P1 Paddle Collision (Left)
      const p1X = 30;
      if (
        ball.current.vx < 0 &&
        ball.current.x <= p1X + PADDLE_WIDTH &&
        ball.current.x + BALL_SIZE >= p1X &&
        ball.current.y + BALL_SIZE >= p1Y.current &&
        ball.current.y <= p1Y.current + PADDLE_HEIGHT
      ) {
        // Calculate deflection angle based on where ball hits paddle
        const hitOffset = (ball.current.y + BALL_SIZE / 2) - (p1Y.current + PADDLE_HEIGHT / 2);
        const normalizedOffset = hitOffset / (PADDLE_HEIGHT / 2); // -1.0 (top) to +1.0 (bottom)
        const maxAngle = Math.PI / 3.2; // ~56 degrees
        const angle = normalizedOffset * maxAngle;

        // Accelerate ball speed slightly with each rally
        ball.current.speed = Math.min(MAX_BALL_SPEED, ball.current.speed + SPEED_INCREMENT);
        ball.current.vx = ball.current.speed * Math.cos(angle);
        ball.current.vy = ball.current.speed * Math.sin(angle);
        ball.current.x = p1X + PADDLE_WIDTH + 1;

        // Pitch modification based on deflection angle (higher pitch on smash edge!)
        sound.playPaddleHit(Math.abs(normalizedOffset) * 2);
        spawnSparks(p1X + PADDLE_WIDTH, ball.current.y + BALL_SIZE / 2, theme.paddleP1, 12, 1);

        // Increment rally
        const newRally = scores.rally + 1;
        const newMaxRally = Math.max(scores.maxRally, newRally);
        onScoreUpdate({
          ...scores,
          rally: newRally,
          maxRally: newMaxRally,
        });
      }

      // P2 Paddle Collision OR Wall Practice Bounce (Right)
      if (gameMode === 'WALL_PRACTICE') {
        const wallX = COURT_WIDTH - 24;
        if (ball.current.vx > 0 && ball.current.x + BALL_SIZE >= wallX) {
          ball.current.x = wallX - BALL_SIZE - 1;
          ball.current.vx = -Math.abs(ball.current.vx);
          sound.playWallBounce();
          spawnSparks(wallX, ball.current.y + BALL_SIZE / 2, theme.accent, 14, -1);

          // In wall practice, wall hit scores 1 point
          const newP1 = scores.p1 + 1;
          const newRally = scores.rally + 1;
          const newMax = Math.max(scores.maxRally, newRally);
          onScoreUpdate({
            ...scores,
            p1: newP1,
            rally: newRally,
            maxRally: newMax,
          });
        }
      } else {
        // 2P or CPU paddle collision
        const p2X = COURT_WIDTH - 30 - PADDLE_WIDTH;
        if (
          ball.current.vx > 0 &&
          ball.current.x + BALL_SIZE >= p2X &&
          ball.current.x <= p2X + PADDLE_WIDTH &&
          ball.current.y + BALL_SIZE >= p2Y.current &&
          ball.current.y <= p2Y.current + PADDLE_HEIGHT
        ) {
          const hitOffset = (ball.current.y + BALL_SIZE / 2) - (p2Y.current + PADDLE_HEIGHT / 2);
          const normalizedOffset = hitOffset / (PADDLE_HEIGHT / 2);
          const maxAngle = Math.PI / 3.2;
          const angle = normalizedOffset * maxAngle;

          ball.current.speed = Math.min(MAX_BALL_SPEED, ball.current.speed + SPEED_INCREMENT);
          ball.current.vx = -ball.current.speed * Math.cos(angle);
          ball.current.vy = ball.current.speed * Math.sin(angle);
          ball.current.x = p2X - BALL_SIZE - 1;

          sound.playPaddleHit(Math.abs(normalizedOffset) * 2);
          spawnSparks(p2X, ball.current.y + BALL_SIZE / 2, theme.paddleP2, 12, -1);

          const newRally = scores.rally + 1;
          const newMaxRally = Math.max(scores.maxRally, newRally);
          onScoreUpdate({
            ...scores,
            rally: newRally,
            maxRally: newMaxRally,
          });
        }
      }

      // Point Scored: Ball goes out of bounds (Left or Right)
      if (ball.current.x < -10) {
        // P2 scores (or Wall Practice miss)
        sound.playScore();
        spawnSparks(0, ball.current.y + BALL_SIZE / 2, '#ef4444', 20, 1);

        if (gameMode === 'WALL_PRACTICE') {
          // Reset rally count
          onScoreUpdate({
            ...scores,
            rally: 0,
          });
          resetBall(1);
          onStatusChange('POINT_SCORED');
        } else {
          const newP2 = scores.p2 + 1;
          const newScores = {
            ...scores,
            p2: newP2,
            rally: 0,
          };
          onScoreUpdate(newScores);

          if (scores.targetScore > 0 && newP2 >= scores.targetScore) {
            resetBall(1);
            sound.playVictory();
            onGameOver('P2');
          } else {
            resetBall(1); // Server is player who conceded point
            onStatusChange('POINT_SCORED');
          }
        }
      } else if (ball.current.x > COURT_WIDTH + 10 && gameMode !== 'WALL_PRACTICE') {
        // P1 scores
        sound.playScore();
        spawnSparks(COURT_WIDTH, ball.current.y + BALL_SIZE / 2, '#ef4444', 20, -1);

        const newP1 = scores.p1 + 1;
        const newScores = {
          ...scores,
          p1: newP1,
          rally: 0,
        };
        onScoreUpdate(newScores);

        if (scores.targetScore > 0 && newP1 >= scores.targetScore) {
          resetBall(2);
          sound.playVictory();
          onGameOver('P1');
        } else {
          resetBall(2);
          onStatusChange('POINT_SCORED');
        }
      }

      // Update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;
        if (p.life <= 0) {
          particles.current.splice(i, 1);
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

      // Background CRT glow fill
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

      // Top and Bottom boundary lines (Authentic solid pixel bars)
      ctx.fillStyle = theme.border;
      ctx.fillRect(0, 0, COURT_WIDTH, 10);
      ctx.fillRect(0, COURT_HEIGHT - 10, COURT_WIDTH, 10);

      // Center Dotted Net (except in wall practice)
      if (gameMode !== 'WALL_PRACTICE') {
        ctx.fillStyle = theme.net;
        const netWidth = 6;
        const netDash = 16;
        const netGap = 12;
        const netX = COURT_WIDTH / 2 - netWidth / 2;
        for (let y = 14; y < COURT_HEIGHT - 14; y += netDash + netGap) {
          ctx.fillRect(netX, y, netWidth, netDash);
        }
      }

      // Wall in Wall Practice Mode
      if (gameMode === 'WALL_PRACTICE') {
        const wallX = COURT_WIDTH - 24;
        ctx.fillStyle = theme.paddleP2;
        // Striped brick texture
        for (let y = 14; y < COURT_HEIGHT - 14; y += 12) {
          ctx.fillRect(wallX, y, 16, 8);
        }
      }

      // CRT Phosphor Bloom / Soft Glow
      if (isCrtFilter) {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      // Render Ball Trail (Strobe Ghosting)
      if (ball.current.active) {
        ballTrail.current.forEach((pos, idx) => {
          const alpha = 0.35 - (idx * 0.07);
          if (alpha > 0.05) {
            ctx.fillStyle = theme.ball;
            ctx.globalAlpha = alpha;
            ctx.fillRect(pos.x, pos.y, BALL_SIZE, BALL_SIZE);
          }
        });
        ctx.globalAlpha = 1.0;
      }

      // Render Ball
      ctx.fillStyle = theme.ball;
      ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);

      // Render P1 Paddle (Left)
      ctx.fillStyle = theme.paddleP1;
      ctx.fillRect(30, p1Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);
      // Paddle pixel grip detail
      ctx.fillStyle = theme.bg;
      ctx.fillRect(30 + 4, p1Y.current + 8, 4, PADDLE_HEIGHT - 16);

      // Render P2 Paddle (Right)
      if (gameMode !== 'WALL_PRACTICE') {
        const p2X = COURT_WIDTH - 30 - PADDLE_WIDTH;
        ctx.fillStyle = theme.paddleP2;
        ctx.fillRect(p2X, p2Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = theme.bg;
        ctx.fillRect(p2X + 4, p2Y.current + 8, 4, PADDLE_HEIGHT - 16);
      }

      // Render Particles
      particles.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      // Draw Retro Scoreboard
      ctx.fillStyle = theme.fg;
      ctx.font = '36px "Press Start 2P", "DotGothic16", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (gameMode === 'WALL_PRACTICE') {
        // Wall practice shows hits and best
        ctx.fillText(`${scores.p1}`, COURT_WIDTH * 0.35, 30);
        ctx.font = '14px "Press Start 2P", "DotGothic16", monospace';
        ctx.fillStyle = theme.net;
        ctx.fillText(`BEST:${scores.maxRally}`, COURT_WIDTH * 0.65, 38);
      } else {
        // Standard Match Scoreboard
        ctx.fillText(`${scores.p1}`, COURT_WIDTH * 0.30, 28);
        ctx.fillText(`${scores.p2}`, COURT_WIDTH * 0.70, 28);
      }

      // Overlay Instructions / Prompts
      if (gameStatus === 'TITLE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(COURT_WIDTH / 2 - 180, COURT_HEIGHT / 2 - 50, 360, 100);

        ctx.fillStyle = theme.accent;
        ctx.font = '16px "Press Start 2P", "DotGothic16", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('テレビテニス', COURT_WIDTH / 2, COURT_HEIGHT / 2 - 30);

        ctx.fillStyle = theme.fg;
        ctx.font = '11px "Press Start 2P", "DotGothic16", monospace';
        const blink = Math.floor(Date.now() / 450) % 2 === 0;
        if (blink) {
          ctx.fillText('クリック または SPACE でサーブ', COURT_WIDTH / 2, COURT_HEIGHT / 2 + 10);
        }
      } else if (gameStatus === 'POINT_SCORED') {
        ctx.fillStyle = theme.fg;
        ctx.font = '11px "Press Start 2P", "DotGothic16", monospace';
        ctx.textAlign = 'center';
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
          ctx.fillText('CLICK / SPACE で再開', COURT_WIDTH / 2, COURT_HEIGHT / 2 - 8);
        }
      } else if (gameStatus === 'PAUSED') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

        ctx.fillStyle = theme.accent;
        ctx.font = '22px "Press Start 2P", "DotGothic16", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('一時停止 (PAUSE)', COURT_WIDTH / 2, COURT_HEIGHT / 2 - 20);

        ctx.font = '12px "Press Start 2P", "DotGothic16", monospace';
        ctx.fillStyle = theme.fg;
        ctx.fillText('SPACE または画面タップで再開', COURT_WIDTH / 2, COURT_HEIGHT / 2 + 20);
      } else if (gameStatus === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

        ctx.fillStyle = theme.accent;
        ctx.font = '24px "Press Start 2P", "DotGothic16", monospace';
        ctx.textAlign = 'center';
        
        let victoryText = '';
        if (winner === 'P1') {
          victoryText = gameMode === 'VS_CPU' ? '1P の勝利！ VICTORY' : 'PLAYER 1 WINS!';
        } else {
          victoryText = gameMode === 'VS_CPU' ? 'CPU の勝利！' : 'PLAYER 2 WINS!';
        }
        ctx.fillText(victoryText, COURT_WIDTH / 2, COURT_HEIGHT / 2 - 40);

        ctx.font = '14px "Press Start 2P", "DotGothic16", monospace';
        ctx.fillStyle = theme.fg;
        ctx.fillText(`最終スコア  ${scores.p1} - ${scores.p2}`, COURT_WIDTH / 2, COURT_HEIGHT / 2 + 5);

        ctx.font = '11px "Press Start 2P", "DotGothic16", monospace';
        ctx.fillStyle = theme.accent;
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
          ctx.fillText('クリック または SPACE で再戦', COURT_WIDTH / 2, COURT_HEIGHT / 2 + 45);
        }
      }

      ctx.shadowBlur = 0;
    };

    const loop = () => {
      if (gameStatus === 'PLAYING' || gameStatus === 'POINT_SCORED' || gameStatus === 'TITLE') {
        updatePhysics();
      }
      render();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameMode, difficulty, theme, gameStatus, isCrtFilter, scores, onScoreUpdate, onP1KnobChange, onP2KnobChange, onGameOver, winner, resetBall, spawnSparks]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={COURT_WIDTH}
        height={COURT_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full max-w-full max-h-full object-contain cursor-crosshair touch-none"
        style={{
          imageRendering: 'pixelated',
          aspectRatio: '16/10',
        }}
      />
      {/* Scanline CRT overlay */}
      {isCrtFilter && <div className="absolute inset-0 crt-overlay pointer-events-none" />}
    </div>
  );
};
