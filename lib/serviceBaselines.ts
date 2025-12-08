/**
 * Service baseline definitions based on:
 * - DOL ERISA 408(b)(2) disclosure requirements
 * - Industry research from NAPA, PLANSPONSOR
 * - Common provider service offerings
 *
 * Services are categorized by tier:
 * - essential: Required for basic plan operation and fiduciary compliance
 * - standard: Expected for most plans in the market segment
 * - premium: Enhanced services that provide additional value
 */

import type {
  AdvisorServices,
  RecordkeeperServices,
  TPAServices,
  AuditServices,
  ServiceOptions
} from './types';

export type ServiceTier = 'essential' | 'standard' | 'premium';

export interface ServiceBaseline<T> {
  essential: (keyof T)[];
  standard: (keyof T)[];
  premium: (keyof T)[];
}

/**
 * Advisor service baselines
 * Based on ERISA fiduciary requirements and industry best practices
 */
export const advisorServiceBaseline: ServiceBaseline<AdvisorServices> = {
  // Essential: Core fiduciary and compliance services
  essential: [
    'investmentMenuSelection',
    'fiduciarySupport321',
    'complianceAssistance'
  ],
  // Standard: Expected for most advised plans
  standard: [
    'planDesignConsulting',
    'participantEducation',
    'quarterlyReviews'
  ],
  // Premium: Enhanced advisory services
  premium: [
    'fiduciarySupport338',
    'customReporting'
  ]
};

/**
 * Recordkeeper service baselines
 * Based on DOL 408(b)(2) disclosure standards and participant expectations
 */
export const recordkeeperServiceBaseline: ServiceBaseline<RecordkeeperServices> = {
  // Essential: Basic recordkeeping functionality
  essential: [
    'participantWebsite',
    'callCenterSupport',
    'onlineEnrollment'
  ],
  // Standard: Expected for modern recordkeeping platforms
  standard: [
    'mobileApp',
    'loanAdministration',
    'dailyValuation',
    'participantStatements'
  ],
  // Premium: Advanced features and integrations
  premium: [
    'payrollIntegration',
    'autoEnrollment',
    'distributionProcessing'
  ]
};

/**
 * TPA service baselines
 * Based on core compliance requirements and plan administration needs
 */
export const tpaServiceBaseline: ServiceBaseline<TPAServices> = {
  // Essential: Required compliance and regulatory services
  essential: [
    'form5500Preparation',
    'discriminationTesting',
    'complianceTesting'
  ],
  // Standard: Expected TPA administrative services
  standard: [
    'planDocumentUpdates',
    'governmentFilings',
    'participantNotices'
  ],
  // Premium: Enhanced plan document and amendment services
  premium: [
    'amendmentServices',
    'noticePrparation'
  ]
};

/**
 * Audit service baselines
 * Based on ERISA audit requirements (plans with 100+ participants)
 */
export const auditServiceBaseline: ServiceBaseline<AuditServices> = {
  // Essential: Required audit types
  essential: [
    'annualAudit'
  ],
  // Standard: Common audit scope options
  standard: [
    'fullScopeAudit',
    'limitedScopeAudit'
  ],
  // Premium: Alternative audit frequencies
  premium: [
    'biannualAudit',
    'triannualAudit'
  ]
};

/**
 * Plan size-based service expectations
 * Different plan sizes should expect different service levels
 */
export interface PlanSizeServiceExpectations {
  minAdvisorServices: number;
  minRecordkeeperServices: number;
  minTPAServices: number;
  recommendedTiers: ServiceTier[];
  notes: string;
}

export const planSizeExpectations: Record<string, PlanSizeServiceExpectations> = {
  'under5M': {
    minAdvisorServices: 3,
    minRecordkeeperServices: 4,
    minTPAServices: 3,
    recommendedTiers: ['essential'],
    notes: 'Small plans should prioritize essential services with focus on automation and cost efficiency'
  },
  '5M-50M': {
    minAdvisorServices: 5,
    minRecordkeeperServices: 6,
    minTPAServices: 5,
    recommendedTiers: ['essential', 'standard'],
    notes: 'Mid-market plans should include all essential services plus most standard services'
  },
  'over50M': {
    minAdvisorServices: 6,
    minRecordkeeperServices: 8,
    minTPAServices: 6,
    recommendedTiers: ['essential', 'standard', 'premium'],
    notes: 'Large plans should include comprehensive service packages with premium features'
  }
};

