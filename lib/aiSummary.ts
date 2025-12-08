import type { AISummaryRequest } from './types';
import {
  calculateServiceValueScore,
  getMissingEssentialServices,
  advisorServiceBaseline,
  recordkeeperServiceBaseline,
  tpaServiceBaseline,
  auditServiceBaseline
} from './serviceBaselines';

/**
 * Builds a structured prompt for Azure OpenAI to generate an executive summary
 * of retirement plan fee benchmarking results.
 *
 * The prompt combines:
 * - Plan metadata (AUM, participants, benchmark bucket)
 * - Calculated fee breakdowns (dollar amounts and percentages)
 * - Benchmark comparisons (percentile positioning)
 * - Service baseline analysis (essential/standard/premium tiers)
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

  // Calculate service value score and get insights
  const serviceAnalysis = calculateServiceValueScore(planData.services, aum);

  // Get service labels for missing essential services
  const advisorServiceLabels: Record<string, string> = {
    planDesignConsulting: 'Plan Design Consulting',
    investmentMenuSelection: 'Investment Menu Selection',
    participantEducation: 'Participant Education',
    fiduciarySupport321: '3(21) Fiduciary Support',
    fiduciarySupport338: '3(38) Fiduciary Support',
    complianceAssistance: 'Compliance Assistance',
    quarterlyReviews: 'Quarterly Performance Reviews',
    customReporting: 'Custom Reporting'
  };

  const recordkeeperServiceLabels: Record<string, string> = {
    participantWebsite: 'Participant Website/Portal',
    mobileApp: 'Mobile App',
    callCenterSupport: 'Call Center Support',
    onlineEnrollment: 'Online Enrollment',
    loanAdministration: 'Loan Administration',
    distributionProcessing: 'Distribution Processing',
    payrollIntegration: 'Payroll Integration',
    dailyValuation: 'Daily Valuation',
    autoEnrollment: 'Auto-Enrollment Support',
    participantStatements: 'Participant Statements'
  };

  const tpaServiceLabels: Record<string, string> = {
    form5500Preparation: 'Form 5500 Preparation',
    discriminationTesting: 'Discrimination Testing',
    planDocumentUpdates: 'Plan Document Updates',
    amendmentServices: 'Amendment Services',
    noticePrparation: 'Notice Preparation',
    complianceTesting: 'Compliance Testing',
    governmentFilings: 'Government Filings',
    participantNotices: 'Participant Notices'
  };

  // Get missing essential services
  const missingAdvisor = getMissingEssentialServices(planData.services?.advisor, advisorServiceBaseline, advisorServiceLabels as any);
  const missingRecordkeeper = getMissingEssentialServices(planData.services?.recordKeeper, recordkeeperServiceBaseline, recordkeeperServiceLabels as any);
  const missingTPA = getMissingEssentialServices(planData.services?.tpa, tpaServiceBaseline, tpaServiceLabels as any);

  // Helper to format service lists
  const formatServices = (services: any, category: string): string => {
    if (!services) return '';
    const selectedServices = Object.keys(services).filter(key => services[key] === true);
    if (selectedServices.length === 0) return '';
    return `\n${category} Services Included:\n${selectedServices.map(s => `- ${s.replace(/([A-Z])/g, ' $1').trim()}`).join('\n')}`;
  };

  let prompt = `You are an expert retirement plan consultant analyzing fee benchmarking data for a comprehensive benchmarking report. This report will be used by plan fiduciaries to evaluate their current plan against market standards${proposedPlanData ? ' and to assess a proposed alternative plan structure' : ''}.

PLAN DETAILS:
- Assets Under Management: ${formatCurrency(aum)}
- Number of Participants: ${participants.toLocaleString()}
- AUM Benchmark Category: ${aumBucket}
- Average Balance per Participant: ${formatCurrency(aum / participants)}

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
- Benchmarks: 25th=${formatPercent(benchmarks.total.p25)}, 50th=${formatPercent(benchmarks.total.p50)}, 75th=${formatPercent(benchmarks.total.p75)}

SERVICE BASELINE ANALYSIS:
- Overall Service Value Score: ${serviceAnalysis.score}/100
  - Advisor Services Score: ${serviceAnalysis.breakdown.advisor}/100
  - Recordkeeper Services Score: ${serviceAnalysis.breakdown.recordKeeper}/100
  - TPA Services Score: ${serviceAnalysis.breakdown.tpa}/100
  - Audit Services Score: ${serviceAnalysis.breakdown.audit}/100
${missingAdvisor.length > 0 ? `\n⚠️ MISSING ESSENTIAL ADVISOR SERVICES:\n${missingAdvisor.map(s => `- ${s}`).join('\n')}` : ''}
${missingRecordkeeper.length > 0 ? `\n⚠️ MISSING ESSENTIAL RECORDKEEPER SERVICES:\n${missingRecordkeeper.map(s => `- ${s}`).join('\n')}` : ''}
${missingTPA.length > 0 ? `\n⚠️ MISSING ESSENTIAL TPA SERVICES:\n${missingTPA.map(s => `- ${s}`).join('\n')}` : ''}
${serviceAnalysis.insights.length > 0 ? `\nService Insights:\n${serviceAnalysis.insights.map(i => `- ${i}`).join('\n')}` : ''}

NOTE: Service scores weight essential services more heavily (3x) than standard (2x) or premium (1x) services. Missing essential services represent potential compliance or operational risks.`;

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
Generate a professional executive summary for a fee benchmarking report (3-5 paragraphs) that:

**PARAGRAPH 1 - BENCHMARKING OVERVIEW:**
- Start with a clear statement of the plan's overall position relative to market benchmarks
- Include total fee as percentage of AUM and its percentile positioning
- Reference the Service Value Score as context for evaluating fee competitiveness
- State whether fees are justified by service levels or if there are concerns

**PARAGRAPH 2 - COMPONENT ANALYSIS:**
- Analyze each major fee component (Advisor, Recordkeeper, TPA, Investment Menu) against benchmarks
- For each component that is notably above or below market, provide specific percentile context
- **CRITICAL**: Connect service coverage to fee positioning - e.g., "The advisor fee of X% is above the 75th percentile at Y%, but includes Z comprehensive services"
- Highlight any missing essential services as potential compliance risks

**PARAGRAPH 3 - ${proposedCalculatedFees ? 'PROPOSED PLAN COMPARISON' : 'INVESTMENT MENU & OPPORTUNITIES'}:**
${proposedCalculatedFees ? `- Clearly state the total savings/increase from existing to proposed plan
- Break down where the major fee differences occur by component
- **IMPORTANT**: Compare service levels between existing and proposed - are any services being added or removed?
- Evaluate whether the proposed plan represents better value considering both fees AND services
- If services are reduced in proposed plan, flag any essential service gaps as risks` : `- Evaluate the investment menu fee against benchmarks
- Identify the highest-cost component as the primary optimization opportunity
- Suggest next steps for improving fee competitiveness`}

**PARAGRAPH 4 - RECOMMENDATIONS:**
- Provide 2-3 specific, actionable recommendations prioritized by impact
- If essential services are missing, make addressing them the #1 priority
- If comparing to proposed plan, clearly recommend whether to proceed and why
- Include a recommendation about documenting this analysis for ERISA compliance

**FORMATTING & TONE:**
- Use bold text for key metrics (fees, percentages, savings amounts)
- Maintain professional, objective language suitable for plan sponsor review
- Ground all statements in the provided data - no assumptions or external information
- Remember: This is a BENCHMARKING REPORT, not a sales pitch. Present facts objectively.

**SERVICE-FEE RELATIONSHIP:**
A lower fee is not always better if essential services are missing. Conversely, higher fees can be justified by comprehensive service packages. Always evaluate fees in the context of the Service Value Score and any missing essential services. When comparing existing vs proposed, emphasize that the benchmarking analysis should consider BOTH fee competitiveness AND service adequacy.`;

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

  // Calculate service value scores for existing and proposed
  const serviceAnalysis = calculateServiceValueScore(planData.services, aum);
  const proposedServiceAnalysis = proposedPlanData
    ? calculateServiceValueScore(proposedPlanData.services, aum)
    : null;

  // Get missing essential services
  const advisorServiceLabels: Record<string, string> = {
    planDesignConsulting: 'Plan Design Consulting',
    investmentMenuSelection: 'Investment Menu Selection',
    participantEducation: 'Participant Education',
    fiduciarySupport321: '3(21) Fiduciary Support',
    fiduciarySupport338: '3(38) Fiduciary Support',
    complianceAssistance: 'Compliance Assistance',
    quarterlyReviews: 'Quarterly Performance Reviews',
    customReporting: 'Custom Reporting'
  };

  const recordkeeperServiceLabels: Record<string, string> = {
    participantWebsite: 'Participant Website/Portal',
    mobileApp: 'Mobile App',
    callCenterSupport: 'Call Center Support',
    onlineEnrollment: 'Online Enrollment',
    loanAdministration: 'Loan Administration',
    distributionProcessing: 'Distribution Processing',
    payrollIntegration: 'Payroll Integration',
    dailyValuation: 'Daily Valuation',
    autoEnrollment: 'Auto-Enrollment Support',
    participantStatements: 'Participant Statements'
  };

  const tpaServiceLabels: Record<string, string> = {
    form5500Preparation: 'Form 5500 Preparation',
    discriminationTesting: 'Discrimination Testing',
    planDocumentUpdates: 'Plan Document Updates',
    amendmentServices: 'Amendment Services',
    noticePrparation: 'Notice Preparation',
    complianceTesting: 'Compliance Testing',
    governmentFilings: 'Government Filings',
    participantNotices: 'Participant Notices'
  };

  const missingAdvisor = getMissingEssentialServices(planData.services?.advisor, advisorServiceBaseline, advisorServiceLabels as any);
  const missingRecordkeeper = getMissingEssentialServices(planData.services?.recordKeeper, recordkeeperServiceBaseline, recordkeeperServiceLabels as any);
  const missingTPA = getMissingEssentialServices(planData.services?.tpa, tpaServiceBaseline, tpaServiceLabels as any);

  // Check proposed plan for missing services
  const proposedMissingAdvisor = proposedPlanData
    ? getMissingEssentialServices(proposedPlanData.services?.advisor, advisorServiceBaseline, advisorServiceLabels as any)
    : [];
  const proposedMissingRecordkeeper = proposedPlanData
    ? getMissingEssentialServices(proposedPlanData.services?.recordKeeper, recordkeeperServiceBaseline, recordkeeperServiceLabels as any)
    : [];
  const proposedMissingTPA = proposedPlanData
    ? getMissingEssentialServices(proposedPlanData.services?.tpa, tpaServiceBaseline, tpaServiceLabels as any)
    : [];

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

  // Determine service quality assessment
  const serviceQuality = serviceAnalysis.score >= 80 ? 'comprehensive' :
    serviceAnalysis.score >= 60 ? 'adequate' :
    serviceAnalysis.score >= 40 ? 'limited' : 'concerning';

  // Paragraph 1: Benchmarking Overview
  let summary = `**BENCHMARKING OVERVIEW**: This retirement plan with **${formatCurrency(aum)}** in assets serving **${participants.toLocaleString()} participants** (avg balance: **${formatCurrency(aum / participants)}**) has been benchmarked against ${aumBucket} AUM category market data. The current total plan fee of **${formatPercent(calculatedFees.total.percentage)} of AUM** (${formatCurrency(calculatedFees.total.dollarAmount)} annually) positions the plan **${totalFeePercentile}** relative to the market median of ${formatPercent(benchmarks.total.p50)}. `;

  summary += `With a **Service Value Score of ${serviceAnalysis.score}/100** indicating ${serviceQuality} service coverage, `;

  if (calculatedFees.total.percentage > benchmarks.total.p50 && serviceAnalysis.score >= 70) {
    summary += `the above-median fees appear justified by the comprehensive service package included. `;
  } else if (calculatedFees.total.percentage < benchmarks.total.p50 && serviceAnalysis.score < 60) {
    summary += `the below-median fees come with a limited service package that may present operational risks. `;
  } else if (calculatedFees.total.percentage > benchmarks.total.p75 && serviceAnalysis.score < 60) {
    summary += `the above-market fees combined with limited service coverage represent a significant concern requiring immediate attention. `;
  } else {
    summary += `fees and service levels appear reasonably aligned with market standards. `;
  }

  const totalMissingEssential = missingAdvisor.length + missingRecordkeeper.length + missingTPA.length;
  if (totalMissingEssential > 0) {
    summary += `**⚠️ Note**: The plan is missing **${totalMissingEssential} essential service${totalMissingEssential > 1 ? 's' : ''}**, which represents potential compliance and operational risks.\n\n`;
  } else {
    summary += `\n\n`;
  }

  // Paragraph 2: Component Analysis with Service Context
  summary += `**COMPONENT ANALYSIS**: `;

  const advisorServices = countServices(planData.services?.advisor);
  const rkServices = countServices(planData.services?.recordKeeper);
  const tpaServices = countServices(planData.services?.tpa);

  const advisorPosition = calculatedFees.advisor.percentage <= benchmarks.advisor.p25 ? 'below the 25th percentile' :
    calculatedFees.advisor.percentage <= benchmarks.advisor.p50 ? 'at the lower end of the market' :
    calculatedFees.advisor.percentage <= benchmarks.advisor.p75 ? 'near the market median' : 'above the 75th percentile';

  summary += `The **advisor fee of ${formatPercent(calculatedFees.advisor.percentage)}** (${formatCurrency(calculatedFees.advisor.dollarAmount)}) positions ${advisorPosition} (median: ${formatPercent(benchmarks.advisor.p50)})`;
  if (advisorServices > 0) {
    summary += ` and includes ${advisorServices} documented service${advisorServices > 1 ? 's' : ''} (score: ${serviceAnalysis.breakdown.advisor}/100)`;
  }
  summary += `. `;

  const rkPosition = calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p25 ? 'below the 25th percentile' :
    calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p50 ? 'at the lower end of the market' :
    calculatedFees.recordKeeper.percentage <= benchmarks.recordKeeper.p75 ? 'near the market median' : 'above the 75th percentile';

  summary += `The **recordkeeper fee of ${formatPercent(calculatedFees.recordKeeper.percentage)}** (${formatCurrency(calculatedFees.recordKeeper.dollarAmount)}) is ${rkPosition} (median: ${formatPercent(benchmarks.recordKeeper.p50)})`;
  if (rkServices > 0) {
    summary += ` with ${rkServices} service${rkServices > 1 ? 's' : ''} included (score: ${serviceAnalysis.breakdown.recordKeeper}/100)`;
  }
  summary += `. `;

  if (calculatedFees.tpa.percentage > 0.0001) {
    const tpaPosition = calculatedFees.tpa.percentage <= benchmarks.tpa.p25 ? 'below the 25th percentile' :
      calculatedFees.tpa.percentage <= benchmarks.tpa.p50 ? 'at the lower end of the market' :
      calculatedFees.tpa.percentage <= benchmarks.tpa.p75 ? 'near the market median' : 'above the 75th percentile';
    summary += `The **TPA fee of ${formatPercent(calculatedFees.tpa.percentage)}** (${formatCurrency(calculatedFees.tpa.dollarAmount)}) is ${tpaPosition} (median: ${formatPercent(benchmarks.tpa.p50)})`;
    if (tpaServices > 0) {
      summary += ` with ${tpaServices} service${tpaServices > 1 ? 's' : ''} provided (score: ${serviceAnalysis.breakdown.tpa}/100)`;
    }
    summary += `. `;
  }

  // Highlight missing essential services by provider
  if (missingAdvisor.length > 0) {
    summary += `**⚠️ Advisor Gap**: Missing ${missingAdvisor.length} essential service${missingAdvisor.length > 1 ? 's' : ''}: ${missingAdvisor.slice(0, 2).join(', ')}${missingAdvisor.length > 2 ? ', and others' : ''}. `;
  }
  if (missingRecordkeeper.length > 0) {
    summary += `**⚠️ Recordkeeper Gap**: Missing ${missingRecordkeeper.length} essential service${missingRecordkeeper.length > 1 ? 's' : ''}: ${missingRecordkeeper.slice(0, 2).join(', ')}${missingRecordkeeper.length > 2 ? ', and others' : ''}. `;
  }
  if (missingTPA.length > 0) {
    summary += `**⚠️ TPA Gap**: Missing ${missingTPA.length} essential service${missingTPA.length > 1 ? 's' : ''}: ${missingTPA.slice(0, 2).join(', ')}${missingTPA.length > 2 ? ', and others' : ''}. `;
  }

  // Investment menu
  const invPosition = calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p25 ? 'excellent, well below market' :
    calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p50 ? 'good, below median' :
    calculatedFees.investmentMenu.percentage <= benchmarks.investmentMenu.p75 ? 'at market levels' : 'above market';
  summary += `The **investment menu fee of ${formatPercent(calculatedFees.investmentMenu.percentage)}** (${formatCurrency(calculatedFees.investmentMenu.dollarAmount)}) is ${invPosition} (median: ${formatPercent(benchmarks.investmentMenu.p50)}).\n\n`;

  // Paragraph 3: Proposed Plan Comparison or Opportunity Analysis
  if (proposedCalculatedFees && proposedPlanData && proposedServiceAnalysis) {
    const savings = calculatedFees.total.dollarAmount - proposedCalculatedFees.total.dollarAmount;
    const savingsPercent = calculatedFees.total.percentage - proposedCalculatedFees.total.percentage;

    // Compare service levels by provider
    const proposedAdvisorServices = countServices(proposedPlanData.services?.advisor);
    const proposedRkServices = countServices(proposedPlanData.services?.recordKeeper);
    const proposedTpaServices = countServices(proposedPlanData.services?.tpa);

    const proposedTotalMissing = proposedMissingAdvisor.length + proposedMissingRecordkeeper.length + proposedMissingTPA.length;

    summary += `**PROPOSED PLAN COMPARISON**: `;

    if (savings > 0) {
      summary += `The proposed fee structure demonstrates a **${formatCurrency(savings)} annual cost reduction** (from ${formatPercent(calculatedFees.total.percentage)} to ${formatPercent(proposedCalculatedFees.total.percentage)}), positioning the plan ${proposedCalculatedFees.total.percentage <= benchmarks.total.p25 ? 'well below the 25th percentile' : proposedCalculatedFees.total.percentage <= benchmarks.total.p50 ? 'below the market median' : proposedCalculatedFees.total.percentage <= benchmarks.total.p75 ? 'near the market median' : 'above the 75th percentile'} at ${formatPercent(proposedCalculatedFees.total.percentage)} vs. median of ${formatPercent(benchmarks.total.p50)}. `;

      // Detail component-by-component comparison
      const advisorSavings = calculatedFees.advisor.dollarAmount - proposedCalculatedFees.advisor.dollarAmount;
      const rkSavings = calculatedFees.recordKeeper.dollarAmount - proposedCalculatedFees.recordKeeper.dollarAmount;
      const tpaSavings = calculatedFees.tpa.dollarAmount - proposedCalculatedFees.tpa.dollarAmount;

      summary += `Fee reductions by component: `;
      if (advisorSavings > 0) summary += `Advisor **${formatCurrency(advisorSavings)}** (${proposedAdvisorServices} services, score: ${proposedServiceAnalysis.breakdown.advisor}/100 vs. ${serviceAnalysis.breakdown.advisor}/100), `;
      if (rkSavings > 0) summary += `Recordkeeper **${formatCurrency(rkSavings)}** (${proposedRkServices} services, score: ${proposedServiceAnalysis.breakdown.recordKeeper}/100 vs. ${serviceAnalysis.breakdown.recordKeeper}/100), `;
      if (tpaSavings > 0) summary += `TPA **${formatCurrency(tpaSavings)}** (${proposedTpaServices} services, score: ${proposedServiceAnalysis.breakdown.tpa}/100 vs. ${serviceAnalysis.breakdown.tpa}/100). `;

      // Service Value Score comparison
      const scoreDelta = proposedServiceAnalysis.score - serviceAnalysis.score;
      summary += `The **proposed Service Value Score of ${proposedServiceAnalysis.score}/100** represents a ${scoreDelta >= 0 ? `${scoreDelta}-point improvement` : `${Math.abs(scoreDelta)}-point reduction`} from the current ${serviceAnalysis.score}/100. `;

      // Critical service gap analysis
      if (proposedTotalMissing > totalMissingEssential && proposedTotalMissing > 0) {
        summary += `**⚠️ CONCERN**: The proposed plan introduces **${proposedTotalMissing - totalMissingEssential} additional essential service gap${(proposedTotalMissing - totalMissingEssential) > 1 ? 's' : ''}**, raising total missing essential services to ${proposedTotalMissing}. This may create compliance and operational risks that offset the fee savings. `;
      } else if (proposedTotalMissing < totalMissingEssential) {
        summary += `**✓ IMPROVEMENT**: The proposed plan addresses **${totalMissingEssential - proposedTotalMissing} essential service gap${(totalMissingEssential - proposedTotalMissing) > 1 ? 's' : ''}**, reducing missing services from ${totalMissingEssential} to ${proposedTotalMissing}. `;
      } else if (proposedTotalMissing > 0) {
        summary += `**NOTE**: The proposed plan maintains ${proposedTotalMissing} missing essential service${proposedTotalMissing > 1 ? 's' : ''} that should be addressed. `;
      }

      summary += `\n\n`;
    } else {
      summary += `The proposed plan shows a **${formatCurrency(Math.abs(savings))} annual fee increase** (from ${formatPercent(calculatedFees.total.percentage)} to ${formatPercent(proposedCalculatedFees.total.percentage)}). `;

      // Justify with service improvements
      const scoreDelta = proposedServiceAnalysis.score - serviceAnalysis.score;
      if (scoreDelta > 10) {
        summary += `This increase is accompanied by a **significant ${scoreDelta}-point service improvement** (from ${serviceAnalysis.score}/100 to ${proposedServiceAnalysis.score}/100), which may justify the higher fees through enhanced capabilities. `;
      }

      if (proposedTotalMissing < totalMissingEssential) {
        summary += `The proposed plan addresses **${totalMissingEssential - proposedTotalMissing} essential service gap${(totalMissingEssential - proposedTotalMissing) > 1 ? 's' : ''}**, improving compliance and operational effectiveness. `;
      }

      summary += `Plan fiduciaries should carefully document the rationale for fee increases to maintain compliance with ERISA prudence standards.\n\n`;
    }
  } else {
    // No proposed plan - identify opportunities
    summary += `**OPTIMIZATION OPPORTUNITIES**: `;

    if (highestPercentile > 0.2) {
      const highestCostArea = feeTypes.reduce((highest, type) => {
        const fee = calculatedFees[type].percentage;
        const benchmark = benchmarks[type];
        const percentileScore = (fee - benchmark.p50) / benchmark.p50;
        const currentHighest = (calculatedFees[highest].percentage - benchmarks[highest].p50) / benchmarks[highest].p50;
        return percentileScore > currentHighest ? type : highest;
      }, 'advisor' as const);

      const potentialSavings = calculatedFees[highestCostArea].dollarAmount * 0.15; // Assume 15% reduction possible
      summary += `The **${areaNames[highestCostArea]}** at ${formatPercent(calculatedFees[highestCostArea].percentage)} (vs. median ${formatPercent(benchmarks[highestCostArea].p50)}) represents the primary cost optimization opportunity. A competitive RFP could potentially generate **${formatCurrency(potentialSavings)} in annual savings** while maintaining or improving service levels. `;
    }

    if (totalMissingEssential > 0) {
      summary += `Priority should be given to addressing the **${totalMissingEssential} missing essential service${totalMissingEssential > 1 ? 's' : ''}** to ensure compliance and operational effectiveness. `;
    } else {
      summary += `The current service package is comprehensive with all essential services included. `;
    }

    summary += `\n\n`;
  }

  // Paragraph 4: Recommendations
  summary += `**RECOMMENDATIONS**: Based on this benchmarking analysis, plan fiduciaries should take the following actions:\n\n`;

  let recNumber = 1;

  // Priority 1: Missing essential services (if any)
  if (totalMissingEssential > 0) {
    summary += `**(${recNumber})** **ADDRESS SERVICE GAPS**: Immediately work with current providers to add the ${totalMissingEssential} missing essential service${totalMissingEssential > 1 ? 's' : ''} `;
    if (missingAdvisor.length > 0) summary += `(Advisor: ${missingAdvisor.join(', ')}) `;
    if (missingRecordkeeper.length > 0) summary += `(Recordkeeper: ${missingRecordkeeper.join(', ')}) `;
    if (missingTPA.length > 0) summary += `(TPA: ${missingTPA.join(', ')}) `;
    summary += `to ensure compliance with fiduciary responsibilities and operational effectiveness. `;
    recNumber++;
  }

  // Priority 2: Proposed plan decision or optimization opportunity
  if (proposedCalculatedFees && proposedPlanData && proposedServiceAnalysis) {
    const savings = calculatedFees.total.dollarAmount - proposedCalculatedFees.total.dollarAmount;
    const proposedTotalMissing = proposedMissingAdvisor.length + proposedMissingRecordkeeper.length + proposedMissingTPA.length;
    const scoreDelta = proposedServiceAnalysis.score - serviceAnalysis.score;

    if (savings > 0 && proposedTotalMissing <= totalMissingEssential && scoreDelta >= -10) {
      // Recommend proceeding with proposed plan
      summary += `**(${recNumber})** **IMPLEMENT PROPOSED PLAN**: Proceed with the proposed fee structure to capture **${formatCurrency(savings)} in annual savings** while ${proposedTotalMissing < totalMissingEssential ? 'improving service coverage' : 'maintaining adequate service levels'}. Confirm service level agreements and establish clear transition timelines with proposed vendors before finalizing. `;
    } else if (savings > 0 && proposedTotalMissing > totalMissingEssential) {
      // Caution against proposed plan due to service gaps
      summary += `**(${recNumber})** **RE-EVALUATE PROPOSED PLAN**: While the proposed plan offers **${formatCurrency(savings)} in savings**, the ${proposedTotalMissing - totalMissingEssential} additional missing essential service${(proposedTotalMissing - totalMissingEssential) > 1 ? 's' : ''} creates compliance risks. Work with proposed vendors to include these essential services before proceeding. `;
    } else if (savings < 0 && scoreDelta > 15) {
      // Fee increase justified by significant service improvement
      summary += `**(${recNumber})** **CONSIDER ENHANCED SERVICES**: The proposed plan's **${formatCurrency(Math.abs(savings))} fee increase** is accompanied by a ${scoreDelta}-point service improvement. Evaluate whether these enhanced capabilities align with plan objectives and participant needs. `;
    } else {
      // Fee increase not well justified
      summary += `**(${recNumber})** **CONTINUE CURRENT STRUCTURE**: The proposed plan does not demonstrate sufficient value improvement to justify implementation. Continue with the current structure while addressing any service gaps. `;
    }
    recNumber++;
  } else if (highestPercentile > 0.2) {
    // No proposed plan but opportunity exists
    const highestCostArea = feeTypes.reduce((highest, type) => {
      const fee = calculatedFees[type].percentage;
      const benchmark = benchmarks[type];
      const percentileScore = (fee - benchmark.p50) / benchmark.p50;
      const currentHighest = (calculatedFees[highest].percentage - benchmarks[highest].p50) / benchmarks[highest].p50;
      return percentileScore > currentHighest ? type : highest;
    }, 'advisor' as const);

    const potentialSavings = calculatedFees[highestCostArea].dollarAmount * 0.15;
    summary += `**(${recNumber})** **CONDUCT TARGETED RFP**: The **${areaNames[highestCostArea]}** represents the primary optimization opportunity. Conduct a competitive RFP process to potentially generate **${formatCurrency(potentialSavings)} in annual savings** while maintaining or improving current service levels. `;
    recNumber++;
  }

  // Always include documentation recommendation
  summary += `**(${recNumber})** **DOCUMENT FIDUCIARY OVERSIGHT**: Maintain this fee benchmarking analysis in plan records as evidence of ongoing prudent oversight and compliance with ERISA fiduciary standards. Conduct annual benchmarking reviews to ensure continued fee competitiveness and service adequacy.`;

  return summary;
}
