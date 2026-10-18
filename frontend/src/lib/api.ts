import type { DashboardData, ExecutionRecord, Investigation } from '../types';

const API_BASE = 'http://localhost:8000/api';

export function evidenceReportUrl(id: number, format: 'json' | 'html'): string {
  return `${API_BASE}/investigations/${id}/evidence.${format}`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function getDashboard(): Promise<DashboardData> {
  return fetchJson<DashboardData>('/dashboard');
}

export async function getInvestigations(search?: string, status?: string): Promise<Investigation[]> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  const suffix = query.toString() ? `?${query}` : '';
  return fetchJson<Investigation[]>(`/investigations${suffix}`);
}

export async function createInvestigation(payload: Partial<Investigation>): Promise<Investigation> {
  return fetchJson<Investigation>('/investigations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getInvestigation(id: number): Promise<Investigation> {
  return fetchJson<Investigation>(`/investigations/${id}`);
}

export async function generateTest(id: number): Promise<{ success: boolean; message: string; output?: string }> {
  return fetchJson<{ success: boolean; message: string; output?: string }>(`/investigations/${id}/generate-test`, {
    method: 'POST',
  });
}

export async function runInvestigationTest(id: number): Promise<{ success: boolean; message: string; output?: string; result?: string }> {
  return fetchJson<{ success: boolean; message: string; output?: string; result?: string }>(`/investigations/${id}/run-test`, {
    method: 'POST',
  });
}

export async function recordFix(id: number, fixSummary: string): Promise<{ success: boolean; message: string; result?: string }> {
  const params = new URLSearchParams({ fix_summary: fixSummary });
  return fetchJson<{ success: boolean; message: string; result?: string }>(`/investigations/${id}/record-fix?${params.toString()}`, {
    method: 'POST',
  });
}

export async function verifyFix(id: number): Promise<{ success: boolean; message: string; output?: string; result?: string }> {
  return fetchJson<{ success: boolean; message: string; output?: string; result?: string }>(`/investigations/${id}/verify-fix`, {
    method: 'POST',
  });
}

export async function runRegression(id: number): Promise<{ success: boolean; message: string; output?: string; result?: string }> {
  return fetchJson<{ success: boolean; message: string; output?: string; result?: string }>(`/investigations/${id}/run-regression`, {
    method: 'POST',
  });
}

export async function getExecutions(): Promise<ExecutionRecord[]> {
  return fetchJson<ExecutionRecord[]>('/executions');
}

export async function getSettings(): Promise<{ app_version: string; database_status: string; testing_environment_status: string; github_integration: { configured: boolean; provider: string; mode: string } }> {
  return fetchJson<{ app_version: string; database_status: string; testing_environment_status: string; github_integration: { configured: boolean; provider: string; mode: string } }>('/settings');
}
