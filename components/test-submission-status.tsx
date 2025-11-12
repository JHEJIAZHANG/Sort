"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ApiService } from "@/services/apiService"

/**
 * 測試組件：用於測試作業繳交狀態 API
 * 
 * 使用方法：
 * 1. 在頁面中引入此組件
 * 2. 輸入 LINE User ID、課程 ID 和作業 ID
 * 3. 點擊「測試 API」按鈕
 * 4. 查看 Console 和頁面上的結果
 */
export function TestSubmissionStatus() {
  const [lineUserId, setLineUserId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [assignmentId, setAssignmentId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    if (!lineUserId || !courseId || !assignmentId) {
      alert("請填寫所有欄位")
      return
    }

    console.log("=== 開始測試作業繳交狀態 API ===")
    console.log("LINE User ID:", lineUserId)
    console.log("課程 ID:", courseId)
    console.log("作業 ID:", assignmentId)

    setLoading(true)
    setResult(null)

    try {
      // 設定 LINE User ID
      ApiService.setLineUserId(lineUserId)

      // 呼叫 API
      const resp = await ApiService.getAssignmentSubmissionStatus(courseId, assignmentId)
      
      console.log("=== API 回應 ===")
      console.log(JSON.stringify(resp, null, 2))

      setResult(resp)

      // 檢查資料結構
      const data = (resp as any)?.data || {}
      const results = Array.isArray(data?.results) ? data.results : []
      const first = results[0] || null

      console.log("=== 資料檢查 ===")
      console.log("results 陣列長度:", results.length)
      console.log("第一筆結果:", first)

      if (first) {
        console.log("角色:", first.role)
        console.log("統計資料:", first.statistics)
        console.log("未繳交學生數:", first.unsubmitted_students?.length || 0)
        console.log("已繳交學生數:", first.submitted_students?.length || 0)
      }

    } catch (error) {
      console.error("=== 測試失敗 ===")
      console.error(error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold">測試作業繳交狀態 API</h2>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">LINE User ID</label>
          <Input
            value={lineUserId}
            onChange={(e) => setLineUserId(e.target.value)}
            placeholder="U1234567890abcdef"
          />
        </div>

        <div>
          <label className="text-sm font-medium">課程 ID</label>
          <Input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="123456789"
          />
        </div>

        <div>
          <label className="text-sm font-medium">作業 ID</label>
          <Input
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            placeholder="987654321"
          />
        </div>

        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? "測試中..." : "測試 API"}
        </Button>
      </div>

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">結果：</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>

          {result.data?.results?.[0] && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">快速檢查：</h4>
              <div className="text-sm space-y-1">
                <div>✅ 角色: {result.data.results[0].role || "未設定"}</div>
                <div>✅ 總學生數: {result.data.results[0].statistics?.total_students || 0}</div>
                <div>✅ 已繳交: {result.data.results[0].statistics?.submitted || 0}</div>
                <div>✅ 未繳交: {result.data.results[0].statistics?.unsubmitted || 0}</div>
                <div>✅ 繳交率: {result.data.results[0].statistics?.completion_rate || 0}%</div>
                <div>✅ 未繳交學生列表長度: {result.data.results[0].unsubmitted_students?.length || 0}</div>
                <div>✅ 已繳交學生列表長度: {result.data.results[0].submitted_students?.length || 0}</div>
              </div>
            </div>
          )}

          {result.error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
              <strong>錯誤：</strong> {result.error}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
        <strong>提示：</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>請打開瀏覽器開發者工具（F12）查看 Console 日誌</li>
          <li>確認 LINE User ID 是教師帳號</li>
          <li>確認課程 ID 和作業 ID 是正確的</li>
          <li>檢查 API 回應中的 results 陣列是否有資料</li>
        </ul>
      </div>
    </Card>
  )
}
