import React, { useEffect, memo } from 'react';
import { CheckCircle2, DollarSign, X } from 'lucide-react';
import { formatCurrency, getConversionSalesCount } from '../utils/formatters';

export interface NotificationData {
  id: string;
  agentName: string;
  amount: number;
  branch?: 'Retención' | 'Conversión';
  timestamp: number;
}

interface DepositNotificationProps {
  notification: NotificationData | null;
  onDismiss: () => void;
}

export const DepositNotification: React.FC<DepositNotificationProps> = memo(({
  notification,
  onDismiss,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isNegative = notification.amount < 0;
  const isZero = notification.amount === 0;
  const isConversion = notification.branch === 'Conversión';
  const salesCount = isConversion ? getConversionSalesCount(Math.abs(notification.amount)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/70 pointer-events-none select-none">
      <div
        key={notification.id}
        className={`animate-tv-modal pointer-events-auto relative w-full max-w-2xl bg-slate-900 border-2 rounded-3xl overflow-hidden ${
          isNegative
            ? 'border-rose-500'
            : isConversion
            ? 'border-emerald-400'
            : 'border-amber-400'
        }`}
      >
        {/* Top Area Accent Strip */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between border-b ${
            isNegative
              ? 'bg-rose-950/60 border-rose-500/40'
              : isConversion
              ? 'bg-emerald-950/60 border-emerald-500/40'
              : 'bg-blue-950/60 border-blue-500/40'
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest">
            <span>{isConversion ? '🎯' : '🏢'}</span>
            <span className={isConversion ? 'text-emerald-300' : 'text-blue-300'}>
              Área de {notification.branch || 'Retención'}
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Centered Banner Content */}
        <div className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center ${
              isNegative
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : isConversion
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
            }`}
          >
            <DollarSign className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg text-xs sm:text-sm font-black uppercase tracking-widest ${
              isNegative
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : isZero
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : isConversion
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isNegative
                ? 'Ajuste de Saldo (-)'
                : isZero
                ? 'Actualización de Tabla'
                : '¡Nuevo Depósito Registrado!'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight max-w-full truncate">
            {notification.agentName}
          </h2>

          {!isZero && (
            <div className="flex flex-col items-center gap-1.5">
              <p
                className={`text-3xl sm:text-5xl xl:text-6xl font-mono font-black tabular-nums ${
                  isNegative ? 'text-rose-400' : isConversion ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {isNegative
                  ? `-${formatCurrency(Math.abs(notification.amount))}`
                  : `+${formatCurrency(notification.amount)}`}
              </p>

              {isConversion && salesCount > 0 && (
                <span className="text-sm sm:text-lg font-bold text-emerald-200 bg-emerald-500/15 border border-emerald-400/30 px-3 py-0.5 rounded-lg">
                  {isNegative ? '-' : '+'}
                  {salesCount} {salesCount === 1 ? 'venta' : 'ventas'} ($250 c/u)
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-1">
            Este aviso desaparecerá automáticamente en 8 segundos
          </p>
        </div>

        {/* 8-Second Auto-Dismiss Progress Bar */}
        <div className="h-1.5 w-full bg-slate-950 overflow-hidden">
          <div
            className={`w-full h-full animate-countdown-8s ${
              isNegative ? 'bg-rose-500' : isConversion ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
});

DepositNotification.displayName = 'DepositNotification';
