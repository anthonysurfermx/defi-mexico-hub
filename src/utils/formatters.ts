// Utility functions for consistent formatting across the app

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'long'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const formatCurrency = (amount: number, currency: 'MXN' | 'USD' = 'MXN'): string => {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString('es-MX');
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

export const formatTVL = (tvl: string): string => {
  // If it's already formatted, return as is
  if (tvl.includes('$') || tvl.includes('M') || tvl.includes('K')) {
    return tvl;
  }
  
  const num = parseFloat(tvl);
  if (isNaN(num)) return tvl;
  
  return formatCurrency(num, 'USD');
};