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
      path: '/track',
      name: 'vehicle-tracker',
      component: () => import('@/pages/public/VehicleTracker.vue')
    },
    {
      path: '/dashboard',
      component: () => import('@/components/views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/dashboard/Dashboard.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/pages/dashboard/Profile.vue'),
        },
        // Add more dashboard routes here as children
        {
          path: 'vehicles',
          name: 'vehicles',
          component: () => import('@/pages/dashboard/Vehicles.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/pages/dashboard/Customer.vue'),
        },
        {
          path: 'customers/add-customer',
          name: 'add-customer',
          component: () => import('@/pages/dashboard/customers/AddCustomers.vue'),
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('@/pages/dashboard/customers/[id].vue'),
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/pages/dashboard/inventory/Inventory.vue'),
        },
        {
          path: 'inventory/reports',
          name: 'inventory-reports',
          component: () => import('@/pages/dashboard/inventory/reports/index.vue'),
        },
        {
          path: 'estimates',
          name: 'estimates',
          component: () => import('@/pages/dashboard/estimates/index.vue'),
        },
        {
          path: 'estimates/new',
          name: 'new-estimate',
          component: () => import('@/pages/dashboard/estimates/new.vue'),
        },
        {
          path: 'estimates/:id',
          name: 'estimate-details',
          component: () => import('@/pages/dashboard/estimates/[id].vue'),
        },
        {
          path: 'service-orders/new',
          name: 'new-service-order',
          component: () => import('@/pages/dashboard/service-orders/new.vue'),
        },
        {
          path: 'service-orders',
          name: 'service-orders',
          component: () => import('@/pages/dashboard/service-orders/index.vue'),
        },
        {
          path: 'service-history',
          name: 'service-history',
          component: () => import('@/pages/dashboard/service-history/index.vue'),
        },
        {
          path: 'billing',
          name: 'billing',
          component: () => import('@/pages/dashboard/billing/index.vue'),
        },
        {
          path: 'billing/checkout/:orderId',
          name: 'checkout',
          component: () => import('@/pages/dashboard/billing/checkout/[id].vue'),
        },
        // Admin routes
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/pages/dashboard/admin/users.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'admin/settings',
          name: 'admin-settings',
          component: () => import('@/pages/dashboard/admin/settings.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'admin/health',
          name: 'admin-health',
          component: () => import('@/pages/dashboard/admin/health.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        }
      ]

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

      // Check if route requires admin role
      if (to.meta.requiresAdmin && authStore.currentUser?.role !== 'admin') {
        console.log('🚫 Route requires admin role, redirecting to dashboard')
        next('/dashboard')
        return
      }

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
