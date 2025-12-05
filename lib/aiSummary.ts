import type { AISummaryRequest } from './types';

/**
 * Builds a structured prompt for Azure OpenAI to generate an executive summary
 * of retirement plan fee benchmarking results.
 *
 * The prompt combines:
 * - Plan metadata (AUM, participants, benchmark bucket)
 * - Calculated fee breakdowns (dollar amounts and percentages)
 * - Benchmark comparisons (percentile positioning)
 * - Proposed plan data if available for savings analysis
 *
 * Designed to produce stable, consistent output grounded in provided data.
 */
export function buildSummaryPrompt(request: AISummaryRequest): string {
  const {
    planData,
    calculatedFees,
    benchmarks,
    proposedPlanData,
    proposedCalculatedFees,
    aumBucket,
  } = request;

  // Format currency helper
  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Format percentage helper
  // Note: calculatedFees.percentage values are already percentages (e.g., 0.9 for 0.9%)
  // So we don't multiply by 100 here
  const formatPercent = (percentage: number) =>
    `${percentage.toFixed(2)}%`;

  // Determine percentile position for a fee
  const getPercentilePosition = (feePercent: number, percentiles: { p25: number; p50: number; p75: number }): string => {
    if (feePercent <= percentiles.p25) return 'below the 25th percentile (excellent)';
    if (feePercent <= percentiles.p50) return 'between the 25th and 50th percentile (very good)';
    if (feePercent <= percentiles.p75) return 'between the 50th and 75th percentile (average)';
    return 'above the 75th percentile (above market)';
  };

  const aum = planData.assetsUnderManagement || 0;
  const participants = planData.participantCount || 0;

  // Helper to format service lists
  const formatServices = (services: any, category: string): string => {
    if (!services) return '';
    const selectedServices = Object.keys(services).filter(key => services[key] === true);
    if (selectedServices.length === 0) return '';
    return `\n${category} Services Included:\n${selectedServices.map(s => `- ${s.replace(/([A-Z])/g, ' $1').trim()}`).join('\n')}`;
  };

  let prompt = `You are an expert retirement plan consultant analyzing fee benchmarking data. Generate a professional executive summary suitable for both advisors and plan sponsors.

PLAN DETAILS:
- Assets Under Management: ${formatCurrency(aum)}
- Number of Participants: ${participants.toLocaleString()}
- AUM Benchmark Category: ${aumBucket}

CURRENT PLAN FEE STRUCTURE:

Advisor Fee:
- Amount: ${formatCurrency(calculatedFees.advisor.dollarAmount)} (${formatPercent(calculatedFees.advisor.percentage)} of AUM)
- Market Position: ${getPercentilePosition(calculatedFees.advisor.percentage, benchmarks.advisor)}
- Benchmarks: 25th=${formatPercent(benchmarks.advisor.p25)}, 50th=${formatPercent(benchmarks.advisor.p50)}, 75th=${formatPercent(benchmarks.advisor.p75)}${formatServices(planData.services?.advisor, 'Advisor')}

Record Keeper Fee:
- Amount: ${formatCurrency(calculatedFees.recordKeeper.dollarAmount)} (${formatPercent(calculatedFees.recordKeeper.percentage)} of AUM)
- Market Position: ${getPercentilePosition(calculatedFees.recordKeeper.percentage, benchmarks.recordKeeper)}
- Benchmarks: 25th=${formatPercent(benchmarks.recordKeeper.p25)}, 50th=${formatPercent(benchmarks.recordKeeper.p50)}, 75th=${formatPercent(benchmarks.recordKeeper.p75)}${formatServices(planData.services?.recordKeeper, 'Recordkeeper')}

TPA Fee:
- Amount: ${formatCurrency(calculatedFees.tpa.dollarAmount)} (${formatPercent(calculatedFees.tpa.percentage)} of AUM)
- Market Position: ${getPercentilePosition(calculatedFees.tpa.percentage, benchmarks.tpa)}
- Benchmarks: 25th=${formatPercent(benchmarks.tpa.p25)}, 50th=${formatPercent(benchmarks.tpa.p50)}, 75th=${formatPercent(benchmarks.tpa.p75)}${formatServices(planData.services?.tpa, 'TPA')}

Investment Menu Fee:
- Amount: ${formatCurrency(calculatedFees.investmentMenu.dollarAmount)} (${formatPercent(calculatedFees.investmentMenu.percentage)} of AUM)
- Market Position: ${getPercentilePosition(calculatedFees.investmentMenu.percentage, benchmarks.investmentMenu)}
- Benchmarks: 25th=${formatPercent(benchmarks.investmentMenu.p25)}, 50th=${formatPercent(benchmarks.investmentMenu.p50)}, 75th=${formatPercent(benchmarks.investmentMenu.p75)}${formatServices(planData.services?.audit, 'Audit')}

TOTAL FEES:
- Amount: ${formatCurrency(calculatedFees.total.dollarAmount)} (${formatPercent(calculatedFees.total.percentage)} of AUM)
- Market Position: ${getPercentilePosition(calculatedFees.total.percentage, benchmarks.total)}
- Benchmarks: 25th=${formatPercent(benchmarks.total.p25)}, 50th=${formatPercent(benchmarks.total.p50)}, 75th=${formatPercent(benchmarks.total.p75)}`;

  // Add proposed plan comparison if available
  if (proposedCalculatedFees && proposedPlanData) {
    const savings = calculatedFees.total.dollarAmount - proposedCalculatedFees.total.dollarAmount;
    const savingsPercent = calculatedFees.total.percentage - proposedCalculatedFees.total.percentage;

    prompt += `

PROPOSED PLAN FEE STRUCTURE:

Advisor Fee: ${formatCurrency(proposedCalculatedFees.advisor.dollarAmount)} (${formatPercent(proposedCalculatedFees.advisor.percentage)})${formatServices(proposedPlanData.services?.advisor, 'Proposed Advisor')}

Record Keeper Fee: ${formatCurrency(proposedCalculatedFees.recordKeeper.dollarAmount)} (${formatPercent(proposedCalculatedFees.recordKeeper.percentage)})${formatServices(proposedPlanData.services?.recordKeeper, 'Proposed Recordkeeper')}

TPA Fee: ${formatCurrency(proposedCalculatedFees.tpa.dollarAmount)} (${formatPercent(proposedCalculatedFees.tpa.percentage)})${formatServices(proposedPlanData.services?.tpa, 'Proposed TPA')}

Investment Menu Fee: ${formatCurrency(proposedCalculatedFees.investmentMenu.dollarAmount)} (${formatPercent(proposedCalculatedFees.investmentMenu.percentage)})${formatServices(proposedPlanData.services?.audit, 'Proposed Audit')}

PROPOSED TOTAL FEES: ${formatCurrency(proposedCalculatedFees.total.dollarAmount)} (${formatPercent(proposedCalculatedFees.total.percentage)} of AUM)

POTENTIAL SAVINGS:
- Dollar Savings: ${formatCurrency(Math.abs(savings))} ${savings > 0 ? 'saved' : 'increased'}
- Percentage Point Change: ${formatPercent(Math.abs(savingsPercent))} ${savingsPercent > 0 ? 'reduction' : 'increase'}

NOTE: When evaluating fee changes, consider the services included with each provider. Higher fees may be justified by enhanced service offerings, while lower fees should be evaluated to ensure no critical services are being eliminated.`;
  }

  prompt += `

INSTRUCTIONS:
Generate a concise executive summary (3-5 paragraphs) that:

1. Opens with an overall assessment of the plan's fee competitiveness
2. Highlights specific fee components that are notably above or below market
3. **IMPORTANT**: When discussing fees, consider the services included with each provider. Comment on whether fee levels appear reasonable given the scope of services provided. For example, higher advisor fees may be justified by comprehensive fiduciary support, participant education, and quarterly reviews.
4. Identifies the most significant opportunities for improvement${proposedCalculatedFees ? ', quantifies the value of the proposed changes, and discusses any differences in service levels between existing and proposed providers' : ''}
5. Provides 2-3 actionable recommendations for the plan sponsor
6. Maintains a professional, objective tone suitable for client-facing materials

Focus on insights that matter to plan fiduciaries. Ground all statements in the data provided above - do not make assumptions or add information not present in the data. Pay special attention to the relationship between fees and services - a lower fee is not always better if it means reduced service quality or eliminated features that benefit participants.

Format the response in clear paragraphs with occasional bold text for emphasis on key metrics.`;

  return prompt;
}

