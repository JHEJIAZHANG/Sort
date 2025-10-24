/**
 * LIFF 環境檢測和處理工具
 * 專門處理 LINE LIFF 環境中的特殊需求
 */

import { isInLineApp, openExternalUrl } from './line-liff'

/**
 * 檢測當前是否在 LIFF 環境中
 */
export function isLiffEnvironment(): boolean {
  try {
    return isInLineApp()
  } catch {
    return false
  }
}

/**
 * 檢測是否為行動裝置
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * 在 LIFF 環境中開啟外部 URL（Google OAuth）
 * 會自動選擇最適合的開啟方式
 */
export function openGoogleAuthInLiff(authUrl: string): void {
  if (isLiffEnvironment()) {
    // 在 LIFF 環境中，使用 external: true 開啟外部瀏覽器
    openExternalUrl(authUrl)
  } else {
    // 非 LIFF 環境，整頁導向到授權連結（不使用彈出視窗）
    window.location.href = authUrl
  }
}

// 已移除 postMessage 監聽：改由成功頁與 deep link 參數處理

/**
 * 檢查 URL 參數中是否包含 Google OAuth 回調數據
 */
export function parseGoogleAuthCallback(): {
  email: string
  lineUserId: string
  hasCallback: boolean
} {
  if (typeof window === 'undefined') {
    return { email: '', lineUserId: '', hasCallback: false }
  }

  try {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || ''
    const lineUserId = params.get('line_user_id') || ''
    
    return {
      email,
      lineUserId,
      hasCallback: !!(email || lineUserId)
    }
  } catch {
    return { email: '', lineUserId: '', hasCallback: false }
  }
}

/**
 * 清理 URL 中的 OAuth 回調參數
 */
export function cleanupOAuthParams(): void {
  if (typeof window === 'undefined') return

  try {
    const url = new URL(window.location.href)
    const paramsToRemove = ['email', 'line_user_id', 'code', 'state']
    
    let hasChanges = false
    paramsToRemove.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        hasChanges = true
      }
    })

    if (hasChanges) {
      window.history.replaceState({}, '', url.toString())
    }
  } catch (error) {
    console.warn('清理 OAuth 參數失敗:', error)
  }
}

/**
 * 獲取 LIFF 環境資訊
 */
export function getLiffEnvironmentInfo() {
  return {
    isLiff: isLiffEnvironment(),
    isMobile: isMobileDevice(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
    platform: typeof window !== 'undefined' ? navigator.platform : 'N/A',
    language: typeof window !== 'undefined' ? navigator.language : 'N/A'
  }
}