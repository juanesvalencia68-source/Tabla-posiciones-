import React, { useEffect, memo } from 'react';
import { CheckCircle2, DollarSign, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export interface NotificationData {
  id: string;
  agentName: string;
  amount: number;
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
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isNegative = notification.amount < 0;
  const isZero = notification.amount === 0;

  return (
    <div className="fixed top-5 right-5 z-50 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      <div
        className={`animate-tv-toast pointer-events-auto bg-slate-900 border-2 rounded-xl p-4 flex items-start gap-3 relative shadow-xl ${
          isNegative ? 'border-rose-500/80' : 'border-emerald-500/80'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
            isNegative
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <DollarSign className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
              isNegative ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isNegative ? 'Ajuste de Saldo (-)' : isZero ? 'Actualización' : 'Depósito Registrado'}</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white mt-1 truncate">
            {notification.agentName}
          </p>
          {!isZero && (
            <p
              className={`text-xs sm:text-sm font-mono font-bold mt-0.5 tabular-nums ${
                isNegative ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {isNegative ? `-${formatCurrency(Math.abs(notification.amount))}` : `+${formatCurrency(notification.amount)}`}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

DepositNotification.displayName = 'DepositNotification';
