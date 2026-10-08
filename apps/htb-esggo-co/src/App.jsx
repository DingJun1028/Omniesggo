import { HashRouter, Routes, Route } from 'react-router-dom';
import HtbHome from './pages/htb-home';
import HtbAbout from './pages/htb-about';
import HtbContact from './pages/htb-contact';
import HtbNuber from './pages/htb-nuber';
import HtbSgs from './pages/htb-sgs';
import HtbTechnology from './pages/htb-technology';
import HtbCases from './pages/htb-cases';
import HtbNews from './pages/htb-news';
import HtbFaq from './pages/htb-faq';
import HtbPartnership from './pages/htb-partnership';
import HtbInvestor from './pages/htb-investor';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HtbHome />} />
        <Route path="/about" element={<HtbAbout />} />
        <Route path="/contact" element={<HtbContact />} />
        <Route path="/nuber" element={<HtbNuber />} />
        <Route path="/sgs" element={<HtbSgs />} />
        <Route path="/technology" element={<HtbTechnology />} />
        <Route path="/cases" element={<HtbCases />} />
        <Route path="/news" element={<HtbNews />} />
        <Route path="/faq" element={<HtbFaq />} />
        <Route path="/partnership" element={<HtbPartnership />} />
        <Route path="/investor" element={<HtbInvestor />} />
      </Routes>
    </HashRouter>
  );
}
