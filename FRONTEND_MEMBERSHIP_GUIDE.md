# 前端會員功能實現指南

## 📋 總結

### 已限制的 AI 功能

後端已在以下 **3 個 AI 功能**加入會員限制：

1. **作業推薦** - `GET /api/v2/assignments/<id>/recommendations/`
2. **考試推薦** - `GET /api/v2/exams/<id>/recommendations/`  
3. **OCR 課表** - `POST /api/v2/courses/import-timetable-image`

每次調用這些功能都會：
- 檢查用戶配額是否足夠
- 如果足夠，扣除 1 次使用次數
- 如果不足，返回 403 錯誤（`QUOTA_EXCEEDED`）

---

## 🎯 前端需要實現的功能

### 1. 會員狀態管理

創建一個 Context 或 Hook 來管理會員狀態：

```typescript
// contexts/MembershipContext.tsx
interface MembershipStatus {
  tier: 'free' | 'basic' | 'pro'
  tierDisplay: string
  aiUsage: {
    used: number
    limit: number | null
    remaining: number | null
    isUnlimited: boolean
    yearMonth: string
  }
  subscription: {
    hasActive: boolean
    planName: string | null
    endAt: string | null
  } | null
}

// 獲取會員狀態
const fetchMembershipStatus = async (lineUserId: string) => {
  const response = await fetch(`/api/v2/me/membership`, {
    headers: {
      'X-LINE-UserId': lineUserId
    }
  })
  return await response.json()
}
```

### 2. 顯示配額組件

在頁面頂部或側邊欄顯示剩餘使用次數：

```tsx
// components/ai-usage-badge.tsx
export function AIUsageBadge() {
  const { membershipStatus } = useMembership()
  
  if (!membershipStatus) return null
  
  const { aiUsage } = membershipStatus
  
  if (aiUsage.isUnlimited) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
        <span>🤖 Pro 會員</span>
        <span className="text-sm">無限使用</span>
      </div>
    )
  }
  
  const percentage = (aiUsage.used / aiUsage.limit!) * 100
  const isLow = percentage > 80
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isLow ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
    }`}>
      <span>🤖 AI 配額</span>
      <span className="font-medium">
        {aiUsage.remaining} / {aiUsage.limit} 次
      </span>
      {isLow && <span className="text-xs">(即將用完)</span>}
    </div>
  )
}
```

### 3. 處理配額用完

在 `learning-resources.tsx` 中處理 403 錯誤：

```typescript
// 在 fetchRecommendations 函數中
try {
  // ... 現有代碼 ...
  
  if (assignment?.id) {
    resp = await ApiService.getAssignmentRecommendations(assignment.id, params)
  }
  
  // 檢查是否有配額錯誤
  if (resp.error) {
    // 新增：檢查是否為配額用完
    if (resp.status === 403) {
      const errorData = resp.data
      if (errorData?.code === 'QUOTA_EXCEEDED') {
        setError(`AI 使用次數已達上限（${errorData.details.used}/${errorData.details.limit}），請升級至 Pro 方案以繼續使用`)
        setShowUpgradePrompt(true)  // 顯示升級提示
        return
      }
    }
    throw new Error(resp.error)
  }
} catch (e) {
  // ... 錯誤處理 ...
}
```

### 4. 升級提示彈窗

創建一個升級提示組件：

```tsx
// components/upgrade-prompt.tsx
interface UpgradePromptProps {
  open: boolean
  onClose: () => void
  quotaDetails?: {
    tier: string
    used: number
    limit: number
  }
}

export function UpgradePrompt({ open, onClose, quotaDetails }: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⚠️ AI 使用次數已達上限</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            您的 {quotaDetails?.tier} 方案本月配額已用完
            （{quotaDetails?.used}/{quotaDetails?.limit} 次）
          </p>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">升級至 Pro 方案</h3>
            <ul className="text-sm space-y-1">
              <li>✅ 無限次 AI 推薦</li>
              <li>✅ 無限次 OCR 課表辨識</li>
              <li>✅ 優先客服支援</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/pricing'} className="flex-1">
              立即升級
            </Button>
            <Button variant="outline" onClick={onClose}>
              稍後再說
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 5. 在功能按鈕旁顯示剩餘次數

在作業推薦按鈕旁顯示：

```tsx
// 在作業詳情頁面
<Button onClick={handleGetRecommendations}>
  🤖 推薦學習資源
  {!membershipStatus?.aiUsage.isUnlimited && (
    <span className="ml-2 text-xs opacity-75">
      (剩餘 {membershipStatus?.aiUsage.remaining} 次)
    </span>
  )}
</Button>
```

---

## 📝 需要修改的文件

1. **創建 Context** - `contexts/MembershipContext.tsx` (新建)
2. **配額徽章組件** - `components/ai-usage-badge.tsx` (新建)
3. **升級提示組件** - `components/upgrade-prompt.tsx` (新建)
4. **更新學習資源組件** - `components/learning-resources.tsx` (修改)
5. **更新 OCR 組件** - `components/ocr-scan-button.tsx` (修改)
6. **更新 ApiService** - `services/apiService.ts` (修改，處理 403 錯誤)

---

## 🔄 完整流程

1. 用戶登入 → 調用 `/api/v2/me/membership` 獲取會員狀態
2. 在頁面顯示剩餘次數徽章
3. 用戶點擊「推薦學習資源」
4. 如果配額足夠 → 正常顯示推薦結果，剩餘次數 -1
5. 如果配額用完 → 顯示升級提示彈窗
6. 用戶點擊「立即升級」→ 導向 `/pricing` 頁面

---

需要我幫你實現這些組件嗎？
