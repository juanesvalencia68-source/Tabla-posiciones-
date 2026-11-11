import React from 'react';
import { AlertTriangle, X, RotateCcw, Trash2 } from 'lucide-react';

export type ResetType = 'daily' | 'total' | null;

interface ResetConfirmModalProps {
  resetType: ResetType;
  onClose: () => void;
  onConfirm: (type: 'daily' | 'total') => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  resetType,
  onClose,
  onConfirm,
}) => {
  if (!resetType) return null;

  const isDaily = resetType === 'daily';
  const title = isDaily ? '¿Reiniciar Depósitos Diarios?' : '¿Reiniciar Depósitos Totales a $0?';
  const description = isDaily
    ? 'Esta acción reiniciará los depósitos de hoy a $0 para todos los agentes, conservando el acumulado total histórico.'
    : 'Esta acción reiniciará TODOS los depósitos (tanto diarios como totales acumulados) a $0 para todos los agentes y vaciará el historial.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDaily
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {isDaily ? <RotateCcw className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <span className="text-[11px] text-slate-400">Confirmación requerida</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">{description}</p>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(resetType);
              onClose();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isDaily
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isDaily ? 'Sí, reiniciar día a $0' : 'Sí, reiniciar TODO a $0'}
          </button>
        </div>
      </div>
    </div>
  );
};
