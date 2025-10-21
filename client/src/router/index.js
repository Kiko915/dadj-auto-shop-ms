import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Smart redirect based on auth status
        if (authStore.isAuthenticated) {
          next('/dashboard')
        } else {
          next('/auth/login')
        }
      }
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
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/auth/ResetPassword.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('@/pages/error/NotFound.vue')
    }
  ],
})

// Navigation guard to protect routes requiring authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // No token, redirect to login
      console.log('🔒 Route requires auth, redirecting to login')
      next('/auth/login')
      return
    }
    
    // Token exists, verify it's still valid by calling a protected endpoint
    try {
      // Try to fetch user profile to validate token using axios
      const response = await api.get('/protected/profile')
      
      // If we get here, token is valid, proceed
      next()
    } catch (error) {
      // Token is invalid, expired, or network error
      console.error('🔒 Auth validation error:', error.response?.data || error.message)
      authStore.logout()
      next('/auth/login')
    }
  } else if (to.path.startsWith('/auth/') && authStore.isAuthenticated) {
    // User is already authenticated and trying to access any auth page
    console.log('✅ User already authenticated, redirecting to dashboard from', to.path)
    next('/dashboard')
  } else {
    // Route doesn't require auth, proceed
    next()
  }
})

export default router
