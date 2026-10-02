import React, { useRef, useState, useEffect, useCallback } from 'react';

interface RetroKnobProps {
  label: string;
  subLabel?: string;
  value: number; // 0 (top) to 1 (bottom)
  onChange: (val: number) => void;
  accentColor?: string;
  disabled?: boolean;
}

export const RetroKnob: React.FC<RetroKnobProps> = ({
  label,
  subLabel,
  value,
  onChange,
  accentColor = '#33ff33',
  disabled = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);

  // Map value (0 to 1) to angle (-135deg to +135deg)
  const angle = (value - 0.5) * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    const deltaY = e.clientY - dragStartY.current;
    // Moving down increases value (moves paddle down), moving up decreases value
    const sensitivity = 0.005;
    const newVal = Math.max(0, Math.min(1, dragStartValue.current + deltaY * sensitivity));
    onChange(newVal);
  }, [isDragging, disabled, onChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  // Wheel support on knob
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.05 : -0.05;
    const newVal = Math.max(0, Math.min(1, value + delta));
    onChange(newVal);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  return (
    <div className="flex flex-col items-center select-none text-center">
      <div className="text-[10px] uppercase font-pixel tracking-wider text-zinc-400 mb-1">
        {label}
      </div>

      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-ns-resize shadow-md touch-none transition-transform active:scale-95 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{
          background: 'radial-gradient(circle at 35% 35%, #404040, #171717 75%, #0a0a0a 100%)',
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.15), 0 4px 8px rgba(0,0,0,0.8), 0 0 0 2px #262626`,
        }}
        title="上下にドラッグまたはホイールでパドルを操作"
      >
        {/* Notched outer rim pattern */}
        <div className="absolute inset-1 rounded-full border border-zinc-700/50 flex items-center justify-center">
          {/* Rotating inner face */}
          <div
            className="w-full h-full rounded-full relative flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `rotate(${angle}deg)`,
              background: 'radial-gradient(circle at 45% 45%, #2a2a2a, #111111 80%)',
            }}
          >
            {/* White pointer indicator notch */}
            <div
              className="absolute top-1 w-1 h-3 rounded-sm shadow-sm"
              style={{ backgroundColor: accentColor }}
            />
            {/* Center metallic cap */}
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            </div>
          </div>
        </div>
      </div>

      {subLabel && (
        <span className="text-[9px] text-zinc-500 mt-1 font-mono">
          {subLabel}
        </span>
      )}
    </div>
  );
};
