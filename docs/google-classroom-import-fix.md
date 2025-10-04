# Google Classroom 課程匯入修正

## 問題描述

用戶在「我的」頁面點擊「立即同步所有 Google 服務」按鈕後：
1. 系統同步 Google Classroom 課程
2. 自動彈出課程選擇界面
3. **問題**：界面顯示「沒有找到未匯入的課程」
4. 用戶點擊「稍後再說」後，課程才會出現在系統中（但沒有設定時間表）

## 根本原因

在 `google-sync-all.tsx` 和 `google-classroom-onboarding.tsx` 中存在重複同步的問題：

1. **第一次同步**：`google-sync-all.tsx` 的 `handleSync()` 調用 `ApiService.manualSyncAll()`
2. **立即打開對話框**：同步完成後立即設置 `setShowOnboarding(true)`
3. **第二次同步**：`google-classroom-onboarding.tsx` 的 `loadGoogleClassroomCourses()` 又調用 `ApiService.syncGoogleClassroom()`
4. **時序問題**：第一次同步的數據可能還沒完全寫入資料庫，第二次同步又開始了

結果：
- 用戶看到的界面是在第一次同步後、第二次同步前的狀態（課程還沒載入）
- 當用戶點擊「稍後再說」時，第二次同步才完成，課程才出現

## 修正方案

### 1. 在 `google-sync-all.tsx` 中添加延遲

```typescript
// 等待一下讓資料完全寫入資料庫
await new Promise(resolve => setTimeout(resolve, 1000))

// 同步完成後，顯示課程選擇界面
setShowOnboarding(true)
```

這確保了資料庫寫入操作有足夠的時間完成。

### 2. 移除 `google-classroom-onboarding.tsx` 中的重複同步

修改前：
```typescript
const loadGoogleClassroomCourses = async () => {
  setStep('loading')
  setError(null)
  
  try {
    // 調用同步 API（重複同步！）
    const response = await ApiService.syncGoogleClassroom()
    
    if (response.error) {
      throw new Error(response.error)
    }

    // 獲取課程列表
    const coursesResponse = await ApiService.getCourses(ApiService.getLineUserId())
    // ...
  }
}
```

修改後：
```typescript
const loadGoogleClassroomCourses = async () => {
  setStep('loading')
  setError(null)
  
  try {
    // 直接獲取課程列表，不再重複同步
    const coursesResponse = await ApiService.getCourses(ApiService.getLineUserId())
    // ...
  }
}
```

## 修正後的流程

1. 用戶點擊「立即同步所有 Google 服務」
2. `google-sync-all.tsx` 調用 `ApiService.manualSyncAll()`
3. 同步完成後等待 1 秒，確保資料寫入資料庫
4. 打開課程選擇對話框
5. `google-classroom-onboarding.tsx` 直接從資料庫讀取課程（不再重複同步）
6. 顯示未設定時間表的課程供用戶選擇
7. 用戶選擇課程並設定時間表
8. 系統更新課程的時間表資訊

## 測試步驟

1. 確保已連接 Google Classroom
2. 在「我的」頁面點擊「立即同步所有 Google 服務」
3. 等待同步完成
4. 驗證課程選擇界面是否正確顯示未匯入的課程
5. 選擇課程並設定時間表
6. 確認課程已正確匯入並顯示在課程列表中

## 相關文件

- `components/google-sync-all.tsx` - 統一同步組件
- `components/google-classroom-onboarding.tsx` - 課程選擇和時間表設定組件
- `services/apiService.ts` - API 服務層

## 注意事項

- 如果課程列表仍然為空，可能是因為所有課程都已經設定了時間表
- 系統只會顯示 `source === 'google_classroom'` 且 `schedule.length === 0` 的課程
- 如果需要重新設定已匯入課程的時間表，需要在課程詳情頁面進行編輯