/**
 * Service tier labels for display
 */
export const serviceTierLabels: Record<ServiceTier, string> = {
  essential: 'Essential',
  standard: 'Standard',
  premium: 'Premium'
};

/**
 * Service tier descriptions
 */
export const serviceTierDescriptions: Record<ServiceTier, string> = {
  essential: 'Core services required for basic plan operation and fiduciary compliance',
  standard: 'Services expected by most plans in your market segment',
  premium: 'Enhanced services that provide additional value and capabilities'
};

/**
 * Get the tier for a specific service
 */
export function getServiceTier<T>(
  service: keyof T,
  baseline: ServiceBaseline<T>
): ServiceTier | null {
  if (baseline.essential.includes(service)) return 'essential';
  if (baseline.standard.includes(service)) return 'standard';
  if (baseline.premium.includes(service)) return 'premium';
  return null;
}

/**
 * Count services by tier for a given provider
 */
export function countServicesByTier<T>(
  services: Partial<T> | undefined,
  baseline: ServiceBaseline<T>
): Record<ServiceTier, number> {
  const counts: Record<ServiceTier, number> = {
    essential: 0,
    standard: 0,
    premium: 0
  };

  if (!services) return counts;

  Object.entries(services).forEach(([key, value]) => {
    if (value === true) {
      const tier = getServiceTier(key as keyof T, baseline);
      if (tier) {
        counts[tier]++;
      }
    }
  });

  return counts;
}

/**
 * Calculate service coverage percentage for a provider
 */
export function calculateServiceCoverage<T>(
  services: Partial<T> | undefined,
  baseline: ServiceBaseline<T>
): {
  essential: { provided: number; total: number; percentage: number };
  standard: { provided: number; total: number; percentage: number };
  premium: { provided: number; total: number; percentage: number };
  overall: { provided: number; total: number; percentage: number };
} {
  const counts = countServicesByTier(services, baseline);

  const totalEssential = baseline.essential.length;
  const totalStandard = baseline.standard.length;
  const totalPremium = baseline.premium.length;
  const totalAll = totalEssential + totalStandard + totalPremium;

  return {
    essential: {
      provided: counts.essential,
      total: totalEssential,
      percentage: totalEssential > 0 ? (counts.essential / totalEssential) * 100 : 0
    },
    standard: {
      provided: counts.standard,
      total: totalStandard,
      percentage: totalStandard > 0 ? (counts.standard / totalStandard) * 100 : 0
    },
    premium: {
      provided: counts.premium,
      total: totalPremium,
      percentage: totalPremium > 0 ? (counts.premium / totalPremium) * 100 : 0
    },
    overall: {
      provided: counts.essential + counts.standard + counts.premium,
      total: totalAll,
      percentage: totalAll > 0 ? ((counts.essential + counts.standard + counts.premium) / totalAll) * 100 : 0
    }
  };
}

/**
 * Get plan size category from AUM
 */
export function getPlanSizeCategory(aum: number): keyof typeof planSizeExpectations {
  if (aum < 5_000_000) return 'under5M';
  if (aum < 50_000_000) return '5M-50M';
  return 'over50M';
}

/**
 * Calculate a service value score (0-100)
 * Weights essential services more heavily than standard or premium
 */
