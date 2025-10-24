import liff from '@line/liff'

// 防重變數：避免多重初始化與多次觸發登入（模組級）
let liffInitPromise: Promise<boolean> | null = null
let liffInitDone = false
let lineLoginInProgress = false

// 檢查是否為開發環境
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_IS_DEVELOPMENT === 'true'

// LINE LIFF 配置
export const LIFF_CONFIG = {
  liffId: process.env.NEXT_PUBLIC_LIFF_ID || '', // 從環境變數取得 LIFF ID
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'https://your-domain.com',
  // 開發環境配置
  isDevelopment,
  devUrl: process.env.NEXT_PUBLIC_DEV_URL || '',
  ngrokUrl: process.env.NEXT_PUBLIC_NGROK_URL || 'https://48ef4f1fe073.ngrok-free.app'
}

// LIFF 初始化（加入去重保護）
export const initializeLiff = async (): Promise<boolean> => {
  // 若已初始化完成或正在初始化，直接返回
  if (liffInitDone) return true
  if (liffInitPromise) return liffInitPromise

  // 啟動一次初始化流程並快取 Promise
  liffInitPromise = (async () => {
    try {
      if (!LIFF_CONFIG.liffId) {
        console.error('LIFF ID 未設定')
        return false
      }
      if (LIFF_CONFIG.isDevelopment) {
        const originalWarn = console.warn
        console.warn = (...args) => {
          const message = args.join(' ')
          if (message.includes('liff.init() was called with a current URL that is not related to the endpoint URL')) {
            return
          }
          originalWarn.apply(console, args)
        }
        try {
          await liff.init({ liffId: LIFF_CONFIG.liffId })
          return true
        } finally {
          console.warn = originalWarn
        }
      } else {
        await liff.init({ liffId: LIFF_CONFIG.liffId })
        return true
      }
    } catch (error) {
      console.error('LIFF 初始化失敗:', error)
      return false
    }
  })().then(res => {
    liffInitDone = !!res
    liffInitPromise = null
    return res
  })

  return liffInitPromise
}

// 檢查是否在 LINE 內瀏覽器
export const isInLineApp = (): boolean => {
  try {
    return liff.isInClient()
  } catch (error) {
    console.error('檢查 LINE 應用狀態失敗:', error)
    return false
  }
}

// 檢查用戶是否已登入
export const isLoggedIn = (): boolean => {
  try {
    return liff.isLoggedIn()
  } catch (error) {
    console.error('檢查 LINE 登入狀態失敗:', error)
    return false
  }
}

// LINE 登入（加入去重保護）
export const lineLogin = (): void => {
  if (lineLoginInProgress) return
  try {
    if (!liff.isLoggedIn()) {
      lineLoginInProgress = true
      liff.login({ redirectUri: LIFF_CONFIG.redirectUri })
      // 登入會導向，設置保險超時以避免卡住
      setTimeout(() => { lineLoginInProgress = false }, 15000)
    }
  } catch (e) {
    lineLoginInProgress = false
    console.error('LINE 登入失敗:', e)
  }
}

// LINE 登出
export const lineLogout = (): void => {
  if (liff.isLoggedIn()) {
    liff.logout()
  }
}

// 取得用戶資料
export const getUserProfile = async () => {
  try {
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile()
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      }
    }
    return null
  } catch (error) {
    console.error('取得用戶資料失敗:', error)
    return null
  }
}

// 取得存取權杖
export const getAccessToken = (): string | null => {
  try {
    if (liff.isLoggedIn()) {
      return liff.getAccessToken()
    }
    return null
  } catch (error) {
    console.error('取得存取權杖失敗:', error)
    return null
  }
}

// 取得 LIFF id_token（供後端 pre_register 使用）
export const getIdToken = (): string | null => {
  try {
    if (liff.isLoggedIn()) {
      // liff.getIDToken 於 v2 取得 ID Token
      const token = (liff as any).getIDToken ? (liff as any).getIDToken() : null
      return typeof token === 'string' ? token : null
    }
    return null
  } catch (error) {
    console.error('取得 id_token 失敗:', error)
    return null
  }
}

// 關閉 LIFF 視窗
export const closeLiffWindow = (): void => {
  if (liff.isInClient()) {
    liff.closeWindow()
  }
}

// 傳送訊息到 LINE 聊天室
export const sendMessageToLine = (message: string): void => {
  if (liff.isInClient()) {
    liff.sendMessages([
      {
        type: 'text',
        text: message
      }
    ])
  }
}

// 分享到 LINE
export const shareToLine = (url: string, text: string): void => {
  if (liff.isInClient()) {
    liff.shareTargetPicker([
      {
        type: 'text',
        text: `${text}\n${url}`
      }
    ])
  }
}

// 取得 LINE 環境資訊
export const getLineEnvironment = () => {
  try {
    return {
      isInClient: liff.isInClient(),
      isLoggedIn: liff.isLoggedIn(),
      os: liff.getOS(),
      language: liff.getLanguage(),
      version: liff.getVersion(),
      lineVersion: liff.getLineVersion(),
      isApiAvailable: (api: string) => liff.isApiAvailable(api)
    }
  } catch {
    return {
      isInClient: false,
      isLoggedIn: false,
      os: 'web',
      language: typeof navigator !== 'undefined' ? navigator.language : 'zh-TW',
      version: 'unknown',
      lineVersion: 'unknown',
      isApiAvailable: () => false
    }
  }
}

// 開發環境輔助函數
export const getDevelopmentInfo = () => {
  if (!LIFF_CONFIG.isDevelopment) return null
  
  return {
    isDevelopment: LIFF_CONFIG.isDevelopment,
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    configuredEndpoint: LIFF_CONFIG.redirectUri,
    devUrl: LIFF_CONFIG.devUrl,
    ngrokUrl: LIFF_CONFIG.ngrokUrl,
    message: '請確認 redirectUri 與 LIFF 端點一致，或使用 ngrok' 
  }
}

// 檢查 LIFF 配置是否正確
export const validateLiffConfig = () => {
  const issues: string[] = []
  
  if (!LIFF_CONFIG.liffId) {
    issues.push('LIFF ID 未設定')
  }
  
  if (!LIFF_CONFIG.redirectUri || LIFF_CONFIG.redirectUri === 'https://your-domain.com') {
    issues.push('重定向 URI 未正確設定')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    config: LIFF_CONFIG
  }
}

// 透過 LIFF 在外部瀏覽器開啟 URL（mobile 外部、PC 新分頁）
export const openExternalUrl = (url: string) => {
  try {
    if (liff.isInClient() && liff.isApiAvailable('openWindow')) {
      liff.openWindow({ url, external: true })
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } catch (e) {
    console.error('開啟外部網址失敗:', e)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// 解析 LIFF 深連結返回參數，支援 callback 攜帶 email 與 line_user_id
export const parseLiffReturn = () => {
  try {
    const url = new URL(typeof window !== 'undefined' ? window.location.href : '')
    const email = url.searchParams.get('email') || ''
    const lineUserId = url.searchParams.get('line_user_id') || ''
    const redirect = url.searchParams.get('redirect') || ''
    return { email, lineUserId, redirect }
  } catch {
    return { email: '', lineUserId: '', redirect: '' }
  }
}