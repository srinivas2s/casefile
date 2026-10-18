import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

vi.mock('./lib/api', () => ({
  getDashboard: vi.fn().mockResolvedValue({
    total_investigations: 2,
    reproduced_bugs: 1,
    verified_fixes: 1,
    failed_verification_attempts: 0,
    recent_investigations: [],
    recent_executions: [],
  }),
  getInvestigations: vi.fn().mockResolvedValue([]),
  getExecutions: vi.fn().mockResolvedValue([]),
  getSettings: vi.fn().mockResolvedValue({
    app_version: '0.1.0',
    database_status: 'SQLite ready',
    testing_environment_status: 'pytest ready',
    github_integration: { configured: false, provider: 'GitHub REST API', mode: 'local-only' },
  }),
  createInvestigation: vi.fn(),
  getInvestigation: vi.fn(),
  generateTest: vi.fn(),
  runInvestigationTest: vi.fn(),
  recordFix: vi.fn(),
  verifyFix: vi.fn(),
  runRegression: vi.fn(),
}));

describe('CASEFILE app', () => {
  it('renders the dashboard page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Good to see you.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Investigations' })).toBeInTheDocument();
  });
});
