/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './store/StoreContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { AssetDetails } from './pages/AssetDetails';
import { AssetForm } from './pages/AssetForm';
import { QRScanner } from './pages/QRScanner';
import { Employees } from './pages/Employees';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <StoreProvider>
                    <Layout />
                  </StoreProvider>
                </ProtectedRoute>
              }
            >
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
      </AuthProvider>
    </ErrorBoundary>
  );
}
