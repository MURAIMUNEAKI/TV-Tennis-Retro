import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import { GameMode, CpuDifficulty, ColorTheme, GameStatus, THEMES, ScoreState } from './types/game';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { InstructionsModal } from './components/InstructionsModal';

export default function App() {
  // Game Setup State
  const [gameMode, setGameMode] = useState<GameMode>('VS_CPU');
  const [difficulty, setDifficulty] = useState<CpuDifficulty>('NORMAL');
  const [themeKey, setThemeKey] = useState<ColorTheme>('GREEN');
  const [targetScore, setTargetScore] = useState<number>(11);
  const [isCrtFilter, setIsCrtFilter] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [showHud, setShowHud] = useState<boolean>(true);

  // Knobs & Paddles tracking
  const [p1Knob, setP1Knob] = useState<number>(0.5);
  const [p2Knob, setP2Knob] = useState<number>(0.5);

  // Game Progress State
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [winner, setWinner] = useState<'P1' | 'P2' | null>(null);
  const [scores, setScores] = useState<ScoreState>({
    p1: 0,
    p2: 0,
    rally: 0,
    maxRally: 0,
    targetScore: 11,
  });

  const currentTheme = THEMES[themeKey];

  // Sound sync
  const toggleAudio = () => {
    sound.playClick();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Reset match
  const handleResetGame = useCallback(() => {
    sound.playClick();
    setScores((prev) => ({
      p1: 0,
      p2: 0,
      rally: 0,
      maxRally: prev.maxRally,
      targetScore,
    }));
    setWinner(null);
    setGameStatus('TITLE');
  }, [targetScore]);

  // Mode change
  const handleModeChange = (mode: GameMode) => {
    sound.playClick();
    setGameMode(mode);
    setScores((prev) => ({
      p1: 0,
      p2: 0,
      rally: 0,
      maxRally: 0,
      targetScore,
    }));
    setWinner(null);
    setGameStatus('TITLE');
  };

  // Difficulty change
  const handleDifficultyChange = (diff: CpuDifficulty) => {
    sound.playClick();
    setDifficulty(diff);
  };

  // Theme change
  const handleThemeChange = (t: ColorTheme) => {
    sound.playClick();
    setThemeKey(t);
  };

  const handleGameOver = (win: 'P1' | 'P2') => {
    setWinner(win);
    setGameStatus('GAME_OVER');
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center font-dot">
      {/* The Pure Screen Viewport */}
      <div className="relative w-full h-full flex items-center justify-center">
        <GameCanvas
          gameMode={gameMode}
          difficulty={difficulty}
          theme={currentTheme}
          gameStatus={gameStatus}
          onStatusChange={setGameStatus}
          scores={scores}
          onScoreUpdate={setScores}
          isCrtFilter={isCrtFilter}
          p1KnobValue={p1Knob}
          onP1KnobChange={setP1Knob}
          p2KnobValue={p2Knob}
          onP2KnobChange={setP2Knob}
          winner={winner}
          onGameOver={handleGameOver}
          onRestartGame={handleResetGame}
        />
      </div>

      {/* Floating Minimal OSD / HUD Header (Non-intrusive) */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between transition-opacity duration-300 ${
          showHud ? 'opacity-90 hover:opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Mode Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded border border-zinc-800 shadow-lg pointer-events-auto">
          <button
            onClick={() => handleModeChange('VS_CPU')}
            className={`px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap ${
              gameMode === 'VS_CPU'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            一人用 (CPU)
          </button>
          <button
            onClick={() => handleModeChange('TWO_PLAYERS')}
            className={`px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap ${
              gameMode === 'TWO_PLAYERS'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            二人対戦 (2P)
          </button>
          <button
            onClick={() => handleModeChange('WALL_PRACTICE')}
            className={`px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap ${
              gameMode === 'WALL_PRACTICE'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            壁打ち特訓
          </button>

          {/* Difficulty selector (when in VS CPU) */}
          {gameMode === 'VS_CPU' && (
            <div className="hidden sm:flex items-center gap-1 pl-1.5 border-l border-zinc-700/60">
              {(['EASY', 'NORMAL', 'HARD'] as CpuDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDifficultyChange(d)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-pixel transition-colors ${
                    difficulty === d ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {d === 'EASY' ? '初級' : d === 'NORMAL' ? '中級' : '上級'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Monitor Controls (Themes, Sound, CRT, Reset, Hide HUD) */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded border border-zinc-800 shadow-lg pointer-events-auto">
          {/* Theme Color Dots */}
          <div className="flex items-center gap-1 pr-1 border-r border-zinc-700/60">
            {(['GREEN', 'MONO', 'AMBER', 'ARCADE'] as ColorTheme[]).map((tKey) => (
              <button
                key={tKey}
                onClick={() => handleThemeChange(tKey)}
                className={`w-3.5 h-3.5 rounded-xs transition-transform ${
                  themeKey === tKey ? 'scale-125 ring-1 ring-white' : 'opacity-50 hover:opacity-100'
                }`}
                style={{ backgroundColor: THEMES[tKey].fg }}
                title={THEMES[tKey].jpName}
              />
            ))}
          </div>

          {/* CRT scanline toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsCrtFilter(!isCrtFilter);
            }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-pixel border transition-colors ${
              isCrtFilter
                ? 'border-emerald-700 bg-emerald-950/60 text-emerald-400'
                : 'border-zinc-700 text-zinc-500'
            }`}
            title="CRT走査線のON/OFF"
          >
            <Tv className="w-3 h-3" />
            <span className="hidden md:inline">CRT</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={toggleAudio}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'サウンドON' : 'ミュート'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-600" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" style={{ color: currentTheme.fg }} />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetGame}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="最初からやり直す"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Help Modal trigger */}
          <button
            onClick={() => {
              sound.playClick();
              setIsHelpOpen(true);
            }}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="操作説明"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:block p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="全画面表示"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Hide HUD */}
          <button
            onClick={() => {
              sound.playClick();
              setShowHud(false);
            }}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="メニューを隠す（画面だけにする）"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Toggle Button when HUD is Hidden */}
      {!showHud && (
        <button
          onClick={() => {
            sound.playClick();
            setShowHud(true);
          }}
          className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-500 hover:text-zinc-200 border border-zinc-800/60 transition-all opacity-40 hover:opacity-100"
          title="メニューを表示"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Subtle Bottom Control Hint (non-intrusive) */}
      <div
        className={`absolute bottom-2 left-0 right-0 z-20 flex justify-center pointer-events-none transition-opacity duration-300 ${
          showHud ? 'opacity-40 hover:opacity-80' : 'opacity-0'
        }`}
      >
        <span className="text-[10px] text-zinc-400 bg-black/60 px-3 py-0.5 rounded-full border border-zinc-900 pointer-events-auto">
          画面上でマウスや指を上下に動かして操作 · SPACE / クリックでサーブ
        </span>
      </div>

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        accentColor={currentTheme.fg}
      />
    </div>
  );
}
