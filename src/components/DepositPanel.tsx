import React, { useState } from 'react';
import { DollarSign, Check, Settings, RotateCcw, Trash2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Agent, DepositMethod } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DepositPanelProps {
  agents: Agent[];
  onConfirmDeposit: (
    agentId: string,
    amount: number,
    method: DepositMethod,
    reference?: string
  ) => void;
  onOpenAdmin: () => void;
  onResetDaily: () => void;
  onResetTotal: () => void;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  onSimulateDeposit: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

export const DepositPanel: React.FC<DepositPanelProps> = ({
  agents,
  onConfirmDeposit,
  onOpenAdmin,
  onResetDaily,
  onResetTotal,
  isMuted,
  onToggleMute,
  onSimulateDeposit,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [amountInput, setAmountInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync if agents change and none selected
  React.useEffect(() => {
    if ((!selectedAgentId || !agents.some((a) => a.id === selectedAgentId)) && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const parsedAmount = parseFloat(amountInput) || 0;

  const handleAddPreset = (val: number) => {
    const current = parseFloat(amountInput) || 0;
    setAmountInput(String(current + val));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Seleccione un agente');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    onConfirmDeposit(selectedAgentId, parsedAmount, 'Efectivo');
    setAmountInput('');
    setError(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ingresar Depósito
              </h2>
              <p className="text-[11px] text-slate-400">Panel de registro inmediato</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleMute(!isMuted)}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}
            title={isMuted ? 'Activar sonido de monedas' : 'Silenciar sonido'}
            aria-label="Alternar sonido"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Agent Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Seleccionar Agente
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setError(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.branch})
                </option>
              ))}
            </select>

            {currentAgent && (
              <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
                <span>Acumulado actual:</span>
                <span className="font-mono text-slate-200 font-semibold tabular-nums">
                  Hoy: {formatCurrency(currentAgent.dailyTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto del Depósito ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-base">
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-base font-mono font-bold text-white placeholder-slate-600 outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddPreset(val)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-mono border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  +{formatCurrency(val).replace('$ ', '')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountInput('')}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Registrar Depósito</span>
          </button>
        </form>
      </div>

      {/* Auxiliary actions */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateDeposit}
            className="flex-1 py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            title="Prueba rápida del sonido de caja y notificación"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Depósito</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Abrir panel independiente de administración de agentes"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Agentes</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={onResetDaily}
            className="w-full py-2 px-3 bg-slate-950 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reiniciar Depósitos Diarios a $0</span>
          </button>

          <button
            type="button"
            onClick={onResetTotal}
            className="w-full py-2 px-3 bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reiniciar Depósitos Totales a $0</span>
          </button>
        </div>
      </div>
    </div>
  );
};
