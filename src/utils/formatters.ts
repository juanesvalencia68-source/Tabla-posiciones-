/**
 * Formatting utilities for currency, dates, numbers and visual styles
 */

export const CONVERSION_SALE_AMOUNT = 250;
export const RETENCION_TARGET_AMOUNT = 550000;

export function getConversionSalesCount(totalAmount: number): number {
  if (!Number.isFinite(totalAmount) || totalAmount < CONVERSION_SALE_AMOUNT) {
    return 0;
  }
  return Math.floor((totalAmount + 1e-6) / CONVERSION_SALE_AMOUNT);
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  return `${currencySymbol} ${numberFormatter.format(amount || 0)}`;
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
