/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { AssetDetails } from './pages/AssetDetails';
import { AssetForm } from './pages/AssetForm';
import { QRScanner } from './pages/QRScanner';
import { Employees } from './pages/Employees';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetList />} />
              <Route path="assets/new" element={<AssetForm />} />
              <Route path="assets/:id" element={<AssetDetails />} />
              <Route path="employees" element={<Employees />} />
              <Route path="scan" element={<QRScanner />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}
