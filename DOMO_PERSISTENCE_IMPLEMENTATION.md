# Domo Report Persistence - Implementation Guide

This document outlines how to implement full report persistence so that saved analyses appear when users return to the platform.

---

## Architecture Overview

### Data Flow
```
User Creates Analysis → Saves to Domo → Appears in "My Reports" → Can Load/View/Edit Later
```

### Required Components
1. **Save API** - Writes analysis to Domo (already designed)
2. **List API** - Retrieves saved analyses for a user/client
3. **Load API** - Fetches specific analysis by ID
4. **UI Components** - Dashboard to browse and load saved reports
5. **URL State** - Deep linking to specific reports

---

## Updated Domo Schema

### Additional Columns for Session Management

Add these to the denormalized schema in `DOMO_SCHEMA_V2.md`:

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `CreatedBy_Email` | STRING | Email of user who created (for filtering) | "john.smith@onedigital.com" |
| `CreatedBy_Name` | STRING | Name of user who created | "John Smith" |
| `CreatedBy_SalesforceUserID` | STRING | Salesforce User ID (if available) | "005xxxxxxxxxxxxxxx" |
| `LastModifiedDate` | DATETIME | When analysis was last updated | "2024-12-08 15:30:00" |
| `IsArchived` | BOOLEAN | Soft delete flag | FALSE |
| `ReportName` | STRING | User-provided name for this report | "Q4 2024 Fee Review" |
| `ReportNotes` | TEXT | User notes about this analysis | "Prepared for annual board meeting" |

**Why These Matter**:
- `CreatedBy_Email` - Filter reports by logged-in user
- `ReportName` - Display in "My Reports" list
- `LastModifiedDate` - Sort by recency
- `IsArchived` - Soft delete without losing data

---

## API Implementation

### 1. List Saved Analyses

