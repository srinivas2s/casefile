import { Link, NavLink, useLocation } from 'react-router-dom';
import { Activity, ArrowUpRight, CircleHelp, FileText, Gauge, Play, Plus, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

const navigation = [
  { to: '/', label: 'Overview', icon: Gauge },
  { to: '/investigations', label: 'Investigations', icon: FileText },
  { to: '/executions', label: 'Executions', icon: Play },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const activePage = pathname.startsWith('/investigations')
    ? pathname.endsWith('/new')
      ? 'New investigation'
      : pathname === '/investigations'
        ? 'Investigations'
        : 'Investigation details'
    : navigation.find((item) => item.to === pathname)?.label ?? 'Overview';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand-lockup" aria-label="CASEFILE home">
          <span className="brand-mark"><Activity aria-hidden="true" /></span>
          <span className="brand-copy">
            <span className="brand-name">CASEFILE</span>
            <span className="brand-caption">Evidence-first QA</span>
          </span>
        </Link>

        <div className="workspace-card">
          <span className="workspace-avatar">C</span>
          <span className="workspace-copy">
            <span className="workspace-label">WORKSPACE</span>
            <span className="workspace-name">Personal workspace</span>
          </span>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {label === 'Investigations' && pathname === '/investigations' ? (
                <ArrowUpRight className="nav-trailing-icon" aria-hidden="true" />
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="local-mode-indicator"><span /> Local workspace</div>
          <a className="sidebar-help-link" href="https://github.com/srinivas2s/casefile" target="_blank" rel="noreferrer">
            <CircleHelp aria-hidden="true" />
            <span>Help & documentation</span>
            <ArrowUpRight className="help-trailing-icon" aria-hidden="true" />
          </a>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-context">
            <span>CASEFILE</span>
            <span className="breadcrumb-divider">/</span>
            <span className="topbar-current">{activePage}</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-local-badge"><span /> Local</span>
            <Link to="/investigations/new" aria-label="New investigation" className="button-primary topbar-create">
              <Plus aria-hidden="true" />
              <span>New investigation</span>
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