/**
 * Validates that required environment variables for Azure OpenAI are present
 */
export function validateAzureConfig(): { valid: boolean; error?: string } {
  const required = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_DEPLOYMENT',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      return {
        valid: false,
        error: `Missing required environment variable: ${key}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generates a dummy executive summary for development/demo purposes
 * when Azure OpenAI is not configured.
 */
export function generateDummySummary(request: AISummaryRequest): string {
  const { calculatedFees, benchmarks, proposedCalculatedFees, aumBucket, planData, proposedPlanData } = request;
  const aum = planData.assetsUnderManagement || 0;
  const participants = planData.participantCount || 0;

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Note: calculatedFees.percentage values are already percentages (e.g., 0.9 for 0.9%)
  // So we don't multiply by 100 here
  const formatPercent = (percentage: number) =>
    `${percentage.toFixed(2)}%`;

  // Helper to count services
  const countServices = (services: any): number => {
    if (!services) return 0;
    return Object.values(services).filter(v => v === true).length;
  };

  // Helper to get service context for a provider
  const getServiceContext = (providerKey: 'advisor' | 'recordKeeper' | 'tpa' | 'audit'): string => {
    const services = planData.services?.[providerKey];
    const count = countServices(services);
    if (count === 0) return '';

    const serviceLabels: Record<string, string> = {
      advisor: 'comprehensive advisory services',
      recordKeeper: 'full-service recordkeeping',
      tpa: 'complete TPA services',
      audit: 'audit services'
    };

    return ` with ${serviceLabels[providerKey]} (${count} service${count > 1 ? 's' : ''} included)`;
  };

  // Determine overall competitiveness
  const totalFeePercentile = calculatedFees.total.percentage <= benchmarks.total.p25 ? 'excellent' :
    calculatedFees.total.percentage <= benchmarks.total.p50 ? 'very competitive' :
    calculatedFees.total.percentage <= benchmarks.total.p75 ? 'moderately competitive' : 'above market';

  // Find highest cost area
  const feeTypes = ['advisor', 'recordKeeper', 'tpa', 'investmentMenu'] as const;
  let highestCostArea = 'advisor';
  let highestPercentile = 0;

  feeTypes.forEach(type => {
    const fee = calculatedFees[type].percentage;
    const benchmark = benchmarks[type];
    if (fee > benchmark.p75) {
      const percentileScore = (fee - benchmark.p50) / benchmark.p50;
      if (percentileScore > highestPercentile) {
        highestPercentile = percentileScore;
        highestCostArea = type;
      }
    }
  });

  const areaNames: Record<string, string> = {
    advisor: 'advisor fee',
    recordKeeper: 'record keeper fee',
    tpa: 'TPA fee',
    investmentMenu: 'investment menu fee'
  };

  let summary = `This retirement plan with **${formatCurrency(aum)}** in assets serving **${participants.toLocaleString()} participants** demonstrates **${totalFeePercentile}** fee competitiveness relative to industry benchmarks in the ${aumBucket} AUM category. The total plan fee of **${formatPercent(calculatedFees.total.percentage)}** provides important context for evaluating the overall value proposition.\n\n`;

  // Paragraph 2: Specific fee analysis
  const advisorPosition = calculatedFees.advisor.percentage <= benchmarks.advisor.p25 ? 'well below the 25th percentile' :
    calculatedFees.advisor.percentage <= benchmarks.advisor.p50 ? 'between the 25th and 50th percentile' :
    calculatedFees.advisor.percentage <= benchmarks.advisor.p75 ? 'between the 50th and 75th percentile' : 'above the 75th percentile';

  const rkPosition = calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p25 ? 'well below the 25th percentile' :
    calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p50 ? 'between the 25th and 50th percentile' :
    calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p75 ? 'between the 50th and 75th percentile' : 'above the 75th percentile';

  summary += `The **advisor fee** at ${formatPercent(calculatedFees.advisor.percentage)} positions ${advisorPosition}${getServiceContext('advisor')}, while the **record keeper fee** at ${formatPercent(calculatedFees.recordKeeper.percentage)} falls ${rkPosition}${getServiceContext('recordKeeper')}. `;

  if (calculatedFees.tpa.percentage > 0.0001) {
    const tpaPosition = calculatedFees.tpa.percentage <= benchmarks.tpa.p25 ? 'below market' :
      calculatedFees.tpa.percentage <= benchmarks.tpa.p75 ? 'at market' : 'above market';
    summary += `The TPA fee of ${formatPercent(calculatedFees.tpa.percentage)} is ${tpaPosition}${getServiceContext('tpa')}. `;
  }

  // Add service value assessment
  const totalServices = countServices(planData.services?.advisor) +
                       countServices(planData.services?.recordKeeper) +
                       countServices(planData.services?.tpa) +
                       countServices(planData.services?.audit);

  if (totalServices > 0 && calculatedFees.total.percentage > benchmarks.total.p50) {
    summary += `It's worth noting that the fee structure includes **${totalServices} documented service${totalServices > 1 ? 's' : ''}**, which may justify costs above the median benchmark. `;
  }

  if (highestPercentile > 0.2) {
    summary += `The **${areaNames[highestCostArea]}** represents the highest opportunity area for potential cost optimization.\n\n`;
  } else {
    summary += `Overall, the fee structure demonstrates balanced pricing across all major components.\n\n`;
  }

  // Paragraph 3: Proposed plan or investment menu
  if (proposedCalculatedFees && proposedPlanData) {
    const savings = calculatedFees.total.dollarAmount - proposedCalculatedFees.total.dollarAmount;
    const savingsPercent = calculatedFees.total.percentage - proposedCalculatedFees.total.percentage;

    // Compare service levels
    const existingServices = totalServices;
    const proposedServices = countServices(proposedPlanData.services?.advisor) +
                            countServices(proposedPlanData.services?.recordKeeper) +
                            countServices(proposedPlanData.services?.tpa) +
                            countServices(proposedPlanData.services?.audit);

    if (savings > 0) {
      summary += `Analysis of the proposed plan structure reveals a **significant opportunity for cost reduction**. The proposed fee structure would reduce total fees from **${formatCurrency(calculatedFees.total.dollarAmount)}** to **${formatCurrency(proposedCalculatedFees.total.dollarAmount)}**, representing **annual savings of ${formatCurrency(savings)}** or **${formatPercent(Math.abs(savingsPercent))}** in percentage terms. `;

      // Comment on service level changes
      if (proposedServices > 0 && existingServices > 0) {
        const serviceDelta = proposedServices - existingServices;
        if (serviceDelta < 0) {
          summary += `However, this reduction comes with **${Math.abs(serviceDelta)} fewer service${Math.abs(serviceDelta) > 1 ? 's' : ''}** (${proposedServices} vs ${existingServices}), which should be carefully evaluated to ensure no critical capabilities are being eliminated. `;
        } else if (serviceDelta > 0) {
          summary += `Notably, the proposed plan includes **${serviceDelta} additional service${serviceDelta > 1 ? 's' : ''}** (${proposedServices} vs ${existingServices}), representing enhanced value at lower cost. `;
        }
      }

      summary += `These savings would directly benefit participant account balances and improve long-term retirement outcomes.\n\n`;
    } else {
      summary += `The proposed plan structure shows a fee increase of **${formatCurrency(Math.abs(savings))}**, which should be evaluated against any enhanced services or features provided. `;

      // Justify fee increases with service enhancements
      if (proposedServices > existingServices) {
        const serviceDelta = proposedServices - existingServices;
        summary += `The increase is accompanied by **${serviceDelta} additional service${serviceDelta > 1 ? 's' : ''}** (${proposedServices} vs ${existingServices}), which may justify the higher fees through enhanced participant support and plan administration. `;
      }

      summary += `Plan fiduciaries should carefully document the rationale for any fee increases to maintain compliance with ERISA prudence standards.\n\n`;
    }
  } else {
    const invPosition = calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p25 ? 'exceptional value, well below market benchmarks' :
      calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p50 ? 'good value relative to market' :
      calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p75 ? 'aligned with market standards' : 'above market averages';
    summary += `The **investment menu fee** at ${formatPercent(calculatedFees.investmentMenu.percentage)} demonstrates ${invPosition}. This component should be evaluated in the context of the investment lineup quality, fund performance, and available investment options.\n\n`;
  }

  // Paragraph 4: Recommendations
  summary += `**Recommended actions** for plan fiduciaries include: **(1)** Document this fee benchmarking analysis as evidence of ongoing fiduciary oversight and ERISA compliance, **(2)** `;

  if (highestPercentile > 0.2) {
    summary += `Consider conducting a competitive RFP process or fee negotiation specifically targeting the ${areaNames[highestCostArea]} to optimize plan costs, **(3)** `;
  } else {
    summary += `Continue annual fee benchmarking to ensure ongoing competitiveness, **(3)** `;
  }

  if (proposedCalculatedFees && (calculatedFees.total.dollarAmount - proposedCalculatedFees.total.dollarAmount) > 0) {
    summary += `Proceed with implementation of the proposed fee structure after confirming service level agreements and transition timelines with proposed vendors.`;
  } else {
    summary += `Review participant communication materials to ensure transparency around plan fees and investment costs.`;
  }

  return summary;
}
