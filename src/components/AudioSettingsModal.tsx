import React, { useState } from 'react';
import { X, Volume2, VolumeX, Bell, Music, Check, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
}) => {
  const [volume, setVolumeState] = useState(soundEngine.getVolume());

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    soundEngine.setVolume(val);
  };

  const testDepositSound = () => {
    soundEngine.playDepositSound(350000);
  };

  const testFanfare = () => {
    soundEngine.playTop1Fanfare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configuración de Audio</h2>
              <p className="text-[11px] text-slate-400">Efectos de sonido en vivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mute Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <span className="text-xs font-semibold text-white block">
                  Sonido de Notificaciones
                </span>
                <span className="text-[11px] text-slate-400">
                  {isMuted ? 'Silenciado actualmente' : 'Activo para cada depósito'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onToggleMute(!isMuted)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isMuted ? 'Activar' : 'Silenciar'}
            </button>
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Volumen de Reproducción</span>
              <span className="font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              disabled={isMuted}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
            />
          </div>

          {/* Sound Testers */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Probar Efectos
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={testDepositSound}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex flex-col items-center gap-1.5 transition-all text-center"
              >
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>Campana Depósito</span>
              </button>

              <button
                type="button"
                onClick={testFanfare}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex flex-col items-center gap-1.5 transition-all text-center"
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span>Fanfarria Top 1</span>
              </button>
            </div>
          </div>

          {/* Close */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