**File**: `app/api/domo/list-analyses/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDomoAccessToken } from '@/lib/domoDatasetApi';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const userEmail = searchParams.get('userEmail');
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail parameter required' },
        { status: 400 }
      );
    }

    // Get Domo access token
    const token = await getDomoAccessToken();

    // Query Domo dataset with filters
    const response = await axios.get(
      `${process.env.DOMO_API_HOST}/v1/datasets/${process.env.DOMO_RESULTS_DATASET_ID}/data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit,
          orderBy: 'LastModifiedDate DESC',
        },
      }
    );

    // Filter results (Domo API has limited query capabilities)
    let analyses = response.data;

    // Client-side filtering
    analyses = analyses.filter((row: any) => {
      if (row.IsArchived) return false;
      if (row.CreatedBy_Email !== userEmail) return false;
      if (clientId && row.ClientID !== clientId) return false;
      return true;
    });

    // Transform to summary format
    const summaries = analyses.map((row: any) => ({
      resultId: row.ResultID,
      reportName: row.ReportName || 'Untitled Report',
      clientName: row.ClientName,
      clientId: row.ClientID,
      analysisDate: row.AnalysisDate,
      lastModifiedDate: row.LastModifiedDate,
      aum: row.AssetsUnderManagement,
      participants: row.ParticipantCount,
      hasProposed: row.HasProposedPlan,
      totalSavings: row.TotalSavingsDollars,
      existingServiceScore: row.Existing_ServiceScore_Overall,
      proposedServiceScore: row.Proposed_ServiceScore_Overall,
    }));

    return NextResponse.json({
      success: true,
      count: summaries.length,
      analyses: summaries,
    });
  } catch (error) {
    console.error('Error listing analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved analyses' },
      { status: 500 }
    );
  }
}
```

### 2. Load Specific Analysis

**File**: `app/api/domo/load-analysis/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDomoAccessToken } from '@/lib/domoDatasetApi';
import axios from 'axios';
import type { PlanData, ComparisonData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resultId = searchParams.get('resultId');

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId parameter required' },
        { status: 400 }
      );
    }

    // Get Domo access token
    const token = await getDomoAccessToken();

    // Fetch full dataset and filter for this result
    const response = await axios.get(
      `${process.env.DOMO_API_HOST}/v1/datasets/${process.env.DOMO_RESULTS_DATASET_ID}/data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Find the specific analysis
    const analysis = response.data.find((row: any) => row.ResultID === resultId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Transform Domo row back to application format
    const comparisonData = transformFromDomoSchema(analysis);

    return NextResponse.json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    console.error('Error loading analysis:', error);
    return NextResponse.json(
      { error: 'Failed to load analysis' },
      { status: 500 }
    );
  }
}

/**
 * Transform Domo row back to ComparisonData format
 */
function transformFromDomoSchema(row: any): ComparisonData {
  const existing: PlanData = {
    assetsUnderManagement: row.AssetsUnderManagement,
    participantCount: row.ParticipantCount,
    benchmarkCategory: row.AUMBenchmarkCategory,
    balanceBenchmarkCategory: row.BalanceBenchmarkCategory,
    feeType: row.FeeType,
    fees: {
      advisor: {
        type: row.Existing_Advisor_FeeType,
        basisPoints: row.Existing_Advisor_BasisPoints || undefined,
        flatFee: row.Existing_Advisor_FlatFee || undefined,
        perParticipantFee: row.Existing_Advisor_PerParticipantFee || undefined,
      },
      recordKeeper: {
        type: row.Existing_RecordKeeper_FeeType,
        basisPoints: row.Existing_RecordKeeper_BasisPoints || undefined,
        flatFee: row.Existing_RecordKeeper_FlatFee || undefined,
        perParticipantFee: row.Existing_RecordKeeper_PerParticipantFee || undefined,
      },
      tpa: {
        type: row.Existing_TPA_FeeType,
        basisPoints: row.Existing_TPA_BasisPoints || undefined,
        flatFee: row.Existing_TPA_FlatFee || undefined,
        perParticipantFee: row.Existing_TPA_PerParticipantFee || undefined,
      },
      audit: {
        type: row.Existing_Audit_FeeType || 'flatFee',
        basisPoints: row.Existing_Audit_BasisPoints || undefined,
        flatFee: row.Existing_Audit_FlatFee || undefined,
        perParticipantFee: row.Existing_Audit_PerParticipantFee || undefined,
      },
      investmentMenu: {
        type: row.Existing_InvestmentMenu_FeeType,
        basisPoints: row.Existing_InvestmentMenu_BasisPoints || undefined,
        flatFee: row.Existing_InvestmentMenu_FlatFee || undefined,
        perParticipantFee: row.Existing_InvestmentMenu_PerParticipantFee || undefined,
      },
    },
    services: {
      advisor: {
        investmentMenuSelection: row.Existing_Svc_Advisor_InvestmentMenuSelection || false,
        fiduciarySupport321: row.Existing_Svc_Advisor_FiduciarySupport321 || false,
        complianceAssistance: row.Existing_Svc_Advisor_ComplianceAssistance || false,
        planDesignConsulting: row.Existing_Svc_Advisor_PlanDesignConsulting || false,
        participantEducation: row.Existing_Svc_Advisor_ParticipantEducation || false,
        quarterlyReviews: row.Existing_Svc_Advisor_QuarterlyReviews || false,
        fiduciarySupport338: row.Existing_Svc_Advisor_FiduciarySupport338 || false,
        customReporting: row.Existing_Svc_Advisor_CustomReporting || false,
      },
      recordKeeper: {
        participantWebsite: row.Existing_Svc_RK_ParticipantWebsite || false,
        callCenterSupport: row.Existing_Svc_RK_CallCenterSupport || false,
        onlineEnrollment: row.Existing_Svc_RK_OnlineEnrollment || false,
        mobileApp: row.Existing_Svc_RK_MobileApp || false,
        loanAdministration: row.Existing_Svc_RK_LoanAdministration || false,
        dailyValuation: row.Existing_Svc_RK_DailyValuation || false,
        participantStatements: row.Existing_Svc_RK_ParticipantStatements || false,
        payrollIntegration: row.Existing_Svc_RK_PayrollIntegration || false,
        autoEnrollment: row.Existing_Svc_RK_AutoEnrollment || false,
        distributionProcessing: row.Existing_Svc_RK_DistributionProcessing || false,
      },
      tpa: {
        form5500Preparation: row.Existing_Svc_TPA_Form5500Preparation || false,
        discriminationTesting: row.Existing_Svc_TPA_DiscriminationTesting || false,
        complianceTesting: row.Existing_Svc_TPA_ComplianceTesting || false,
        planDocumentUpdates: row.Existing_Svc_TPA_PlanDocumentUpdates || false,
        governmentFilings: row.Existing_Svc_TPA_GovernmentFilings || false,
        participantNotices: row.Existing_Svc_TPA_ParticipantNotices || false,
        amendmentServices: row.Existing_Svc_TPA_AmendmentServices || false,
        noticePrparation: row.Existing_Svc_TPA_NoticePreparation || false,
      },
      audit: {
        annualAudit: row.Existing_Svc_Audit_AnnualAudit || false,
        fullScopeAudit: row.Existing_Svc_Audit_FullScopeAudit || false,
        limitedScopeAudit: row.Existing_Svc_Audit_LimitedScopeAudit || false,
        biannualAudit: row.Existing_Svc_Audit_BiannualAudit || false,
        triannualAudit: row.Existing_Svc_Audit_TriannualAudit || false,
      },
    },
  };

  // Build proposed plan if it exists
  const proposed = row.HasProposedPlan ? {
    assetsUnderManagement: row.AssetsUnderManagement,
    participantCount: row.ParticipantCount,
    benchmarkCategory: row.AUMBenchmarkCategory,
    balanceBenchmarkCategory: row.BalanceBenchmarkCategory,
    feeType: row.FeeType,
    fees: {
      advisor: {
        type: row.Proposed_Advisor_FeeType,
        basisPoints: row.Proposed_Advisor_BasisPoints || undefined,
        flatFee: row.Proposed_Advisor_FlatFee || undefined,
        perParticipantFee: row.Proposed_Advisor_PerParticipantFee || undefined,
      },
      // ... (repeat for all fee types)
    },
    services: {
      advisor: {
        investmentMenuSelection: row.Proposed_Svc_Advisor_InvestmentMenuSelection || false,
        // ... (repeat for all services)
      },
      // ... (repeat for all provider types)
    },
  } as PlanData : undefined;

  return {
    existing,
    proposed,
    metadata: {
      resultId: row.ResultID,
      reportName: row.ReportName,
      reportNotes: row.ReportNotes,
      clientId: row.ClientID,
      clientName: row.ClientName,
      createdBy: row.CreatedBy_Name,
      analysisDate: row.AnalysisDate,
      aiSummary: row.AI_ExecutiveSummary,
    },
  };
}
```

### 3. Update Save API

Add these fields when saving (update the `transformToDomoSchema` function):

```typescript
// In app/api/domo/save-analysis/route.ts
function transformToDomoSchema(data: any) {
  return {
    // ... existing fields ...

    // NEW: Session persistence fields
    ReportName: data.reportName || `${data.clientName} - ${new Date().toLocaleDateString()}`,
    ReportNotes: data.reportNotes || null,
    CreatedBy_Email: data.userEmail || 'unknown@onedigital.com',
    CreatedBy_Name: data.userName || 'Unknown User',
    CreatedBy_SalesforceUserID: data.salesforceUserId || null,
    LastModifiedDate: new Date().toISOString(),
    IsArchived: false,

    // ... rest of existing fields ...
  };
}
```

---

## UI Components

### 1. Saved Reports Dashboard

**File**: `components/SavedReportsDashboard.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, Users, TrendingDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SavedAnalysis {
  resultId: string;
  reportName: string;
  clientName: string;
  clientId: string;
  analysisDate: string;
  lastModifiedDate: string;
  aum: number;
  participants: number;
  hasProposed: boolean;
  totalSavings: number | null;
  existingServiceScore: number;
  proposedServiceScore: number | null;
}

interface SavedReportsDashboardProps {
  userEmail: string;
  onLoadReport: (resultId: string) => void;
}

export default function SavedReportsDashboard({
  userEmail,
  onLoadReport,
}: SavedReportsDashboardProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedAnalyses();
  }, [userEmail]);

  const fetchSavedAnalyses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/domo/list-analyses?userEmail=${encodeURIComponent(userEmail)}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch saved analyses');
      }

      const data = await response.json();
      setAnalyses(data.analyses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading saved reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchSavedAnalyses} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved reports yet. Create your first benchmarking analysis to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Saved Reports</h2>
        <span className="text-sm text-muted-foreground">{analyses.length} report{analyses.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analyses.map((analysis) => (
          <Card key={analysis.resultId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{analysis.reportName}</CardTitle>
              <CardDescription>{analysis.clientName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">AUM:</span>
                  <span className="font-semibold">{formatCurrency(analysis.aum, 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Participants:</span>
                  <span className="font-semibold">{analysis.participants.toLocaleString()}</span>
                </div>
              </div>

              {analysis.hasProposed && analysis.totalSavings !== null && (
                <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-semibold">
                    Savings: {formatCurrency(analysis.totalSavings, 0)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Last modified: {new Date(analysis.lastModifiedDate).toLocaleDateString()}</span>
              </div>

              <Button
                onClick={() => onLoadReport(analysis.resultId)}
                className="w-full"
                variant="outline"
              >
                View Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2. Update Main Page with Dashboard

**File**: `app/page.tsx` (modifications)

```typescript
'use client';

import { useState, useEffect } from 'react';
import SavedReportsDashboard from '@/components/SavedReportsDashboard';
import FeeInputForm from '@/components/FeeInputForm';
import BenchmarkResults from '@/components/BenchmarkResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'saved'
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Get user email from Salesforce context or auth
    // For now, using placeholder
    setUserEmail('john.smith@onedigital.com');
  }, []);

  const handleLoadReport = async (resultId: string) => {
    try {
      const response = await fetch(`/api/domo/load-analysis?resultId=${resultId}`);
      const result = await response.json();

      if (result.success) {
        setComparisonData(result.data);
        setActiveTab('new'); // Switch to analysis view
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load report');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">New Analysis</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <FeeInputForm onSubmit={setComparisonData} initialData={comparisonData} />
          {comparisonData && <BenchmarkResults data={comparisonData} />}
        </TabsContent>

        <TabsContent value="saved">
          <SavedReportsDashboard
            userEmail={userEmail}
            onLoadReport={handleLoadReport}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
```

### 3. Save Report Dialog

**File**: `components/SaveReportDialog.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Loader2 } from 'lucide-react';
import type { ComparisonData } from '@/lib/types';

interface SaveReportDialogProps {
  comparisonData: ComparisonData;
  userEmail: string;
  userName: string;
  onSaved: (resultId: string) => void;
}

export default function SaveReportDialog({
  comparisonData,
  userEmail,
  userName,
  onSaved,
}: SaveReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportName, setReportName] = useState(`${comparisonData.existing.clientName || 'Client'} - ${new Date().toLocaleDateString()}`);
  const [reportNotes, setReportNotes] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...comparisonData,
        reportName,
        reportNotes,
        userEmail,
        userName,
      };

      const response = await fetch('/api/domo/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSaved(result.resultId);
        setOpen(false);
      } else {
        alert('Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Save className="h-4 w-4" />
          Save Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Benchmarking Report</DialogTitle>
          <DialogDescription>
            Save this analysis to view or edit later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Q4 2024 Fee Review"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportNotes">Notes (Optional)</Label>
            <Textarea
              id="reportNotes"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Add notes about this analysis..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !reportName.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## URL Deep Linking

Support direct links to specific reports:

**Example**: `https://yourapp.com/?reportId=RES-2024-001234`

**Implementation** in `app/page.tsx`:

```typescript
useEffect(() => {
  // Check URL for reportId parameter
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get('reportId');

  if (reportId) {
    handleLoadReport(reportId);
  }
}, []);
```

---

## User Authentication Context

Since this will be embedded in Salesforce, get user context from parent:

**File**: `lib/salesforceAuth.ts`

```typescript
/**
 * Extract user context from Salesforce Experience Cloud
 */
export function getSalesforceUserContext() {
  // In iframe, get user info from parent window or query params
  const params = new URLSearchParams(window.location.search);

  return {
    email: params.get('userEmail') || 'unknown@onedigital.com',
    name: params.get('userName') || 'Unknown User',
    salesforceUserId: params.get('sfUserId') || null,
  };
}
```

---

## Updated Types

Add metadata to `ComparisonData`:

**File**: `lib/types.ts`

```typescript
export interface ComparisonData {
  existing: PlanData;
  proposed?: PlanData;
  metadata?: {
    resultId?: string;
    reportName?: string;
    reportNotes?: string;
    clientId?: string;
    clientName?: string;
    createdBy?: string;
    analysisDate?: string;
    aiSummary?: string;
  };
}
```

---

## Summary: What Makes Persistence Work

### ✅ **Yes** - The Updated Implementation Supports:

1. **Save Analysis** → Stores in Domo with user/client metadata
2. **List Analyses** → Retrieves all saved reports for logged-in user
3. **Load Analysis** → Reconstructs full form state from saved data
4. **Edit & Re-save** → Can modify and update existing reports
5. **Deep Linking** → Share direct links to specific reports
6. **Session Continuity** → Returns to "My Reports" when user logs back in

### 🔑 Key Changes from Original:

1. **Added metadata columns** - `ReportName`, `CreatedBy_Email`, `LastModifiedDate`
2. **Bidirectional transformation** - Save to Domo AND load from Domo
3. **List API** - Fetch multiple saved analyses with filtering
4. **Dashboard UI** - Browse and load saved reports
5. **URL state** - Support deep linking to specific reports

### Implementation Checklist:

- [ ] Update Domo dataset schema with new metadata columns
- [ ] Implement `/api/domo/list-analyses` endpoint
- [ ] Implement `/api/domo/load-analysis` endpoint
- [ ] Update `/api/domo/save-analysis` to include metadata
- [ ] Create `SavedReportsDashboard` component
- [ ] Create `SaveReportDialog` component
- [ ] Add tabs to main page (New vs. Saved)
- [ ] Implement URL deep linking
- [ ] Get user context from Salesforce
- [ ] Test full save/load cycle

---

*Last Updated: 2024-12-08*
*Version: 2.0*
