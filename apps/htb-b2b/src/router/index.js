import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../pages/Home.vue') },
  { path: '/solutions', name: 'Solutions', component: () => import('../pages/Solutions.vue') },
  { path: '/solutions/farms', name: 'FarmSolution', component: () => import('../pages/FarmSolution.vue') },
  { path: '/solutions/food-brands', name: 'BrandSolution', component: () => import('../pages/BrandSolution.vue') },
  { path: '/solutions/scope3', name: 'Scope3Solution', component: () => import('../pages/Scope3Solution.vue') },
  { path: '/solutions/research-government', name: 'ResearchSolution', component: () => import('../pages/ResearchSolution.vue') },
  { path: '/technology', name: 'Technology', component: () => import('../pages/Technology.vue') },
  { path: '/technology/science', name: 'TechScience', component: () => import('../pages/TechScience.vue') },
  { path: '/technology/aquaculture', name: 'TechAquaculture', component: () => import('../pages/TechAquaculture.vue') },
  { path: '/technology/processing', name: 'TechProcessing', component: () => import('../pages/TechProcessing.vue') },
  { path: '/technology/safety', name: 'TechSafety', component: () => import('../pages/TechSafety.vue') },
  { path: '/nuber', name: 'Nuber', component: () => import('../pages/Nuber.vue') },
  { path: '/evidence', name: 'Evidence', component: () => import('../pages/Evidence.vue') },
  { path: '/evidence/lab', name: 'EvidenceLab', component: () => import('../pages/EvidenceLab.vue') },
  { path: '/evidence/trials', name: 'EvidenceTrials', component: () => import('../pages/EvidenceTrials.vue') },
  { path: '/evidence/patents', name: 'EvidencePatents', component: () => import('../pages/EvidencePatents.vue') },
  { path: '/about', name: 'About', component: () => import('../pages/About.vue') },
  { path: '/about/team', name: 'AboutTeam', component: () => import('../pages/AboutTeam.vue') },
  { path: '/about/partners', name: 'AboutPartners', component: () => import('../pages/AboutPartners.vue') },
  { path: '/about/governance', name: 'AboutGovernance', component: () => import('../pages/AboutGovernance.vue') },
  { path: '/insights', name: 'Insights', component: () => import('../pages/Insights.vue') },
  { path: '/faq', name: 'Faq', component: () => import('../pages/Faq.vue') },
  { path: '/contact', name: 'Contact', component: () => import('../pages/Contact.vue') },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../pages/NotFound.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})
