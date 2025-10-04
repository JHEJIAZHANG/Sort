# Google Classroom 課程匯入修正

## 最新更新（第三版 - 修正同步 API）

### 問題修正

**問題**：「匯入 Google Classroom 課程」按鈕無法顯示未匯入的課程，但「立即同步所有 Google 服務」可以。

**原因**：兩個按鈕使用了不同的 API 端點：
- 「匯入 Google Classroom 課程」使用 `syncGoogleClassroom()` → `/sync/classroom-to-v2/`
- 「立即同步所有 Google 服務」使用 `manualSyncAll()` → `/sync/manual-sync-all/`

**解決方案**：統一使用 `manualSyncAll()` API，確保兩個功能的行為一致。

---

## 更新（第二版）

### 新的使用流程

1. **「我的」頁面**：點擊「立即同步所有 Google 服務」只進行同步，不再彈出課程選擇界面
2. **「課程」頁面**：新增「匯入 Google Classroom 課程」按鈕（位於頁面底部）
3. 點擊「匯入 Google Classroom 課程」按鈕後：
   - 系統同步 Google Classroom 課程
   - 自動彈出課程選擇界面
   - 顯示未設定時間表的課程
   - 用戶**必須**選擇課程並設定上課時間
   - 點擊「確認匯入」完成匯入
   - 點擊「取消」關閉對話框（課程不會顯示在列表中，但可以稍後再次匯入）

### 重要說明

- 同步後的課程會暫存在資料庫中，但**沒有時間表的課程不會顯示在課程列表中**
- 如果用戶點擊「取消」，這些課程仍然存在於資料庫中，但不會顯示
- 用戶可以隨時再次點擊「匯入 Google Classroom 課程」來設定這些課程的時間表
- 只有設定了時間表的課程才會顯示在課程列表中

### 修改內容

1. **移除 `google-sync-all.tsx` 中的課程選擇界面**
   - 移除 `GoogleClassroomOnboarding` 組件的引用
   - 移除 `showOnboarding` 狀態
   - 移除自動彈出邏輯

2. **創建新組件 `import-google-classroom-button.tsx`**
   - 獨立的匯入按鈕組件
   - 包含同步和課程選擇的完整流程
   - 可在課程頁面使用

3. **修改 `app/page.tsx` 課程頁面**
   - 在課程列表底部添加匯入按鈕
   - 匯入完成後自動刷新課程列表

---

## 原始問題描述（第一版）

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

### 測試「我的」頁面同步功能
1. 確保已連接 Google Classroom
2. 在「我的」頁面點擊「立即同步所有 Google 服務」
3. 等待同步完成
4. 驗證同步狀態顯示正確
5. **不應該**彈出課程選擇界面

### 測試課程匯入功能
1. 切換到「課程」頁面
2. 滾動到頁面底部
3. 點擊「匯入 Google Classroom 課程」按鈕
4. 等待同步完成（約 1 秒）
5. 驗證課程選擇界面是否正確顯示未匯入的課程
6. 選擇要匯入的課程
7. 設定每個課程的上課時間
8. 點擊「確認匯入」
9. 確認課程已正確匯入並顯示在課程列表中

## 相關文件

- `components/google-sync-all.tsx` - 統一同步組件（已修改，移除課程選擇界面）
- `components/import-google-classroom-button.tsx` - 新增：匯入 Google Classroom 課程按鈕組件
- `components/google-classroom-onboarding.tsx` - 課程選擇和時間表設定組件
- `app/page.tsx` - 主頁面（已修改，在課程頁面添加匯入按鈕）
- `services/apiService.ts` - API 服務層

## 注意事項

- 如果課程列表仍然為空，可能是因為所有課程都已經設定了時間表
- 系統只會顯示 `source === 'google_classroom'` 且 `schedule.length === 0` 的課程
- 如果需要重新設定已匯入課程的時間表，需要在課程詳情頁面進行編輯
