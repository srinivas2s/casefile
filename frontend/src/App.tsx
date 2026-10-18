import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InvestigationsPage from './pages/InvestigationsPage';
import InvestigationDetailPage from './pages/InvestigationDetailPage';
import NewInvestigationPage from './pages/NewInvestigationPage';
import ExecutionsPage from './pages/ExecutionsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/investigations/new" element={<NewInvestigationPage />} />
        <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