export function calculateServiceValueScore(
  serviceOptions: ServiceOptions | undefined,
  aum: number
): {
  score: number;
  breakdown: {
    advisor: number;
    recordKeeper: number;
    tpa: number;
    audit: number;
  };
  insights: string[];
} {
  const insights: string[] = [];
  const planSize = getPlanSizeCategory(aum);
  const expectations = planSizeExpectations[planSize];

  // Calculate coverage for each provider type
  const advisorCoverage = calculateServiceCoverage(
    serviceOptions?.advisor,
    advisorServiceBaseline
  );
  const recordkeeperCoverage = calculateServiceCoverage(
    serviceOptions?.recordKeeper,
    recordkeeperServiceBaseline
  );
  const tpaCoverage = calculateServiceCoverage(
    serviceOptions?.tpa,
    tpaServiceBaseline
  );
  const auditCoverage = calculateServiceCoverage(
    serviceOptions?.audit,
    auditServiceBaseline
  );

  // Weight essential services heavily (3x), standard (2x), premium (1x)
  const calculateWeightedScore = (coverage: ReturnType<typeof calculateServiceCoverage>): number => {
    const essentialWeight = 3;
    const standardWeight = 2;
    const premiumWeight = 1;

    const essentialScore = coverage.essential.percentage * essentialWeight;
    const standardScore = coverage.standard.percentage * standardWeight;
    const premiumScore = coverage.premium.percentage * premiumWeight;

    const maxScore = (100 * essentialWeight) + (100 * standardWeight) + (100 * premiumWeight);
    return ((essentialScore + standardScore + premiumScore) / maxScore) * 100;
  };

  const advisorScore = calculateWeightedScore(advisorCoverage);
  const recordkeeperScore = calculateWeightedScore(recordkeeperCoverage);
  const tpaScore = calculateWeightedScore(tpaCoverage);
  const auditScore = calculateWeightedScore(auditCoverage);

  // Check for missing essential services
  if (advisorCoverage.essential.percentage < 100) {
    insights.push(`Missing ${advisorCoverage.essential.total - advisorCoverage.essential.provided} essential advisor service(s)`);
  }
  if (recordkeeperCoverage.essential.percentage < 100) {
    insights.push(`Missing ${recordkeeperCoverage.essential.total - recordkeeperCoverage.essential.provided} essential recordkeeper service(s)`);
  }
  if (tpaCoverage.essential.percentage < 100) {
    insights.push(`Missing ${tpaCoverage.essential.total - tpaCoverage.essential.provided} essential TPA service(s)`);
  }

  // Check plan size appropriateness
  const totalAdvisorServices = advisorCoverage.overall.provided;
  const totalRecordkeeperServices = recordkeeperCoverage.overall.provided;
  const totalTPAServices = tpaCoverage.overall.provided;

  if (totalAdvisorServices < expectations.minAdvisorServices) {
    insights.push(`Advisor services (${totalAdvisorServices}) below recommended minimum (${expectations.minAdvisorServices}) for plan size`);
  }
  if (totalRecordkeeperServices < expectations.minRecordkeeperServices) {
    insights.push(`Recordkeeper services (${totalRecordkeeperServices}) below recommended minimum (${expectations.minRecordkeeperServices}) for plan size`);
  }
  if (totalTPAServices < expectations.minTPAServices) {
    insights.push(`TPA services (${totalTPAServices}) below recommended minimum (${expectations.minTPAServices}) for plan size`);
  }

  // Overall score is weighted average (advisor and recordkeeper are most important)
  const overallScore = (
    (advisorScore * 0.35) +
    (recordkeeperScore * 0.35) +
    (tpaScore * 0.25) +
    (auditScore * 0.05)
  );

  return {
    score: Math.round(overallScore),
    breakdown: {
      advisor: Math.round(advisorScore),
      recordKeeper: Math.round(recordkeeperScore),
      tpa: Math.round(tpaScore),
      audit: Math.round(auditScore)
    },
    insights
  };
}

/**
 * Get missing essential services for a provider
 */
export function getMissingEssentialServices<T>(
  services: Partial<T> | undefined,
  baseline: ServiceBaseline<T>,
  serviceLabels: Record<keyof T, string>
): string[] {
  const missing: string[] = [];

  baseline.essential.forEach((key) => {
    if (!services || !services[key]) {
      missing.push(serviceLabels[key]);
    }
  });

  return missing;
}
