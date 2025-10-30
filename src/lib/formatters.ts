// src/lib/formatters.ts

export const formatCurrency = (amount: number | string | undefined) => {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};
