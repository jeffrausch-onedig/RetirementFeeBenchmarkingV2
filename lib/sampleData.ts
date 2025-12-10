/**
 * Sample data generator for development and testing purposes
 * Generates realistic retirement plan data for quick testing
 */

import type { PlanData, ServiceOptions, AUMBenchmarkCategory, BalanceBenchmarkCategory } from './types';

/**
 * Determines the appropriate AUM benchmark category based on plan AUM
 */
function getAUMBenchmarkCategory(aum: number): AUMBenchmarkCategory {
  if (aum < 250_000) return '$0-250k';
  if (aum < 500_000) return '$250-500k';
  if (aum < 1_000_000) return '$500k-1m';
  if (aum < 3_000_000) return '$1-3m';
  if (aum < 5_000_000) return '$3-5m';
  if (aum < 10_000_000) return '$5-10m';
  if (aum < 20_000_000) return '$10-20m';
  if (aum < 30_000_000) return '$20-30m';
  if (aum < 50_000_000) return '$30-50m';
  if (aum < 100_000_000) return '$50-100m';
  if (aum < 250_000_000) return '$100-250m';
  return '> $250m';
}

/**
 * Determines the appropriate balance benchmark category based on average balance
 */
function getBalanceBenchmarkCategory(avgBalance: number): BalanceBenchmarkCategory {
  if (avgBalance < 25_000) return '$0-25k';
  if (avgBalance < 50_000) return '$25-50k';
  if (avgBalance < 75_000) return '$50-75k';
  if (avgBalance < 100_000) return '$75-100k';
  return '> $100k';
}

/**
 * Generates realistic sample plan data
 * Returns both existing and proposed plan configurations
 */
