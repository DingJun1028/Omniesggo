import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Evidence from '../pages/Evidence.vue'
import About from '../pages/About.vue'
import Nuber from '../pages/Nuber.vue'
import Contact from '../pages/Contact.vue'
import Faq from '../pages/Faq.vue'
import Insights from '../pages/Insights.vue'
import Privacy from '../pages/Privacy.vue'
import NotFound from '../pages/NotFound.vue'
// 解法子頁
import Solutions from '../pages/Solutions.vue'
import BrandSolution from '../pages/BrandSolution.vue'
import FarmSolution from '../pages/FarmSolution.vue'
import ResearchSolution from '../pages/ResearchSolution.vue'
import Scope3Solution from '../pages/Scope3Solution.vue'
// 技術子頁
import Technology from '../pages/Technology.vue'
import TechAquaculture from '../pages/TechAquaculture.vue'
import TechProcessing from '../pages/TechProcessing.vue'
import TechSafety from '../pages/TechSafety.vue'
import TechScience from '../pages/TechScience.vue'
// 證據子頁
import EvidenceLab from '../pages/EvidenceLab.vue'
import EvidencePatents from '../pages/EvidencePatents.vue'
import EvidenceTrials from '../pages/EvidenceTrials.vue'
// 關於子頁
import AboutGovernance from '../pages/AboutGovernance.vue'
import AboutPartners from '../pages/AboutPartners.vue'
import AboutTeam from '../pages/AboutTeam.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/evidence', name: 'Evidence', component: Evidence },
  { path: '/evidence/lab', name: 'EvidenceLab', component: EvidenceLab },
  { path: '/evidence/patents', name: 'EvidencePatents', component: EvidencePatents },
  { path: '/evidence/trials', name: 'EvidenceTrials', component: EvidenceTrials },
  { path: '/about', name: 'About', component: About },
  { path: '/about/governance', name: 'AboutGovernance', component: AboutGovernance },
  { path: '/about/partners', name: 'AboutPartners', component: AboutPartners },
  { path: '/about/team', name: 'AboutTeam', component: AboutTeam },
  { path: '/nuber', name: 'Nuber', component: Nuber },
  { path: '/contact', name: 'Contact', component: Contact },
  { path: '/solutions', name: 'Solutions', component: Solutions },
  { path: '/solutions/brand', name: 'BrandSolution', component: BrandSolution },
  { path: '/solutions/farm', name: 'FarmSolution', component: FarmSolution },
  { path: '/solutions/research', name: 'ResearchSolution', component: ResearchSolution },
  { path: '/solutions/scope3', name: 'Scope3Solution', component: Scope3Solution },
  { path: '/technology', name: 'Technology', component: Technology },
  { path: '/technology/aquaculture', name: 'TechAquaculture', component: TechAquaculture },
  { path: '/technology/processing', name: 'TechProcessing', component: TechProcessing },
  { path: '/technology/safety', name: 'TechSafety', component: TechSafety },
  { path: '/technology/science', name: 'TechScience', component: TechScience },
  { path: '/faq', name: 'Faq', component: Faq },
  { path: '/insights', name: 'Insights', component: Insights },
  { path: '/privacy', name: 'Privacy', component: Privacy },
  // 舊錨點相容：/solutions#farms → /#farms（AudienceCards 卡片已加 id）
  { path: '/solutions-legacy', redirect: (to) => ({ path: '/', hash: to.hash || '#solutions' }) },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return savedPosition || { top: 0 }
  }
})

export default router
