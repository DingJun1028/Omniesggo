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
import { useParams } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">載入中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ExecutiveRoute() {
  const { id } = useParams();
  return (
    <ProtectedRoute>
      <Layout>
        <Executive journeyId={id} />
      </Layout>
    </ProtectedRoute>
  );
}

function WellbeingRoute() {
  const { id } = useParams();
  return (
    <ProtectedRoute>
      <Layout>
        <Wellbeing journeyId={id} />
      </Layout>
    </ProtectedRoute>
  );
}

function FamilyDayRoute() {
  const { id } = useParams();
  return (
    <ProtectedRoute>
      <Layout>
        <FamilyDay journeyId={id} />
      </Layout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id" element={<ProtectedRoute><Layout><JourneyDetail /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id/impact-note" element={<ProtectedRoute><Layout><ImpactNotePage /></Layout></ProtectedRoute>} />
      <Route path="/family-day" element={<ProtectedRoute><Layout><FamilyDay /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id/family-day" element={<FamilyDayRoute />} />
      <Route path="/wellbeing" element={<ProtectedRoute><Layout><Wellbeing /></Layout></ProtectedRoute>} />
      <Route path="/journey/:id/wellbeing" element={<WellbeingRoute />} />
      <Route path="/journey/:id/executive" element={<ExecutiveRoute />} />
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