export function generateSamplePlanData(): {
  existing: PlanData;
  proposed: PlanData;
} {
  // Generate a random AUM between $1M and $50M
  const aum = Math.floor(Math.random() * 49_000_000) + 1_000_000;

  // Participant count roughly correlated with AUM (average $50k-$150k per participant)
  const avgBalance = Math.floor(Math.random() * 100_000) + 50_000;
  const participants = Math.floor(aum / avgBalance);

  // Sample services - existing plan has comprehensive services
  const existingServices: ServiceOptions = {
    advisor: {
      investmentMenuSelection: true,
      fiduciarySupport321: true,
      complianceAssistance: true,
      planDesignConsulting: true,
      participantEducation: true,
      quarterlyReviews: true,
      fiduciarySupport338: false,
      customReporting: false,
    },
    recordKeeper: {
      participantWebsite: true,
      callCenterSupport: true,
      onlineEnrollment: true,
      mobileApp: true,
      loanAdministration: true,
      dailyValuation: true,
      participantStatements: true,
      payrollIntegration: false,
      autoEnrollment: true,
      distributionProcessing: true,
    },
    tpa: {
      form5500Preparation: true,
      discriminationTesting: true,
      complianceTesting: true,
      planDocumentUpdates: true,
      governmentFilings: true,
      participantNotices: true,
      amendmentServices: false,
      noticePrparation: false,
    },
    audit: {
      annualAudit: participants >= 100,
      fullScopeAudit: participants >= 100,
      limitedScopeAudit: false,
      biannualAudit: false,
      triannualAudit: false,
    },
  };

  // Proposed services - slightly enhanced
  const proposedServices: ServiceOptions = {
    advisor: {
      investmentMenuSelection: true,
      fiduciarySupport321: true,
      complianceAssistance: true,
      planDesignConsulting: true,
      participantEducation: true,
      quarterlyReviews: true,
      fiduciarySupport338: true, // Upgraded to 3(38)
      customReporting: true,
    },
    recordKeeper: {
      participantWebsite: true,
      callCenterSupport: true,
      onlineEnrollment: true,
      mobileApp: true,
      loanAdministration: true,
      dailyValuation: true,
      participantStatements: true,
      payrollIntegration: true, // Added payroll integration
      autoEnrollment: true,
      distributionProcessing: true,
    },
    tpa: {
      form5500Preparation: true,
      discriminationTesting: true,
      complianceTesting: true,
      planDocumentUpdates: true,
      governmentFilings: true,
      participantNotices: true,
      amendmentServices: true, // Added amendment services
      noticePrparation: true,
    },
    audit: {
      annualAudit: participants >= 100,
      fullScopeAudit: false,
      limitedScopeAudit: participants >= 100, // Switched to limited scope
      biannualAudit: false,
      triannualAudit: false,
    },
  };

  // Generate realistic fee structures aligned with benchmark data
  // Advisor fees: scale based on plan size to match benchmarks (typically 50th-75th percentile)
  let advisorBps: number;
  if (aum < 5_000_000) {
    // Small plans: 40-75 bps (benchmarks show 50-75 for < $5M)
    advisorBps = Math.floor(Math.random() * 35) + 40;
  } else if (aum < 20_000_000) {
    // Mid-small plans: 25-40 bps (benchmarks show 25-50 for $5-20M)
    advisorBps = Math.floor(Math.random() * 15) + 25;
  } else if (aum < 50_000_000) {
    // Mid-large plans: 14-27 bps (benchmarks show 14-25 for $20-50M)
    advisorBps = Math.floor(Math.random() * 13) + 14;
  } else {
    // Large plans: 5-10 bps (benchmarks show 3-7 for $50M+)
    advisorBps = Math.floor(Math.random() * 5) + 5;
  }

  // Recordkeeper: varies by plan size, bps for large plans or flat for smaller
  const recordkeeperBps = aum > 10_000_000
    ? Math.floor(Math.random() * 15) + 15 // 15-30 bps for large plans
    : 0;
  const recordkeeperFlat = aum <= 10_000_000
    ? Math.floor(Math.random() * 10_000) + 8_000 // $8k-$18k for smaller plans
    : 0;

  // TPA: flat + per participant (keeping reasonable ranges)
  const tpaFlat = Math.floor(Math.random() * 2_000) + 2_000; // $2k-$4k base
  const tpaPerHead = Math.floor(Math.random() * 20) + 30; // $30-$50 per participant

  // Investment menu: 15-30 basis points (slightly reduced upper range)
  const investmentMenuBps = Math.floor(Math.random() * 15) + 15;

  // Calculate benchmark categories based on AUM and average balance
  const benchmarkCategory = getAUMBenchmarkCategory(aum);
  const balanceBenchmarkCategory = getBalanceBenchmarkCategory(avgBalance);

  const existing: PlanData = {
    assetsUnderManagement: aum,
    participantCount: participants,
    benchmarkCategory,
    balanceBenchmarkCategory,
    feeType: 'unbundled',
    fees: {
      advisor: {
        type: 'basisPoints',
        basisPoints: advisorBps,
      },
      recordKeeper: recordkeeperBps > 0
        ? {
            type: 'basisPoints',
            basisPoints: recordkeeperBps,
          }
        : {
            type: 'flatFee',
            flatFee: recordkeeperFlat,
          },
      tpa: {
        type: 'flatPlusPerHead',
        flatFee: tpaFlat,
        perHeadFee: tpaPerHead,
      },
      investmentMenu: {
        type: 'basisPoints',
        basisPoints: investmentMenuBps,
      },
    },
    services: existingServices,
  };

  // Proposed plan with slightly lower fees (10-20% reduction)
  const proposedAdvisorBps = Math.floor(advisorBps * 0.85);
  const proposedRecordkeeperBps = recordkeeperBps > 0
    ? Math.floor(recordkeeperBps * 0.9)
    : 0;
  const proposedRecordkeeperFlat = recordkeeperFlat > 0
    ? Math.floor(recordkeeperFlat * 0.9)
    : 0;
  const proposedTpaFlat = Math.floor(tpaFlat * 0.95);
  const proposedTpaPerHead = Math.floor(tpaPerHead * 0.95);
  const proposedInvestmentMenuBps = Math.floor(investmentMenuBps * 0.9);

  const proposed: PlanData = {
    assetsUnderManagement: aum,
    participantCount: participants,
    benchmarkCategory,
    balanceBenchmarkCategory,
    feeType: 'unbundled',
    fees: {
      advisor: {
        type: 'basisPoints',
        basisPoints: proposedAdvisorBps,
      },
      recordKeeper: proposedRecordkeeperBps > 0
        ? {
            type: 'basisPoints',
            basisPoints: proposedRecordkeeperBps,
          }
        : {
            type: 'flatFee',
            flatFee: proposedRecordkeeperFlat,
          },
      tpa: {
        type: 'flatPlusPerHead',
        flatFee: proposedTpaFlat,
        perHeadFee: proposedTpaPerHead,
      },
      investmentMenu: {
        type: 'basisPoints',
        basisPoints: proposedInvestmentMenuBps,
      },
    },
    services: proposedServices,
  };

  return { existing, proposed };
}

/**
 * Generates a variety of sample scenarios for different testing cases
 */
