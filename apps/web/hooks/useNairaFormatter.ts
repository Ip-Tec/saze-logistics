// hooks/useNairaFormatter.ts or utils/currencyFormatter.ts
import { useCallback } from 'react';

/**
 * Formats a number into Nigerian Naira currency.
 * This is a plain function that can be used in both client and server environments.
 *
 * @param amount The number to format.
 * @returns A string formatted as Nigerian Naira (e.g., ₦2,184,012.04).
 * Returns 'Invalid Amount' for non-numeric or invalid inputs.
 */
export function formatNaira(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    // console.warn("formatNaira received an invalid amount:", amount); // Log for debugging
    return 'Invalid Amount';
  }

  try {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch (error) {
    console.error("Error formatting Naira amount:", amount, error);
    return `Error Formatting (${amount})`;
  }
}

/**
 * A custom React hook for formatting numbers into Nigerian Naira currency.
 * Provides a memoized function to format currency values.
 * This hook is intended for use in Client Components only.
 *
 * @returns A function `formatNaira` that takes a number and returns a string.
 */
export function useNairaFormatter() {
  // Memoize the formatting function from the utility to ensure a stable reference.
  const memoizedFormatNaira = useCallback((amount: number) => {
    return formatNaira(amount); // Re-use the plain function logic
  }, []);

  return memoizedFormatNaira;
}