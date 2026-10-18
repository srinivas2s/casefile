import { useEffect, useMemo, useState } from 'react';
import { getExecutions } from '../lib/api';
import type { ExecutionRecord } from '../types';

function ExecutionsPage() {
  const [items, setItems] = useState<ExecutionRecord[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [selected, setSelected] = useState<ExecutionRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getExecutions();
        setItems(result);
        if (result.length > 0) setSelected(result[0]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load execution history');
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const typeMatch = selectedType === 'all' || item.test_type === selectedType;
      const outcomeMatch = selectedOutcome === 'all' || item.result === selectedOutcome;
      return typeMatch && outcomeMatch;
    });
  }, [items, selectedType, selectedOutcome]);

  useEffect(() => {
    if (!filtered.some((item) => item.id === selected?.id)) {
      setSelected(filtered[0] ?? null);
    }
  }, [filtered, selected]);

  const types = Array.from(new Set(items.map((item) => item.test_type)));
  const outcomes = Array.from(new Set(items.map((item) => item.result)));

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">EXECUTION LOG</div>
          <h1 className="page-title">Test executions</h1>
          <p className="page-description">Review recorded run attempts and their available output.</p>
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Test type</span>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All</option>
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Result</span>
            <select
              value={selectedOutcome}
              onChange={(event) => setSelectedOutcome(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All</option>
              {outcomes.map((outcome) => (
                <option key={outcome} value={outcome}>{outcome}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="error-state" role="alert">{error}</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">Run history</h2>
              <span className="text-[11px] text-slate-500">{filtered.length} execution(s)</span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state">No executions match the selected filters.</div>
            ) : (
              <div>
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    aria-pressed={selected?.id === item.id}
                    className={`recent-row execution-row w-full text-left ${selected?.id === item.id ? 'bg-slate-800/80' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="recent-row-title">Execution #{item.id}</span>
                      <span className={`status-badge ${outcomeTone(item.result)}`}>{item.result}</span>
                    </div>
                    <div className="text-xs text-slate-400">{item.test_type} · {new Date(item.start_time).toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{item.passed_tests} passed · {item.failed_tests} failed · {item.duration_ms}ms</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Execution details</div>
                    <h2 className="mt-2 text-2xl font-semibold">#{selected.id}</h2>
                  </div>
                  <span className={`status-badge ${outcomeTone(selected.result)}`}>{selected.result}</span>
                </div>

                <div className="grid gap-3 text-sm text-slate-300">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><span className="text-slate-500">Investigation:</span> #{selected.investigation_id}</div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><span className="text-slate-500">Test type:</span> {selected.test_type}</div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><span className="text-slate-500">Start time:</span> {new Date(selected.start_time).toLocaleString()}</div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><span className="text-slate-500">Duration:</span> {selected.duration_ms}ms</div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><span className="text-slate-500">Passed:</span> {selected.passed_tests} · <span className="text-slate-500">Failed:</span> {selected.failed_tests}</div>
                </div>

                {selected.output ? (
                  <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-300">{selected.output}</pre>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">No output captured.</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Select an execution to inspect details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function outcomeTone(result: string) {
  const normalized = result.toLowerCase();
  if (normalized.includes('error') || normalized.includes('fail')) return 'error';
  if (normalized.includes('pass') || normalized.includes('success')) return 'success';
  return 'warning';
}

export default ExecutionsPage;
