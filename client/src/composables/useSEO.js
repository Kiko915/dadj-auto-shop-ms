import { useHead, useSeoMeta } from '@unhead/vue'
import { computed } from 'vue'

/**
 * SEO Composable for DADJ Auto Shop
 * Provides a consistent way to manage SEO meta tags across the application
 */
export function useSEO(options = {}) {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    siteName = 'DADJ Auto Shop',
    twitterCard = 'summary_large_image'
  } = options

  // Default SEO configuration for DADJ Auto Shop
  const defaultConfig = {
    siteName: 'DADJ Auto Shop',
    defaultTitle: 'DADJ Auto Shop - Professional Auto Services',
    defaultDescription: 'DADJ Auto Shop provides professional automotive services including repairs, maintenance, and parts. Your trusted partner for all your vehicle needs.',
    defaultImage: 'https://i.ibb.co/997jkKZB/symbol-w-wordmark-primary.png',
    baseUrl: 'https://dadj-auto-shop.com' // Update with your actual domain
  }

  // Compute the final title with site name
  const finalTitle = computed(() => {
    if (!title) return defaultConfig.defaultTitle
    return typeof title === 'function' ? `${title()} | ${defaultConfig.siteName}` : `${title} | ${defaultConfig.siteName}`
  })

  // Compute the final description
  const finalDescription = computed(() => {
    if (!description) return defaultConfig.defaultDescription
    return typeof description === 'function' ? description() : description
  })

  // Compute the final image
  const finalImage = computed(() => {
    if (!image) return defaultConfig.defaultImage
    return typeof image === 'function' ? image() : image
  })

  // Compute the final URL
  const finalUrl = computed(() => {
    if (!url) return defaultConfig.baseUrl
    return typeof url === 'function' ? url() : url
  })

  // Basic head configuration
  useHead({
    title: finalTitle,
    htmlAttrs: {
      lang: 'en'
    },
    link: [
      {
        rel: 'canonical',
        href: finalUrl
      }
    ]
  })

  // SEO meta tags
  useSeoMeta({
    title: finalTitle,
    description: finalDescription,
    keywords: keywords || 'auto shop, car repair, automotive services, vehicle maintenance',
    
    // Open Graph
    ogTitle: finalTitle,
    ogDescription: finalDescription,
    ogImage: finalImage,
    ogUrl: finalUrl,
    ogType: type,
    ogSiteName: siteName,
    
    // Twitter
    twitterCard,
    twitterTitle: finalTitle,
    twitterDescription: finalDescription,
    twitterImage: finalImage,
    
    // Additional meta tags
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'utf-8'
  })

  return {
    setTitle: (newTitle) => {
      if (typeof title === 'object' && 'value' in title) {
        title.value = newTitle
      }
    },
    setDescription: (newDescription) => {
      if (typeof description === 'object' && 'value' in description) {
        description.value = newDescription
      }
    }
  }
}

/**
 * Specialized SEO composable for auth pages
 */
export function useAuthSEO(pageType) {
  const authPageConfigs = {
    login: {
      title: 'Sign In',
      description: 'Sign in to your DADJ Auto Shop account to access your vehicle service history, schedule appointments, and manage your account.',
      keywords: 'login, sign in, DADJ auto shop account, customer portal'
    },
    forgotPassword: {
      title: 'Reset Password',
      description: 'Reset your DADJ Auto Shop account password. Enter your email to receive password reset instructions.',
      keywords: 'reset password, forgot password, account recovery, DADJ auto shop'
    },
    resetPassword: {
      title: 'Create New Password',
      description: 'Create a new password for your DADJ Auto Shop account. Choose a strong password to keep your account secure.',
      keywords: 'new password, password reset, account security, DADJ auto shop'
    },
    register: {
      title: 'Create Account',
      description: 'Create your DADJ Auto Shop account to schedule appointments, track service history, and access exclusive customer benefits.',
      keywords: 'create account, register, sign up, DADJ auto shop customer'
    }
  }

  const config = authPageConfigs[pageType] || authPageConfigs.login

  return useSEO({
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    type: 'website'
  })
}