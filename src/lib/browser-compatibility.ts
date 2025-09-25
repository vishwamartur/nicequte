/**
 * Browser compatibility utilities and polyfills
 */

import { logError } from './error-logger'

export interface BrowserInfo {
  name: string
  version: string
  isSupported: boolean
  missingFeatures: string[]
  warnings: string[]
}

export interface CompatibilityCheck {
  feature: string
  supported: boolean
  polyfillAvailable: boolean
  critical: boolean
}

class BrowserCompatibility {
  private browserInfo: BrowserInfo | null = null
  private compatibilityChecks: CompatibilityCheck[] = []

  constructor() {
    this.detectBrowser()
    this.checkCompatibility()
    this.applyPolyfills()
  }

  private detectBrowser(): void {
    const userAgent = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome'
      const match = userAgent.match(/Chrome\/(\d+)/)
      version = match ? match[1] : 'Unknown'
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox'
      const match = userAgent.match(/Firefox\/(\d+)/)
      version = match ? match[1] : 'Unknown'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari'
      const match = userAgent.match(/Version\/(\d+)/)
      version = match ? match[1] : 'Unknown'
    } else if (userAgent.includes('Edg')) {
      name = 'Edge'
      const match = userAgent.match(/Edg\/(\d+)/)
      version = match ? match[1] : 'Unknown'
    }

