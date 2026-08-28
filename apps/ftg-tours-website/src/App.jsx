import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CorporateTravel from './pages/corporate-travel';
import FamilyDay from './pages/family-day';
import EsgTeamDay from './pages/esg-team-day';
import WellbeingRetreat from './pages/wellbeing-retreat';
import ExecutiveRetreat from './pages/executive-retreat';
import EsgImpactNote from './pages/esg-impact-note';
import PrivacyPolicy from './pages/privacy-policy';
import TermsOfService from './pages/terms-of-service';
import JourneyApp from './pages/JourneyApp';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/corporate-travel" element={<CorporateTravel />} />
            <Route path="/family-day" element={<FamilyDay />} />
            <Route path="/esg-team-day" element={<EsgTeamDay />} />
            <Route path="/wellbeing-retreat" element={<WellbeingRetreat />} />
            <Route path="/executive-retreat" element={<ExecutiveRetreat />} />
            <Route path="/esg-impact-note" element={<EsgImpactNote />} />
            <Route path="/journey-app" element={<JourneyApp />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