export const sampleScenarios = {
  smallPlan: (): { existing: PlanData; proposed: PlanData } => {
    const aum = 2_500_000;
    const participants = 35;
    const avgBalance = aum / participants; // ~$71,428

    return {
      existing: {
        assetsUnderManagement: aum,
        participantCount: participants,
        benchmarkCategory: getAUMBenchmarkCategory(aum), // $1-3m
        balanceBenchmarkCategory: getBalanceBenchmarkCategory(avgBalance), // $50-75k
        feeType: 'unbundled',
        fees: {
          advisor: { type: 'basisPoints', basisPoints: 50 }, // At 50th percentile for $1-3m
          recordKeeper: { type: 'flatFee', flatFee: 12_000 },
          tpa: { type: 'flatPlusPerHead', flatFee: 2_500, perHeadFee: 50 },
          investmentMenu: { type: 'basisPoints', basisPoints: 25 },
        },
        services: {
          advisor: {
            investmentMenuSelection: true,
            fiduciarySupport321: true,
            complianceAssistance: true,
          },
          recordKeeper: {
            participantWebsite: true,
            callCenterSupport: true,
            onlineEnrollment: true,
          },
          tpa: {
            form5500Preparation: true,
            discriminationTesting: true,
            complianceTesting: true,
          },
          audit: {},
        },
      },
      proposed: {
        assetsUnderManagement: aum,
        participantCount: participants,
        benchmarkCategory: getAUMBenchmarkCategory(aum), // $1-3m
        balanceBenchmarkCategory: getBalanceBenchmarkCategory(avgBalance), // $50-75k
        feeType: 'unbundled',
        fees: {
          advisor: { type: 'basisPoints', basisPoints: 40 }, // Reduced to 25th percentile
          recordKeeper: { type: 'flatFee', flatFee: 10_000 },
          tpa: { type: 'flatPlusPerHead', flatFee: 2_000, perHeadFee: 45 },
          investmentMenu: { type: 'basisPoints', basisPoints: 20 },
        },
        services: {
          advisor: {
            investmentMenuSelection: true,
            fiduciarySupport321: true,
            complianceAssistance: true,
            planDesignConsulting: true,
          },
          recordKeeper: {
            participantWebsite: true,
            callCenterSupport: true,
            onlineEnrollment: true,
            mobileApp: true,
          },
          tpa: {
            form5500Preparation: true,
            discriminationTesting: true,
            complianceTesting: true,
            planDocumentUpdates: true,
          },
          audit: {},
        },
      },
    };
  },

  largePlan: (): { existing: PlanData; proposed: PlanData } => {
    const aum = 75_000_000;
    const participants = 850;
    const avgBalance = aum / participants; // ~$88,235

    return {
      existing: {
        assetsUnderManagement: aum,
        participantCount: participants,
        benchmarkCategory: getAUMBenchmarkCategory(aum), // $50-100m
        balanceBenchmarkCategory: getBalanceBenchmarkCategory(avgBalance), // $75-100k
        feeType: 'unbundled',
        fees: {
          advisor: { type: 'basisPoints', basisPoints: 7 }, // Within benchmark range for $50-100m
          recordKeeper: { type: 'basisPoints', basisPoints: 20 },
          tpa: { type: 'flatPlusPerHead', flatFee: 4_000, perHeadFee: 30 },
          investmentMenu: { type: 'basisPoints', basisPoints: 18 },
        },
        services: {
          advisor: {
            investmentMenuSelection: true,
            fiduciarySupport321: true,
            complianceAssistance: true,
            planDesignConsulting: true,
            participantEducation: true,
            quarterlyReviews: true,
            customReporting: true,
          },
          recordKeeper: {
            participantWebsite: true,
            callCenterSupport: true,
            onlineEnrollment: true,
            mobileApp: true,
            loanAdministration: true,
            dailyValuation: true,
            participantStatements: true,
            payrollIntegration: true,
            autoEnrollment: true,
            distributionProcessing: true,
          },
          tpa: {
            form5500Preparation: true,
            discriminationTesting: true,
            complianceTesting: true,
            planDocumentUpdates: true,
            governmentFilings: true,
            participantNotices: true,
            amendmentServices: true,
          },
          audit: {
            annualAudit: true,
            limitedScopeAudit: true,
          },
        },
      },
      proposed: {
        assetsUnderManagement: aum,
        participantCount: participants,
        benchmarkCategory: getAUMBenchmarkCategory(aum), // $50-100m
        balanceBenchmarkCategory: getBalanceBenchmarkCategory(avgBalance), // $75-100k
        feeType: 'unbundled',
        fees: {
          advisor: { type: 'basisPoints', basisPoints: 5 }, // Below median - competitive
          recordKeeper: { type: 'basisPoints', basisPoints: 18 },
          tpa: { type: 'flatPlusPerHead', flatFee: 3_500, perHeadFee: 25 },
          investmentMenu: { type: 'basisPoints', basisPoints: 15 },
        },
        services: {
          advisor: {
            investmentMenuSelection: true,
            fiduciarySupport321: true,
            fiduciarySupport338: true,
            complianceAssistance: true,
            planDesignConsulting: true,
            participantEducation: true,
            quarterlyReviews: true,
            customReporting: true,
          },
          recordKeeper: {
            participantWebsite: true,
            callCenterSupport: true,
            onlineEnrollment: true,
            mobileApp: true,
            loanAdministration: true,
            dailyValuation: true,
            participantStatements: true,
            payrollIntegration: true,
            autoEnrollment: true,
            distributionProcessing: true,
          },
          tpa: {
            form5500Preparation: true,
            discriminationTesting: true,
            complianceTesting: true,
            planDocumentUpdates: true,
            governmentFilings: true,
            participantNotices: true,
            amendmentServices: true,
            noticePrparation: true,
          },
          audit: {
            annualAudit: true,
            limitedScopeAudit: true,
          },
        },
      },
    };
  },
};
