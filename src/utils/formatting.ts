/**
 * AeroOps Control Tower — Formatting Helpers
 * 
 * Consistent string and number formatters for aerospace manufacturing metrics.
 */

export function formatCurrency(amountUSD: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amountUSD)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0.0%'
  return `${value.toFixed(decimals)}%`
}

export function formatQuantity(value: number, unitOfMeasure?: string): string {
  const formatted = new Intl.NumberFormat('en-US').format(value)
  return unitOfMeasure ? `${formatted} ${unitOfMeasure}` : formatted
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'Pending / Open'
  try {
    const parts = isoDate.split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      const monthIndex = parseInt(parts[1], 10) - 1
      const day = parts[2]
      return `${day} ${monthNames[monthIndex]} ${year}`
    }
    return isoDate
  } catch {
    return isoDate
  }
}
