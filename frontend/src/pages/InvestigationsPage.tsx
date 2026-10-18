import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ArrowUpRight } from 'lucide-react';
import { getInvestigations } from '../lib/api';
import type { Investigation } from '../types';

const statuses = ['Draft', 'Ready', 'Reproduced', 'Fix Verified', 'Verification Failed'];

function InvestigationsPage() {
  const [items, setItems] = useState<Investigation[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getInvestigations(query, status);
        setItems(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load investigations');
      }
    }

    load();
  }, [query, status]);

  const summary = useMemo(() => {
    if (items.length === 0) return 'No investigations found';
    return `${items.length} investigation${items.length === 1 ? '' : 's'}`;
  }, [items.length]);

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">WORKSPACE</div>
          <h1 className="page-title">Investigations</h1>
          <p className="page-description">Capture bugs and keep their evidence organized.</p>
        </div>
        <Link to="/investigations/new" className="button-primary shrink-0">
          <Plus className="h-4 w-4" />
          <span>New investigation</span>
        </Link>
      </div>

      <div className="surface-card p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or identifier"
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">All statuses</option>
            {statuses.map((entry) => (
              <option key={entry} value={entry}> {entry}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="error-state" role="alert">{error}</div>
      ) : (
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">All investigations</h2>
            <span className="text-[11px] text-slate-500">{summary}</span>
          </div>
          {items.length === 0 ? (
            <div className="empty-state">
              {query || status ? 'No investigations match the current filters.' : 'No investigations yet. Create one to start collecting evidence.'}
              {!query && !status ? (
                <div className="mt-4">
                  <Link to="/investigations/new" className="button-secondary">
                    <Plus className="h-4 w-4" />
                    Create investigation
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div key={item.id} className="recent-row flex-col items-start md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">#{item.id}</span>
                      <h3 className="recent-row-title">{item.title}</h3>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{item.language}</span>
                      <span className="status-badge">{item.status}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">Test preview: {item.generated_test ? 'Generated' : 'Not generated'}</div>
                    <Link to={`/investigations/${item.id}`} className="button-secondary">
                      Open <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InvestigationsPage;
