import { toast } from 'react-toastify'

// Centralized toast notification helpers with React 19 compatibility
const defaultOptions = {
  transition: undefined, // Disable transitions to avoid findDOMNode error
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export const showSuccess = (message) => {
  toast.success(message, {
    ...defaultOptions,
    position: "top-left",
    autoClose: 3000,
    // position: "top-right",
    // autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    // transition: Bounce,
  })
}

export const showError = (message) => {
  toast.error(message, {
    ...defaultOptions,
    position: "top-center",
    autoClose: 4000,
  })
}

export const showWarning = (message) => {
  toast.warning(message, {
    ...defaultOptions,
    position: "top-right",
    autoClose: 3000,
  })
}

export const showInfo = (message) => {
  toast.info(message, {
    ...defaultOptions,
    position: "top-right",
    autoClose: 3000,
  })
}

// Toast for API errors with fallback message
export const showApiError = (error, fallbackMessage = 'An error occurred') => {
  const message = error?.response?.data?.message || error?.message || fallbackMessage
  showError(message)
}

// Toast for loading states
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message)
}

// Update loading toast to success
export const updateToSuccess = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: "success",
    isLoading: false,
    autoClose: 3000,
  })
}

// Update loading toast to error
export const updateToError = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: "error",
    isLoading: false,
    autoClose: 4000,
  })
}

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
