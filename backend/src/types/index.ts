export interface Clause {
  id: string;
  title: string;
  originalText: string;
  plainExplanation: string;
  risk: 'low' | 'medium' | 'high';
  riskReason: string;
  suggestion?: string;
}

export interface AnalysisResult {
  summary: string;
  overallRisk: 'low' | 'medium' | 'high';
  clauses: Clause[];
  recommendations: string[];
}

export interface Document {
  id: string;
  filename: string;
  uploadedAt: string;
  overallRisk: 'low' | 'medium' | 'high';
  summary: string;
}

export interface UserUsage {
  used: number;
  limit: number;
  plan: 'free' | 'pro' | 'business';
}

export interface User {
  id: string;
  email?: string;
  plan: 'free' | 'pro' | 'business';
}

export type StreamEvent =
  | { status: 'processing'; progress: number; message?: string }
  | { status: 'complete'; result: AnalysisResult }
  | { status: 'error'; message: string };
