'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLineAuth } from '@/hooks/use-line-auth'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { UserService } from '@/services/userService'
import { ApiService } from '@/services/apiService'
import { getLiffEnvironmentInfo } from '@/lib/liff-environment'

export default function TestAuthPage() {
  const { user: lineUser, isLoggedIn: isLineLoggedIn, isLoading: lineLoading } = useLineAuth()
  const { isAuthorized: isGoogleAuthorized, isLoading: googleLoading, authorize: authorizeGoogle, checkAuthStatus } = useGoogleAuth()
  
  const [registrationStatus, setRegistrationStatus] = useState<'unknown' | 'registered' | 'not_registered'>('unknown')
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    // 獲取環境資訊
    setEnvironmentInfo(getLiffEnvironmentInfo())
    
    // 檢查註冊狀態
    const checkStatus = async () => {
      const userId = lineUser?.userId || ApiService.getLineUserId()
      if (userId) {
        try {
          const isRegistered = await UserService.getOnboardStatus(userId)
          setRegistrationStatus(isRegistered ? 'registered' : 'not_registered')
        } catch (error) {
          console.error('檢查註冊狀態失敗:', error)
        }
      }
    }
    
    checkStatus()
  }, [lineUser])

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        result,
        duration,
        timestamp: new Date().toISOString()
      }])
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString()
      }])
      throw error
    }
  }

  const testGoogleAuth = async () => {
    await runTest('Google 授權測試', async () => {
      const email = await authorizeGoogle({
        role: 'student',
        name: 'Test User'
      })
      return { email }
    })
  }

  const testRegistrationStatus = async () => {
    await runTest('註冊狀態檢查', async () => {
      const userId = lineUser?.userId || ApiService.getLineUserId()
      if (!userId) throw new Error('無用戶 ID')
      
      const isRegistered = await UserService.getOnboardStatus(userId)
      return { userId, isRegistered }
    })
  }

  const testGoogleConnection = async () => {
    await runTest('Google 連線測試', async () => {
      const response = await ApiService.getGoogleApiStatus()
      return response.data
    })
  }

  const clearTests = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">授權流程測試</h1>

        {/* 環境資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>環境資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">LIFF 環境</h4>
                <div className="space-y-1 text-sm">
                  <p>是否在 LIFF: {environmentInfo?.isLiff ? '✅ 是' : '❌ 否'}</p>
                  <p>是否行動裝置: {environmentInfo?.isMobile ? '✅ 是' : '❌ 否'}</p>
                  <p>語言: {environmentInfo?.language}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">LINE 授權</h4>
                <div className="space-y-1 text-sm">
                  <p>載入中: {lineLoading ? '⏳ 是' : '✅ 否'}</p>
                  <p>已登入: {isLineLoggedIn ? '✅ 是' : '❌ 否'}</p>
                  <p>用戶 ID: {lineUser?.userId || '未取得'}</p>
                  <p>顯示名稱: {lineUser?.displayName || '未取得'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 授權狀態 */}
        <Card>
          <CardHeader>
            <CardTitle>授權狀態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert>
                <AlertDescription>
                  <strong>LINE 授權:</strong><br />
                  {isLineLoggedIn ? '✅ 已授權' : '❌ 未授權'}
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription>
                  <strong>Google 授權:</strong><br />
                  {isGoogleAuthorized ? '✅ 已授權' : '❌ 未授權'}
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription>
                  <strong>註冊狀態:</strong><br />
                  {registrationStatus === 'registered' ? '✅ 已註冊' : 
                   registrationStatus === 'not_registered' ? '❌ 未註冊' : '⏳ 檢查中'}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* 測試按鈕 */}
        <Card>
          <CardHeader>
            <CardTitle>測試功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={testGoogleAuth}
                disabled={googleLoading}
                className="h-12"
              >
                {googleLoading ? '授權中...' : '測試 Google 授權'}
              </Button>
              <Button 
                onClick={testRegistrationStatus}
                variant="outline"
                className="h-12"
              >
                檢查註冊狀態
              </Button>
              <Button 
                onClick={testGoogleConnection}
                variant="outline"
                className="h-12"
              >
                測試 Google 連線
              </Button>
              <Button 
                onClick={clearTests}
                variant="destructive"
                className="h-12"
              >
                清除測試結果
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 測試結果 */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>測試結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((test, index) => (
                  <Alert key={index} className={test.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription>
                      <div className="flex justify-between items-start mb-2">
                        <strong>{test.name}</strong>
                        <span className="text-xs text-gray-500">
                          {test.duration}ms - {new Date(test.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {test.status === 'success' ? (
                        <div>
                          <p className="text-green-800">✅ 成功</p>
                          <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(test.result, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-red-800">❌ 失敗: {test.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用說明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用說明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>在 LINE 內開啟:</strong> 確保在 LINE 應用內開啟此頁面</p>
              <p>2. <strong>測試 Google 授權:</strong> 點擊「測試 Google 授權」會開啟外部瀏覽器</p>
              <p>3. <strong>完成授權:</strong> 在外部瀏覽器完成 Google 登入後會自動返回</p>
              <p>4. <strong>檢查狀態:</strong> 使用其他按鈕檢查各項功能狀態</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}