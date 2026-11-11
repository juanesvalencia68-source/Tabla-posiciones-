import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, Building2, User, CreditCard, Sparkles } from 'lucide-react';
import { Agent, DepositMethod } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  initialAgent?: Agent | null;
  onConfirmDeposit: (
    agentId: string,
    amount: number,
    method: DepositMethod,
    reference?: string,
    notes?: string
  ) => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2000000];

const METHODS: DepositMethod[] = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  agents,
  initialAgent,
  onConfirmDeposit,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [method, setMethod] = useState<DepositMethod>('Transferencia');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAgent) {
      setSelectedAgentId(initialAgent.id);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [initialAgent, agents, selectedAgentId]);

  if (!isOpen) return null;

  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const parsedAmount = parseFloat(amountStr) || 0;

  const handleAddPreset = (val: number) => {
    setAmountStr((prev) => {
      const current = parseFloat(prev) || 0;
      return String(current + val);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Por favor seleccione un agente');
      return;
    }
    if (parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    onConfirmDeposit(selectedAgentId, parsedAmount, method, reference.trim(), notes.trim());
    // Reset form
    setAmountStr('');
    setReference('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registrar Nuevo Depósito</h2>
              <p className="text-xs text-slate-400">
                Se actualizará la tabla de posiciones y sonará la alerta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Agent Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Agente de Depósitos *
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.code} - {ag.branch})
                </option>
              ))}
            </select>

            {currentAgent && (
              <div className="mt-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-400">Acumulado actual:</span>
                <span className="font-mono text-slate-200 font-semibold tabular-nums">
                  Hoy: {formatCurrency(currentAgent.dailyTotal)} · Total: {formatCurrency(currentAgent.grandTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto a Depositar *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-lg font-mono font-bold text-white placeholder-slate-600 outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddPreset(val)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-mono font-medium border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  +{formatCurrency(val).replace('$ ', '')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {METHODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    method === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                N° de Referencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. TR-10923"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nota / Observación
              </label>
              <input
                type="text"
                placeholder="Ej. Depósito ventanilla"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Depósito</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
