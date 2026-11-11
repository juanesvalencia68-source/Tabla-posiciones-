import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

export const DepositNotification: React.FC<DepositNotificationProps> = ({
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

  return (
    <div className="fixed top-5 right-5 z-50 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto bg-slate-900 border border-emerald-500/50 rounded-xl p-4 shadow-2xl shadow-emerald-500/10 flex items-start gap-3 relative overflow-hidden"
          >
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Depósito Registrado</span>
              </div>
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {notification.agentName}
              </p>
              <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5 tabular-nums">
                +{formatCurrency(notification.amount)}
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
