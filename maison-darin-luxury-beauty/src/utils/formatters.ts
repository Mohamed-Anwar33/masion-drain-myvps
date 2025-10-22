/**
 * Utility functions for formatting data
 */

/**
 * Format currency values with proper locale and currency symbol
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EGP',
  locale: string = 'ar-EG'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    const currencySymbols: Record<string, string> = {
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€',
      'SAR': 'ر.س',
      'AED': 'د.إ',
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${amount.toFixed(2)} ${symbol}`;
  }
};

/**
 * Format date values with proper locale
 */
export const formatDate = (
  date: string | Date,
  locale: string = 'ar-EG',
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    // Fallback formatting
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format date for display in Arabic
 */
export const formatDateArabic = (date: string | Date): string => {
  return formatDate(date, 'ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date and time for display in Arabic
 */
export const formatDateTimeArabic = (date: string | Date): string => {
  return formatDate(date, 'ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (
  number: number,
  locale: string = 'ar-EG'
): string => {
  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch (error) {
    return number.toLocaleString();
  }
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  locale: string = 'ar-EG'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } catch (error) {
    return `${value.toFixed(decimals)}%`;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}س ${minutes}د ${remainingSeconds}ث`;
  } else if (minutes > 0) {
    return `${minutes}د ${remainingSeconds}ث`;
  } else {
    return `${remainingSeconds}ث`;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length (assuming Egyptian format)
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('201')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone; // Return original if format not recognized
};
