import { AUMBenchmarkCategory, BalanceBenchmarkCategory } from './types';

/**
 * Generate disclaimer text for benchmark data
 */
export function getDisclaimerText(
  aumBucket: AUMBenchmarkCategory | undefined,
  balanceBucket: BalanceBenchmarkCategory | undefined
): string {
  const aumText = aumBucket || '[AUM Bucket]';
  const balanceText = balanceBucket || '[Average Balance Bucket]';

  return `Data Source: Showing benchmark data from Fiduciary Decisions Inc. for plans with ${aumText} AUM and ${balanceText} average account balance.`;
}
