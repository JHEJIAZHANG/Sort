'use client'

import { useState, useEffect } from 'react'
import { ApiService } from '@/services/apiService'

export default function TestAvatarPage() {
  const [avatarData, setAvatarData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const testUserId = 'test_user_123'

  const testAvatarAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 測試新的頭像 API (移除尾隨斜杠避免重定向)
      const response = await fetch(`/api/v2/avatar/${testUserId}`)
      const data = await response.json()
      
      if (response.ok) {
        setAvatarData(data)
        console.log('Avatar API 響應:', data)
      } else {
        setError(`Avatar API 錯誤: ${data.message || response.statusText}`)
      }
    } catch (err) {
      setError(`請求失敗: ${err instanceof Error ? err.message : '未知錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  const testProfileAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 測試現有的 profile API
      const response = await ApiService.getProfile(testUserId)
      
      if (response.data) {
        setProfileData(response.data)
        console.log('Profile API 響應:', response.data)
      } else {
        setError(`Profile API 錯誤: ${response.error || '未知錯誤'}`)
      }
    } catch (err) {
      setError(`請求失敗: ${err instanceof Error ? err.message : '未知錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  // 頁面載入時自動測試
  useEffect(() => {
    testAvatarAPI()
    testProfileAPI()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">頭像 API 測試頁面</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          測試用戶 ID: <code className="bg-blue-100 px-2 py-1 rounded">{testUserId}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 頭像 API 測試 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">頭像 API 測試</h2>
            <button
              onClick={testAvatarAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '測試中...' : '重新測試'}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
          
          {avatarData && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700 font-medium">✅ API 調用成功</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>用戶 ID:</strong> {avatarData.line_user_id}</p>
                <p><strong>姓名:</strong> {avatarData.name}</p>
                <p><strong>頭像 URL:</strong></p>
                {avatarData.picture_url ? (
                  <div className="space-y-2">
                    <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                      {avatarData.picture_url}
                    </code>
                    <img 
                      src={avatarData.picture_url} 
                      alt="用戶頭像"
                      className="w-16 h-16 rounded-full border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">無頭像 URL</p>
                )}
                <p><strong>從 LINE 更新:</strong> {avatarData.updated_from_line ? '是' : '否'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile API 測試 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Profile API 測試</h2>
            <button
              onClick={testProfileAPI}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '測試中...' : '重新測試'}
            </button>
          </div>
          
          {profileData && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700 font-medium">✅ API 調用成功</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>用戶 ID:</strong> {profileData.line_user_id}</p>
                <p><strong>姓名:</strong> {profileData.name}</p>
                <p><strong>角色:</strong> {profileData.role}</p>
                <p><strong>Email:</strong> {profileData.email || '未設置'}</p>
                <p><strong>頭像 URL:</strong></p>
                {profileData.picture_url ? (
                  <div className="space-y-2">
                    <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                      {profileData.picture_url}
                    </code>
                    <img 
                      src={profileData.picture_url} 
                      alt="用戶頭像"
                      className="w-16 h-16 rounded-full border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">無頭像 URL</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API 比較 */}
      {avatarData && profileData && (
        <div className="mt-6 border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">API 比較</h2>
          <div className="space-y-2">
            <p><strong>頭像 URL 是否一致:</strong> 
              <span className={avatarData.picture_url === profileData.picture_url ? 'text-green-600' : 'text-red-600'}>
                {avatarData.picture_url === profileData.picture_url ? ' ✅ 一致' : ' ❌ 不一致'}
              </span>
            </p>
            <p><strong>用戶名稱是否一致:</strong> 
              <span className={avatarData.name === profileData.name ? 'text-green-600' : 'text-red-600'}>
                {avatarData.name === profileData.name ? ' ✅ 一致' : ' ❌ 不一致'}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">測試說明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 這個頁面測試新的頭像 API (/api/v2/avatar/) 和現有的 profile API</li>
          <li>• 使用測試用戶 ID: {testUserId}</li>
          <li>• 如果用戶不存在，後端會自動創建一個測試用戶</li>
          <li>• 頭像 API 會嘗試從 LINE API 獲取最新頭像並更新數據庫</li>
        </ul>
      </div>
    </div>
  )
}