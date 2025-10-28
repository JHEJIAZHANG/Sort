# 自訂分類待辦事項 - 編輯時間功能說明

## 功能概述
在「待辦事項」頁面，自訂分類的待辦事項已支援編輯時間功能。

## 使用步驟

### 1. 查看待辦事項詳情
- 在「待辦事項」頁面，切換到自訂分類標籤（例如：作業、考試或自訂的分類）
- 點擊任一待辦事項卡片

### 2. 編輯待辦事項
- 在詳情頁面，點擊「編輯」按鈕
- 系統會打開編輯表單，顯示當前的所有資訊

### 3. 修改截止時間
- 在「截止日期」欄位，可以看到當前的日期和時間
- 點擊輸入框，會彈出日期時間選擇器
- 選擇新的日期和時間

### 4. 儲存變更
- 修改完成後，點擊「更新{分類名稱}」按鈕
- 系統會自動儲存並返回待辦事項列表
- 更新後的時間會立即生效

## 技術實現

### 組件結構
```
CustomCategoryDetail (詳情頁)
  ↓ 點擊編輯
CustomCategoryForm (編輯表單)
  ↓ 提交
updateCustomCategoryItem (更新函數)
  ↓ API調用
後端更新
```

### 關鍵代碼位置

1. **詳情頁面**: `components/custom-category-detail.tsx`
   - 顯示待辦事項詳情
   - 提供編輯按鈕

2. **編輯表單**: `components/custom-category-form.tsx`
   - 使用 `datetime-local` 輸入類型
   - 支援日期和時間的完整編輯
   - 自動格式化初始值

3. **更新邏輯**: `app/page.tsx` 中的 `updateCustomCategoryItem` 函數
   - 處理表單提交
   - 轉換日期格式為 ISO 字符串
   - 調用 API 更新後端

4. **API 服務**: `services/apiService.ts` 中的 `updateCustomTodo` 方法
   - 發送 PATCH 請求到後端
   - 包含重試機制

### 數據流
```typescript
// 表單提交時
dueDate: Date (JavaScript Date 對象)
  ↓
updateCustomCategoryItem
  ↓
payload.due_date = dueDate.toISOString() (ISO 8601 字符串)
  ↓
API: PATCH /custom-todos/{id}/
  ↓
後端更新數據庫
  ↓
refetchCustomTodos() (重新獲取數據)
```

## 注意事項

1. **必填欄位**: 截止日期是必填欄位，不能留空
2. **時區處理**: 系統使用台灣時區 (UTC+8)
3. **即時更新**: 編輯後會立即重新獲取數據，確保顯示最新狀態
4. **錯誤處理**: 如果更新失敗，會在控制台顯示錯誤訊息

## 相關功能

- 編輯標題和描述
- 修改狀態（進行中/已完成/已逾期）
- 更換課程
- 刪除待辦事項

## 未來改進建議

1. 添加成功/失敗的用戶提示訊息
2. 支援快速調整時間（例如：延後1小時、延後1天）
3. 添加時間衝突檢測
4. 支援重複待辦事項
