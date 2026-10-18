import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Download, FileText, Play, ShieldCheck, Wrench, RefreshCcw } from 'lucide-react';
import { evidenceReportUrl, generateTest, getExecutions, getInvestigation, recordFix, runInvestigationTest, runRegression, verifyFix } from '../lib/api';
import type { ExecutionRecord, Investigation } from '../types';

const tabs = ['Overview', 'Tests', 'Executions', 'Evidence'] as const;
type Tab = (typeof tabs)[number];
type StatusTone = 'success' | 'warning' | 'error';

function InvestigationDetailPage() {
  const { id } = useParams();
  const investigationId = Number(id);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<StatusTone>('success');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [detail, allExecutions] = await Promise.all([getInvestigation(investigationId), getExecutions()]);
        setInvestigation(detail);
        setExecutions(allExecutions.filter((entry) => entry.investigation_id === investigationId));
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Unable to load investigation');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [investigationId]);

  const latestExecution = useMemo(() => executions[0] ?? null, [executions]);

  const refreshAfterAction = async () => {
    const detail = await getInvestigation(investigationId);
    const allExecutions = await getExecutions();
    setInvestigation(detail);
    setExecutions(allExecutions.filter((entry) => entry.investigation_id === investigationId));
  };

  const handleGenerateTest = async () => {
    const response = await generateTest(investigationId);
    setStatusMessage(response.message);
    setStatusTone('warning');
    await refreshAfterAction();
  };

  const handleRunTest = async () => {
    const response = await runInvestigationTest(investigationId);
    setStatusMessage(response.message);
    setStatusTone(response.success ? 'success' : 'error');
    await refreshAfterAction();
  };

  const handleRecordFix = async () => {
    const fixSummary = window.prompt('Describe the fix that was applied', investigation?.fix_summary ?? 'Applied a fix for the root cause.');
    if (fixSummary === null) return;
    const response = await recordFix(investigationId, fixSummary);
    setStatusMessage(response.message);
    setStatusTone('success');
    await refreshAfterAction();
  };

  const handleVerifyFix = async () => {
    const response = await verifyFix(investigationId);
    setStatusMessage(response.message);
    setStatusTone(response.success ? 'success' : 'error');
    await refreshAfterAction();
  };

  const handleRegression = async () => {
    const response = await runRegression(investigationId);
    setStatusMessage(response.message);
    setStatusTone(response.success ? 'success' : 'error');
    await refreshAfterAction();
  };

  const handleExportEvidence = () => {
    if (!investigation) return;
    const payload = [
      `CASEFILE evidence report`,
      `Investigation: ${investigation.title}`,
      `Status: ${investigation.status}`,
      '',
      'Bug description',
      investigation.bug_description,
      '',
      'Expected behavior',
      investigation.expected_behavior,
      '',
      'Actual behavior',
      investigation.actual_behavior,
      '',
      'Reproduction steps',
      investigation.steps_to_reproduce,
      '',
      'Fix summary',
      investigation.fix_summary ?? 'No fix recorded yet.',
      '',
      'Generated test',
      investigation.generated_test ?? 'No generated test yet.',
    ].join('\n');
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `casefile-evidence-${investigationId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Evidence report exported.');
    setStatusTone('success');
  };

  if (loading) {
    return <div className="surface-card p-5 text-sm text-slate-400" role="status">Loading investigation…</div>;
  }

  if (!investigation) {
    return <div className="error-state" role="alert">Investigation not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-heading flex-col items-start lg:flex-row lg:items-end">
        <div>
          <div className="page-eyebrow">INVESTIGATION #{investigation.id}</div>
          <h1 className="page-title">{investigation.title}</h1>
          <p className="page-description">{investigation.language} · Created {new Date(investigation.created_at).toLocaleDateString()}</p>
        </div>
        <span className="status-badge">
          {investigation.status}
        </span>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Generate test preview', action: handleGenerateTest, icon: FileText },
            { label: 'Run reproduction test', action: handleRunTest, icon: Play },
            { label: 'Record a fix', action: handleRecordFix, icon: Wrench },
            { label: 'Verify fix', action: handleVerifyFix, icon: CheckCircle2 },
            { label: 'Run regression tests', action: handleRegression, icon: RefreshCcw },
            { label: 'Export evidence report', action: handleExportEvidence, icon: Download },
          ].map(({ label, action, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-500/40 hover:text-white"
            >
              <Icon className="h-4 w-4 text-emerald-300" />
              {label}
            </button>
          ))}
        </div>
        {statusMessage ? (
          <div
            role={statusTone === 'error' ? 'alert' : 'status'}
            className={`mt-4 rounded-md border px-3 py-2 text-sm ${
              statusTone === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : statusTone === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 shadow-soft">
        <div className="flex border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm ${activeTab === tab ? 'border-b border-emerald-400 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'Overview' ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Bug description" value={investigation.bug_description} />
                <Panel title="Expected behavior" value={investigation.expected_behavior} />
              </div>
              <Panel title="Actual behavior" value={investigation.actual_behavior} />
              <Panel title="Reproduction steps" value={investigation.steps_to_reproduce} />
              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Source code" value={investigation.source_code} monospace />
                <Panel title="Latest execution" value={latestExecution ? `${latestExecution.test_type} · ${latestExecution.result}` : 'No execution recorded yet.'} />
              </div>
            </div>
          ) : null}

          {activeTab === 'Tests' ? (
            <div className="space-y-4">
              <Panel title="Generated test preview (narrative only; not run against source)" value={investigation.generated_test ?? 'No preview generated yet.'} monospace />
              <Panel title="Fix summary" value={investigation.fix_summary ?? 'No fix summary recorded yet.'} />
            </div>
          ) : null}

          {activeTab === 'Executions' ? (
            <div className="space-y-4">
              {executions.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">No executions for this investigation yet.</div>
              ) : (
                <div className="space-y-3">
                  {executions.map((entry) => (
                    <div key={entry.id} className="rounded-md border border-slate-800 bg-slate-950/50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-white">{entry.test_type}</div>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200">{entry.result}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {new Date(entry.start_time).toLocaleString()} · {entry.duration_ms}ms
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {entry.passed_tests} passed · {entry.failed_tests} failed
                      </div>
                      {entry.output ? <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-slate-300">{entry.output}</pre> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'Evidence' ? (
            <div className="space-y-4">
              <Panel title="Evidence report" value={[
                `Investigation: ${investigation.title}`,
                `Status: ${investigation.status}`,
                '',
                'Bug description',
                investigation.bug_description,
                '',
                'Expected behavior',
                investigation.expected_behavior,
                '',
                'Actual behavior',
                investigation.actual_behavior,
                '',
                'Fix summary',
                investigation.fix_summary ?? 'No fix recorded yet.',
              ].join('\n')} monospace />
              <div className="flex justify-end">
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={handleExportEvidence} className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20">
                    <ShieldCheck className="h-4 w-4" />
                    Export TXT
                  </button>
                  <a href={evidenceReportUrl(investigationId, 'json')} className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/40">
                    Export JSON
                  </a>
                  <a href={evidenceReportUrl(investigationId, 'html')} className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/40">
                    Export HTML
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, value, monospace = false }: { title: string; value: string; monospace?: boolean }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-3 text-sm font-medium text-slate-200">{title}</div>
      <div className={`${monospace ? 'font-mono text-xs text-slate-300' : 'text-sm text-slate-300'} whitespace-pre-wrap break-words`}>
        {value}
      </div>
    </div>
  );
}

export default InvestigationDetailPage;
