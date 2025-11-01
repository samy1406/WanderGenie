
// src/lib/formatters.ts

export const formatCurrency = (amount: number | string | undefined) => {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

    