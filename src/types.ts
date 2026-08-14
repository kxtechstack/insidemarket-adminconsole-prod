/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  name: string;
  company: string;
  sector: string;
  status: 'active' | 'suspended';
  email: string;
  joinedDate: string;
  lastActive?: string;
  last_active?: string;
  apiCallsCount: number;
  promptVariables: {
    competitors: string; // comma separated list
    focusProducts: string; // comma separated list
    geographicScope: string; // e.g. "North America", "Global"
    reportingTone: 'formal' | 'actionable' | 'strategic' | 'concise';
  };
  // Image 1 - Card parameters
  primaryGeographies?: string;
  coreSectors?: string;
  knownCompetitors?: string;
  sectorsToAvoid?: string;
  dealSizeMin?: number;
  dealSizeMax?: number;
  geographyWeights?: Record<string, number>;
  sectorWeights?: Record<string, number>;
  targetAccounts?: string;
  existingRelationships?: string;
  blacklistCompanies?: string;
  keyContacts?: string;
  pipelineStatus?: string;
  sectorsToEnter?: string;
  designations?: string; // New field
  description?: string;
  location?: string;
  customDataSources?: { id: string; name: string; url: string; type: string }[];
  monitoringConfig?: {
    enabledModules: string[];
    selectedSignals: Record<string, string[]>;
    customTasks?: any[];
    selectedCustomSignals?: Record<string, string[]>;
  };
}

export interface AccessUser {
  id: string;
  authId?: string;
  firstName: string;
  lastName: string;
  designation: string;
  email: string;
  lastActive?: string;
  active: boolean;
  isNew?: boolean;
}

export type PromptCategory = 'Analysis' | 'Competitor Tracking' | 'Trend Report' | 'Sentiment Analysis';

export interface PromptTemplate {
  id: string;
  title: string;
  category: PromptCategory;
  content: string;
  status: 'active' | 'draft';
  version: string;
  updatedBy: string;
  lastUsed: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  company: string;
  promptId: string;
  promptTitle: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status: 'success' | 'error';
  promptText: string;
  completionText: string;
  errorMessage?: string;
  promptVariablesUsed: Record<string, string>;
}

export interface ModelOption {
  value: string;
  label: string;
  type: 'flash' | 'pro' | 'custom';
}

export interface SystemSettings {
  geminiModel: string;
  temperature: number;
  maxTokens: number;
  rateLimitEnabled: boolean;
  maxRequestsPerMin: number;
  defaultSystemInstruction: string;
  intelligenceTone: string;
}

export interface DashboardStats {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  sectorBreakdown: Record<string, number>;
  requestLogByDay: Array<{ day: string; count: number; errorCount: number }>;
}

export interface CustomTask {
  id: string;
  name: string;
  subTasks: any[];
}

