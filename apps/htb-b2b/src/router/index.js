import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Solutions from '../pages/Solutions.vue'
import Technology from '../pages/Technology.vue'
import Evidence from '../pages/Evidence.vue'
import About from '../pages/About.vue'
import Contact from '../pages/Contact.vue'
import NotFound from '../pages/NotFound.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/solutions', component: Solutions },
  { path: '/technology', component: Technology },
  { path: '/evidence', component: Evidence },
  { path: '/about', component: About },
  { path: '/contact', component: Contact },
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router