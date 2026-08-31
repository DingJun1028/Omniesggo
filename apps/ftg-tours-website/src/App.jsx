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
import StreamsIndex from './pages/streams/index';
import AwarenessStream from './pages/streams/awareness';
import CohesionStream from './pages/streams/cohesion';
import RestorationStream from './pages/streams/restoration';
import MutualityStream from './pages/streams/mutuality';
import MemorialStream from './pages/streams/memorial';
import FoundationStream from './pages/streams/foundation';

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
            <Route path="/streams" element={<StreamsIndex />} />
            <Route path="/streams/awareness" element={<AwarenessStream />} />
            <Route path="/streams/cohesion" element={<CohesionStream />} />
            <Route path="/streams/restoration" element={<RestorationStream />} />
            <Route path="/streams/mutuality" element={<MutualityStream />} />
            <Route path="/streams/memorial" element={<MemorialStream />} />
            <Route path="/streams/foundation" element={<FoundationStream />} />
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
