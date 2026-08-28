import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { JourneyDetail } from './pages/JourneyDetail';
import { ImpactNotePage } from './pages/ImpactNotePage';
import { LoginPage } from './pages/LoginPage';
import { FamilyDayFeature as FamilyDay } from './features/FamilyDay';
import { WellbeingFeature as Wellbeing } from './features/Wellbeing';
import { ExecutiveTools as Executive } from './features/Executive';
import { Layout } from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">載入中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id" element={<ProtectedRoute><Layout><JourneyDetail /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id/impact-note" element={<ProtectedRoute><Layout><ImpactNotePage /></Layout></ProtectedRoute>} />
      <Route path="/family-day" element={<ProtectedRoute><Layout><FamilyDay /></Layout></ProtectedRoute>} />
      <Route path="/wellbeing" element={<ProtectedRoute><Layout><Wellbeing /></Layout></ProtectedRoute>} />
      <Route path="/executive" element={<ProtectedRoute><Layout><Executive /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
