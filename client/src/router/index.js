import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/components/views/ComingSoon.vue')
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/pages/auth/Login.vue')
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password', 
      component: () => import('@/pages/auth/ForgotPassword.vue')
    }
  ],
})

export default router
