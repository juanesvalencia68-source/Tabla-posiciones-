/**
 * Formatting utilities for currency, dates, numbers and visual styles
 */

export function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currencySymbol} ${formatted}`;
}

export function formatCompactCurrency(amount: number, currencySymbol: string = '$'): string {
  if (amount >= 1_000_000_000) {
    return `${currencySymbol} ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${currencySymbol} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${currencySymbol} ${(amount / 1_000).toFixed(0)}K`;
  }
  return `${currencySymbol} ${amount}`;
}

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Sin depósitos';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Hace unos segundos';
  if (diffInSeconds < 60) return `Hace ${diffInSeconds} seg`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} h`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `Hace ${diffInDays} d`;
}

export function formatExactTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateLabel(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
