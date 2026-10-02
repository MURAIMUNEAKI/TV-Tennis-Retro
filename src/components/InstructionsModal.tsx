import React from 'react';
import { X, Play, Gamepad2, MousePointer, Hand, Volume2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  accentColor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-zinc-900 border-2 rounded-lg p-6 shadow-2xl relative text-zinc-200 text-sm max-h-[90vh] overflow-y-auto"
        style={{ borderColor: accentColor }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="font-pixel text-xs sm:text-sm tracking-wider" style={{ color: accentColor }}>
              テレビテニス 操作説明書
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs leading-relaxed font-dot">
          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <h3 className="font-pixel text-[11px] mb-2 text-zinc-100 flex items-center gap-1.5">
              <span>★</span> ゲームの目的
            </h3>
            <p className="text-zinc-300">
              1975年に発売された日本初の家庭用テレビゲーム機「テレビテニス（エポック社）」を再現したゲームです。
              ラケット（パドル）を上下に動かし、相手コートへボールを打ち返して点数を競います。
            </p>
          </div>

          <div>
            <h3 className="font-pixel text-[11px] mb-2 text-zinc-100">
              【シンプルな3通りの操作方法】
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold mb-1">
                  <MousePointer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>マウス / タッチ</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  画面の上でマウスを上下に動かすか、指でなぞるだけでラケットがダイレクトに追従します。
                </p>
              </div>

              <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold mb-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>キーボード</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  <strong>1P:</strong> W / S キー<br />
                  <strong>2P:</strong> ↑ / ↓ キー<br />
                  <strong>サーブ:</strong> SPACE
                </p>
              </div>

              <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold mb-1">
                  <Hand className="w-3.5 h-3.5 text-zinc-400" />
                  <span>レトロダイヤル</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  画面下の回転つまみを上下ドラッグやホイールで回して実機さながらの操作を楽しめます。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <h3 className="font-pixel text-[11px] mb-2 text-zinc-100">
              【上達のコツ：スピンと角度】
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
              <li>ラケットの「端（上下のカド）」で打つと、鋭角で高速なスマッシュショットになります。</li>
              <li>ラケットの中央で打つと、安定したストレートショットになります。</li>
              <li>ラリーが続くほどボールのスピードが徐々に上がっていきます！</li>
            </ul>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <h3 className="font-pixel text-[11px] mb-2 text-zinc-100 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> サウンド＆画面モード
            </h3>
            <p className="text-zinc-300 text-[11px]">
              Web Audio API による本格8ビット矩形波サウンド内蔵。
              昭和グリーンモニター、初代モノクロ、アンバー管、カラーネオンの4つのレトロ画面テーマとCRT走査線エフェクトをいつでも切り替え可能です。
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 font-pixel text-xs rounded bg-zinc-200 text-zinc-900 hover:bg-white active:scale-95 transition-all shadow"
          >
            <Play className="w-3.5 h-3.5" />
            閉じてゲームを遊ぶ
          </button>
        </div>
      </div>
    </div>
  );
};
