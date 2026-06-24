/**
 * Formats a numeric value into Indian Rupee (INR) representation with appropriate grouping.
 * E.g., 5500 -> ₹5,500; 149999 -> ₹1,49,999; 1500000 -> ₹15,00,000.
 */
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
