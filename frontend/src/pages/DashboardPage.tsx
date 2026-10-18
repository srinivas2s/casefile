import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  ClipboardList,
  FileCode2,
  Gauge,
  Play,
  Plus,
  TimerReset,
} from 'lucide-react';
import { getDashboard } from '../lib/api';
import type { DashboardData } from '../types';

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getDashboard();
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      }
    }

    load();
  }, []);

  if (error) {
    return <div className="error-state" role="alert">{error}</div>;
  }

  if (!data) {
    return <div className="surface-card p-5 text-sm text-slate-400" role="status">Loading dashboard…</div>;
  }

  const metrics = [
    { label: 'Investigations', value: data.total_investigations, note: 'Total tracked issues', icon: ClipboardList },
    { label: 'Bugs reproduced', value: data.reproduced_bugs, note: 'Reproductions recorded', icon: CircleAlert },
    { label: 'Fixes verified', value: data.verified_fixes, note: 'Verified investigations', icon: Check },
    { label: 'Failed verifications', value: data.failed_verification_attempts, note: 'Attempts that need review', icon: TimerReset },
  ];

  return (
    <div className="space-y-6">
      <section className="dashboard-hero">
        <div className="relative z-[1] flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="page-eyebrow">WORKSPACE OVERVIEW</div>
            <h1 className="page-title mt-2">Good to see you.</h1>
            <p className="page-description">Track bugs, capture evidence, and verify fixes in one place.</p>
          </div>
          <Link to="/investigations/new" className="button-primary shrink-0">
            <Plus aria-hidden="true" />
            Create investigation
          </Link>
        </div>
      </section>

      <section aria-label="Investigation metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="metric-card">
            <div className="metric-card-header">
              <span className="metric-card-label">{label}</span>
              <span className="metric-icon"><Icon aria-hidden="true" /></span>
            </div>
            <div className="metric-card-value">{value}</div>
            <div className="metric-card-note">{note}</div>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="section-card" aria-labelledby="recent-investigations-heading">
          <div className="section-card-header">
            <h2 id="recent-investigations-heading" className="section-card-title">
              <Gauge aria-hidden="true" />
              Recent investigations
            </h2>
            <Link className="section-card-action inline-flex items-center gap-1" to="/investigations">
              View all <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>
          {data.recent_investigations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FileCode2 aria-hidden="true" /></span>
              No investigations yet. Start by documenting a bug and its reproduction steps.
              <div className="mt-4">
                <Link to="/investigations/new" className="button-secondary">
                  <Plus aria-hidden="true" />
                  Create first investigation
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {data.recent_investigations.map((item) => (
                <Link key={item.id} to={`/investigations/${item.id}`} className="recent-row">
                  <span className="recent-row-main">
                    <span className="recent-row-icon"><FileCode2 aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="recent-row-title block">#{item.id} · {item.title}</span>
                      <span className="recent-row-meta block">{item.language} · {new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                  </span>
                  <span className="status-badge">{item.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section-card" aria-labelledby="recent-executions-heading">
          <div className="section-card-header">
            <h2 id="recent-executions-heading" className="section-card-title">
              <TimerReset aria-hidden="true" />
              Recent executions
            </h2>
            <Link className="section-card-action inline-flex items-center gap-1" to="/executions">
              View history <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>
          {data.recent_executions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><TimerReset aria-hidden="true" /></span>
              No executions recorded yet. Run history will appear here when available.
            </div>
          ) : (
            <div>
              {data.recent_executions.map((item) => (
                <Link key={item.id} to="/executions" className="recent-row">
                  <span className="recent-row-main">
                    <span className="recent-row-icon"><Play aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="recent-row-title block">Execution #{item.id} · {item.test_type}</span>
                      <span className="recent-row-meta block">
                        {new Date(item.start_time).toLocaleString()} · {item.passed_tests} passed · {item.failed_tests} failed
                      </span>
                    </span>
                  </span>
                  <span className={`status-badge ${outcomeTone(item.result)}`}>{item.result}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <Link to="/investigations" className="inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-emerald-300">
          Browse all investigations <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function outcomeTone(result: string) {
  const normalized = result.toLowerCase();
  if (normalized.includes('error') || normalized.includes('fail')) return 'error';
  if (normalized.includes('pass') || normalized.includes('success')) return 'success';
  return 'warning';
}

export default DashboardPage;