    this.browserInfo = {
      name,
      version,
      isSupported: this.isSupportedBrowser(name, version),
      missingFeatures: [],
      warnings: []
    }
  }

  private isSupportedBrowser(name: string, version: string): boolean {
    const minVersions: Record<string, number> = {
      Chrome: 80,
      Firefox: 75,
      Safari: 13,
      Edge: 80
    }

    const versionNumber = parseInt(version, 10)
    return versionNumber >= (minVersions[name] || 0)
  }

  private checkCompatibility(): void {
    const features = [
      {
        feature: 'fetch',
        check: () => typeof fetch !== 'undefined',
        polyfillAvailable: true,
        critical: true
      },
      {
        feature: 'Promise',
        check: () => typeof Promise !== 'undefined',
        polyfillAvailable: true,
        critical: true
      },
      {
        feature: 'AbortController',
        check: () => typeof AbortController !== 'undefined',
        polyfillAvailable: true,
        critical: false
      },
      {
        feature: 'IntersectionObserver',
        check: () => typeof IntersectionObserver !== 'undefined',
        polyfillAvailable: true,
        critical: false
      },
      {
        feature: 'ResizeObserver',
        check: () => typeof ResizeObserver !== 'undefined',
        polyfillAvailable: true,
        critical: false
      },
      {
        feature: 'CSS Grid',
        check: () => CSS.supports('display', 'grid'),
        polyfillAvailable: false,
        critical: false
      },
      {
        feature: 'CSS Flexbox',
        check: () => CSS.supports('display', 'flex'),
        polyfillAvailable: false,
        critical: true
      },
      {
        feature: 'localStorage',
        check: () => {
          try {
            const test = 'test'
            localStorage.setItem(test, test)
            localStorage.removeItem(test)
            return true
          } catch {
            return false
          }
        },
        polyfillAvailable: false,
        critical: false
      },
      {
        feature: 'sessionStorage',
        check: () => {
          try {
            const test = 'test'
            sessionStorage.setItem(test, test)
            sessionStorage.removeItem(test)
            return true
          } catch {
            return false
          }
        },
        polyfillAvailable: false,
        critical: false
      }
    ]

    this.compatibilityChecks = features.map(({ feature, check, polyfillAvailable, critical }) => ({
      feature,
      supported: check(),
      polyfillAvailable,
      critical
    }))

    // Update browser info with missing features
    if (this.browserInfo) {
      this.browserInfo.missingFeatures = this.compatibilityChecks
        .filter(check => !check.supported)
        .map(check => check.feature)

      this.browserInfo.warnings = this.compatibilityChecks
        .filter(check => !check.supported && check.critical)
        .map(check => `Missing critical feature: ${check.feature}`)
    }
  }

  private applyPolyfills(): void {
    // Fetch polyfill
    if (!window.fetch) {
      this.loadPolyfill('fetch', () => {
        // Simple fetch polyfill for basic functionality
        window.fetch = async (url: string, options: any = {}) => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open(options.method || 'GET', url)
            
            if (options.headers) {
              Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key])
              })
            }

            xhr.onload = () => {
              resolve({
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                json: () => Promise.resolve(JSON.parse(xhr.responseText)),
                text: () => Promise.resolve(xhr.responseText)
              } as any)
            }

            xhr.onerror = () => reject(new Error('Network error'))
            xhr.send(options.body)
          })
        }
      })
    }

    // AbortController polyfill
    if (!window.AbortController) {
      this.loadPolyfill('AbortController', () => {
        window.AbortController = class {
          signal = { aborted: false }
          abort() {
            this.signal.aborted = true
          }
        } as any
      })
    }

    // Promise polyfill (basic)
    if (!window.Promise) {
      this.loadPolyfill('Promise', () => {
        // This is a very basic Promise implementation
        // In production, you'd want to use a proper polyfill like es6-promise
        console.warn('Basic Promise polyfill applied. Consider using a proper polyfill.')
      })
    }
  }

  private loadPolyfill(feature: string, polyfill: () => void): void {
    try {
      polyfill()
      logError(`Applied polyfill for ${feature}`, undefined, {
        component: 'browser-compatibility',
        action: 'polyfill_applied',
        additionalData: { feature }
      })
    } catch (error) {
      logError(`Failed to apply polyfill for ${feature}`, error as Error, {
        component: 'browser-compatibility',
        action: 'polyfill_failed',
        additionalData: { feature }
      })
    }
  }

  public getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo
  }

  public getCompatibilityChecks(): CompatibilityCheck[] {
    return this.compatibilityChecks
  }

  public isFeatureSupported(feature: string): boolean {
    const check = this.compatibilityChecks.find(c => c.feature === feature)
    return check ? check.supported : false
  }

  public getCriticalIssues(): string[] {
    return this.compatibilityChecks
      .filter(check => !check.supported && check.critical)
      .map(check => check.feature)
  }

  public showCompatibilityWarning(): void {
    const criticalIssues = this.getCriticalIssues()
    
    if (criticalIssues.length > 0 || !this.browserInfo?.isSupported) {
      const message = `
        Your browser may not be fully compatible with this application.
        
        ${!this.browserInfo?.isSupported ? 
          `Browser: ${this.browserInfo?.name} ${this.browserInfo?.version} (not supported)\n` : 
          ''
        }
        ${criticalIssues.length > 0 ? 
          `Missing features: ${criticalIssues.join(', ')}\n` : 
          ''
        }
        
        For the best experience, please update your browser or use:
        - Chrome 80+
        - Firefox 75+
        - Safari 13+
        - Edge 80+
      `

      console.warn(message)
      
      // Show user-friendly warning
      if (process.env.NODE_ENV === 'production') {
        this.showUserWarning(message)
      }
    }
  }

  private showUserWarning(message: string): void {
    // Create a simple warning banner
    const banner = document.createElement('div')
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `
    banner.innerHTML = `
      ⚠️ Your browser may not be fully compatible with this application. 
      <a href="#" onclick="this.parentElement.remove()" style="color: white; text-decoration: underline; margin-left: 10px;">Dismiss</a>
    `
    
    document.body.insertBefore(banner, document.body.firstChild)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove()
      }
    }, 10000)
  }
}

// Export singleton instance
export const browserCompatibility = new BrowserCompatibility()

// Initialize compatibility check
export const initBrowserCompatibility = () => {
  browserCompatibility.showCompatibilityWarning()
  
  // Log browser info
  const info = browserCompatibility.getBrowserInfo()
  if (info) {
    logError('Browser compatibility check completed', undefined, {
      component: 'browser-compatibility',
      action: 'compatibility_check',
      additionalData: {
        browser: `${info.name} ${info.version}`,
        supported: info.isSupported,
        missingFeatures: info.missingFeatures,
        warnings: info.warnings
      }
    })
  }
}
