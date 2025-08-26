import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CourtFinderView from '../views/CourtFinderView.vue'
import CourtDetailsView from '../views/CourtDetailsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/courts', name: 'courts', component: CourtFinderView },
  { path: '/courts/:id', name: 'courtDetails', component: CourtDetailsView, props: true }
]

const router = createRouter({
  history: createWebHistory(),  
  routes
})

export default router