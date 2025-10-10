# 刪除自訂分類時級聯刪除待辦事項

## 功能說明
當用戶在"待辦事項"頁面刪除自訂分類時，該分類下的所有待辦事項也會被一併刪除。

## 問題描述
之前的實作只在前端過濾掉該分類的待辦事項，但沒有真正從後端刪除，導致：
1. 資料庫中仍保留這些待辦事項
2. 重新載入頁面後，這些待辦事項可能會以錯誤的狀態顯示
3. 資料不一致

## 解決方案

### 修改的檔案：`app/page.tsx`

#### 修改前
```typescript
const handleDeleteCategory = async (categoryName: string) => {
  if (!categoryName) return
  const cat = customCategoriesApi.find((c) => c.name === categoryName)
  if (!cat) return
  if (!confirm(`確定要刪除「${categoryName}」分類嗎？這將會刪除該分類下的所有待辦事項。`)) return
  await deleteCategory(cat.id)
  setCustomCategoryItems((prev) => prev.filter((item) => item.category !== categoryName))
  if (taskType === categoryName) setTaskType("assignment")
}
```

#### 修改後
```typescript
const handleDeleteCategory = async (categoryName: string) => {
  if (!categoryName) return
  const cat = customCategoriesApi.find((c) => c.name === categoryName)
  if (!cat) return
  
  // 找出該分類下的所有待辦事項
  const itemsToDelete = customCategoryItems.filter((item) => item.category === categoryName)
  
  // 確認刪除（顯示待辦事項數量）
  const confirmMessage = itemsToDelete.length > 0
    ? `確定要刪除「${categoryName}」分類嗎？這將會刪除該分類下的 ${itemsToDelete.length} 個待辦事項。`
    : `確定要刪除「${categoryName}」分類嗎？`
  
  if (!confirm(confirmMessage)) return
  
  try {
    // 先刪除該分類下的所有待辦事項
    for (const item of itemsToDelete) {
      await deleteCustomTodoApi(item.id)
    }
    
    // 再刪除分類
    await deleteCategory(cat.id)
    
    // 重新載入資料
    await refetchCustomTodos()
    await refetchCategories()
    
    // 如果當前選中的是被刪除的分類，切換到作業頁面
    if (taskType === categoryName) setTaskType("assignment")
  } catch (error) {
    console.error('刪除分類失敗:', error)
    alert('刪除分類失敗，請稍後再試')
  }
}
```

## 主要改進

### 1. 級聯刪除
- 在刪除分類之前，先找出該分類下的所有待辦事項
- 逐一調用 `deleteCustomTodoApi()` 刪除每個待辦事項
- 確保後端資料庫中的待辦事項也被刪除

### 2. 更好的用戶提示
- 顯示將要刪除的待辦事項數量
- 例如："確定要刪除「報告」分類嗎？這將會刪除該分類下的 5 個待辦事項。"
- 如果分類下沒有待辦事項，則顯示簡單的確認訊息

### 3. 錯誤處理
- 使用 try-catch 捕獲刪除過程中的錯誤
- 如果刪除失敗，顯示錯誤訊息給用戶
- 記錄錯誤到控制台以便調試

### 4. 資料同步
- 刪除完成後，調用 `refetchCustomTodos()` 和 `refetchCategories()` 重新載入資料
- 確保前端顯示的資料與後端一致

## 執行流程

```
用戶點擊刪除分類
    ↓
找出該分類下的所有待辦事項
    ↓
顯示確認對話框（包含待辦事項數量）
    ↓
用戶確認
    ↓
逐一刪除所有待辦事項
    ↓
刪除分類
    ↓
重新載入資料
    ↓
如果需要，切換到作業頁面
```

## 測試步驟

### 測試 1：刪除有待辦事項的分類
1. 創建一個自訂分類（例如："報告"）
2. 在該分類下新增 3 個待辦事項
3. 點擊分類旁的編輯按鈕
4. 點擊刪除按鈕
5. 確認對話框顯示："確定要刪除「報告」分類嗎？這將會刪除該分類下的 3 個待辦事項。"
6. 點擊確認

**預期結果：**
- ✅ 分類被刪除
- ✅ 該分類下的 3 個待辦事項都被刪除
- ✅ 重新載入頁面後，這些待辦事項不會再出現

### 測試 2：刪除空分類
1. 創建一個自訂分類（例如："測試"）
2. 不新增任何待辦事項
3. 點擊刪除按鈕
4. 確認對話框顯示："確定要刪除「測試」分類嗎？"
5. 點擊確認

**預期結果：**
- ✅ 分類被刪除
- ✅ 沒有錯誤訊息

### 測試 3：取消刪除
1. 創建一個自訂分類並新增待辦事項
2. 點擊刪除按鈕
3. 在確認對話框中點擊取消

**預期結果：**
- ✅ 分類沒有被刪除
- ✅ 待辦事項沒有被刪除
- ✅ 一切保持原狀

### 測試 4：刪除當前選中的分類
1. 創建一個自訂分類並新增待辦事項
2. 切換到該分類的頁面
3. 點擊刪除按鈕並確認

**預期結果：**
- ✅ 分類和待辦事項被刪除
- ✅ 自動切換到"作業"頁面
- ✅ 沒有錯誤或空白頁面

## API 調用順序

```javascript
// 1. 刪除待辦事項（循環）
await deleteCustomTodoApi(item1.id)
await deleteCustomTodoApi(item2.id)
await deleteCustomTodoApi(item3.id)
// ...

// 2. 刪除分類
await deleteCategory(categoryId)

// 3. 重新載入資料
await refetchCustomTodos()
await refetchCategories()
```

## 注意事項

### 性能考慮
- 如果分類下有大量待辦事項，刪除過程可能需要一些時間
- 未來可以考慮：
  - 添加載入指示器
  - 後端提供批量刪除 API
  - 後端實作級聯刪除（ON DELETE CASCADE）

### 資料一致性
- 使用 `refetchCustomTodos()` 和 `refetchCategories()` 確保資料同步
- 避免前端狀態與後端資料不一致

### 用戶體驗
- 清楚告知用戶將要刪除的待辦事項數量
- 提供取消選項
- 顯示錯誤訊息（如果刪除失敗）

## 相關文件
- [custom-category-edit-time.md](./custom-category-edit-time.md) - 自訂分類時間編輯功能
- [notification-time-update.md](./notification-time-update.md) - 提醒時間動態更新功能
