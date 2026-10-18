export type InvestigationStatus =
  | 'Draft'
  | 'Ready'
  | 'Reproduced'
  | 'Fix Verified'
  | 'Verification Failed';

export interface Investigation {
  id: number;
  title: string;
  bug_description: string;
  language: string;
  source_code: string;
  expected_behavior: string;
  actual_behavior: string;
  steps_to_reproduce: string;
  reproduction_input?: string | null;
  status: InvestigationStatus;
  fix_summary?: string | null;
  generated_test?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutionRecord {
  id: number;
  investigation_id: number;
  test_type: string;
  start_time: string;
  duration_ms: number;
  result: string;
  passed_tests: number;
  failed_tests: number;
  output?: string | null;
}

export interface DashboardData {
  total_investigations: number;
  reproduced_bugs: number;
  verified_fixes: number;
  failed_verification_attempts: number;
  recent_investigations: Array<{
    id: number;
    title: string;
    status: InvestigationStatus;
    language: string;
    created_at: string;
    latest_result: string;
  }>;
  recent_executions: Array<{
    id: number;
    investigation_id: number;
    test_type: string;
    result: string;
    start_time: string;
    duration_ms: number;
    passed_tests: number;
    failed_tests: number;
  }>;
}
