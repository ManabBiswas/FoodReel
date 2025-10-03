import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error, errorInfo) {
    // Store detailed error info
    this.setState({ errorInfo })
    
    // Log error details for debugging
    console.group('🚨 ErrorBoundary caught an error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error ID:', this.state.errorId)
    console.groupEnd()

    // Here you could send error to analytics/monitoring service
    // Example: sendErrorToService(error, errorInfo, this.state.errorId)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      this.handleGoHome()
    }
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV
      
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error while loading this page. 
              Don't worry, this has been logged and we're working to fix it.
            </p>

            {/* Error ID */}
            {this.state.errorId && (
              <p className="text-sm text-gray-500 mb-6">
                Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button 
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button 
                onClick={this.handleGoBack}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>

            {/* Development Error Details */}
            {isDevelopment && this.state.error && (
              <details className="text-left text-sm bg-gray-50 border rounded-lg p-4 mt-6">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  🔧 Development Error Details
                </summary>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-red-600 mb-1">Error Message:</h4>
                    <pre className="bg-red-50 text-red-800 p-2 rounded text-xs overflow-x-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-1">Stack Trace:</h4>
                      <pre className="bg-red-50 text-red-800 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <div>
                      <h4 className="font-medium text-blue-600 mb-1">Component Stack:</h4>
                      <pre className="bg-blue-50 text-blue-800 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Production Help */}
            {!isDevelopment && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  If this problem persists, please contact our support team with the error ID above.
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
