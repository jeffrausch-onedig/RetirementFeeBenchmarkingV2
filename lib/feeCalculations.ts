import { FeeStructure, CalculatedFee, CalculatedFees, PlanData } from './types';

/**
 * Calculate the dollar amount for a single fee based on its structure
 */
export function calculateFeeAmount(
  feeStructure: FeeStructure,
  aum: number,
  participantCount?: number
): number {
  switch (feeStructure.type) {
    case 'basisPoints':
      // Basis points: 1 bp = 0.01%, so 50 bp = 0.50% = 0.005
      // User enters basis points (e.g., 50), we divide by 10,000
      return aum * (feeStructure.basisPoints || 0) / 10000;

    case 'flatFee':
      // Simple flat fee
      return feeStructure.flatFee || 0;

    case 'flatPlusPerHead':
      // Flat fee + per participant
      const flat = feeStructure.flatFee || 0;
      const perHead = (feeStructure.perHeadFee || 0) * (participantCount || 0);
      return flat + perHead;

    case 'perParticipant':
      // Per participant only
      return (feeStructure.perHeadFee || 0) * (participantCount || 0);

    default:
      return 0;
  }
}

/**
 * Calculate percentage for a fee amount relative to AUM
 */
export function calculateFeePercentage(feeAmount: number, aum: number): number {
  if (aum === 0) return 0;
  return (feeAmount / aum) * 100;
}

/**
 * Calculate all fees for a plan
 */
export function calculateAllFees(planData: PlanData): CalculatedFees {
  const { assetsUnderManagement, participantCount, fees } = planData;
  const aum = assetsUnderManagement || 0;

  const advisorAmount = calculateFeeAmount(fees.advisor, aum, participantCount);
  const recordKeeperAmount = calculateFeeAmount(fees.recordKeeper, aum, participantCount);
  const tpaAmount = calculateFeeAmount(fees.tpa, aum, participantCount);
  const investmentMenuAmount = calculateFeeAmount(fees.investmentMenu, aum, participantCount);
  const totalAmount = advisorAmount + recordKeeperAmount + tpaAmount + investmentMenuAmount;

  return {
    advisor: {
      feeType: 'Advisor',
      dollarAmount: advisorAmount,
      percentage: calculateFeePercentage(advisorAmount, aum),
    },
    recordKeeper: {
      feeType: 'Record Keeper',
      dollarAmount: recordKeeperAmount,
      percentage: calculateFeePercentage(recordKeeperAmount, aum),
    },
    tpa: {
      feeType: 'TPA',
      dollarAmount: tpaAmount,
      percentage: calculateFeePercentage(tpaAmount, aum),
    },
    investmentMenu: {
      feeType: 'Investment Menu',
      dollarAmount: investmentMenuAmount,
      percentage: calculateFeePercentage(investmentMenuAmount, aum),
    },
    total: {
      feeType: 'Total Plan Fees',
      dollarAmount: totalAmount,
      percentage: calculateFeePercentage(totalAmount, aum),
    },
  };
}

/**
 * Determine the appropriate AUM bucket for benchmark lookup
 */
export function getAUMBucket(aum: number): string {
  if (aum < 250000) return '$0-250k';
  if (aum < 500000) return '$250-500k';
  if (aum < 1000000) return '$500k-1m';
  if (aum < 3000000) return '$1-3m';
  if (aum < 5000000) return '$3-5m';
  if (aum < 10000000) return '$5-10m';
  if (aum < 20000000) return '$10-20m';
  if (aum < 30000000) return '$20-30m';
  if (aum < 50000000) return '$30-50m';
  if (aum < 100000000) return '$50-100m';
  if (aum < 250000000) return '$100-250m';
  return '> $250m';  // Match Domo format with space
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format basis points for display
 */
export function formatBasisPoints(basisPoints: number): string {
  return `${basisPoints} bps`;
}

/**
 * Convert a dollar fee amount to basis points relative to AUM
 * Formula: (fee / assets) * 10000
 */
export function convertDollarsToBasisPoints(feeAmount: number, aum: number): number {
  if (aum === 0) return 0;
  return (feeAmount / aum) * 10000;
}

/**
 * Convert basis points to a decimal percentage
 * Formula: basisPoints / 10000
 * Example: 50 bps = 0.005 (0.5%)
 */
export function convertBasisPointsToDecimal(basisPoints: number): number {
  return basisPoints / 10000;
}
