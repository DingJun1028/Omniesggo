import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Evidence from '../pages/Evidence.vue'
import About from '../pages/About.vue'
import Nuber from '../pages/Nuber.vue'
import Contact from '../pages/Contact.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/evidence', name: 'Evidence', component: Evidence },
  { path: '/about', name: 'About', component: About },
  { path: '/nuber', name: 'Nuber', component: Nuber },
  { path: '/contact', name: 'Contact', component: Contact },
  { path: '/solutions', redirect: '/#solutions' }
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