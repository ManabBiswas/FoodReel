import { toast } from 'react-hot-toast'

// Centralized toast helpers using react-hot-toast (React 19 compatible)
const successOpts = { duration: 3000, position: 'top-center' }
const errorOpts = { duration: 4000, position: 'top-center' }
const infoOpts = { duration: 3000, position: 'top-center' }

export const showSuccess = (message) => toast.success(message, successOpts)
export const showError = (message) => toast.error(message, errorOpts)
export const showWarning = (message) => toast(message, { ...infoOpts, icon: '⚠️' })
export const showInfo = (message) => toast(message, infoOpts)

// Toast for API errors with fallback message
export const showApiError = (error, fallbackMessage = 'An error occurred') => {
  const message = error?.response?.data?.message || error?.message || fallbackMessage
  showError(message)
}

// Toast for loading states
export const showLoading = (message = 'Loading...') => toast.loading(message, infoOpts)

// Update loading toast to success
export const updateToSuccess = (toastId, message) => toast.success(message, { ...successOpts, id: toastId })

// Update loading toast to error
export const updateToError = (toastId, message) => toast.error(message, { ...errorOpts, id: toastId })

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  apiError: showApiError,
  loading: showLoading,
  updateToSuccess,
  updateToError,
}
