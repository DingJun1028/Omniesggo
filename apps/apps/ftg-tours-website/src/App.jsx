import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import CorporateTravel from './pages/corporate-travel';
import FamilyDay from './pages/family-day';
import EsgTeamDay from './pages/esg-team-day';
import WellbeingRetreat from './pages/wellbeing-retreat';
import ExecutiveRetreat from './pages/executive-retreat';
import EsgImpactNote from './pages/esg-impact-note';
import Contact from './pages/contact';
import JourneyDesign from './pages/JourneyDesign';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import NotFound from './pages/NotFound';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col font-sans">
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
              <Route path="/contact" element={<Contact />} />
              <Route path="/journey-design" element={<JourneyDesign />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
