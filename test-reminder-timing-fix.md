# 測試提醒時間編輯功能修復

## 問題描述
編輯作業時，提醒時間一直顯示「使用統一設定」，無法更新為其他選項。

## 修復內容
1. 在後端 `AssignmentSerializer` 中添加了 `custom_reminder_timing` 欄位
2. 添加了調試信息來追蹤資料流

## 測試步驟

### 1. 檢查 API 資料
- 後端 API 現在正確返回 `custom_reminder_timing` 欄位
- 可以看到不同作業有不同的提醒時間設定

### 2. 測試前端編輯功能
1. 打開瀏覽器開發者工具的 Console 頁面
2. 在應用程式中找到一個作業
3. 點擊「編輯」按鈕
4. 觀察 Console 中的調試信息：
   - `editingAssignment`: 編輯中的作業 ID
   - `assignmentData`: 從 API 獲取的作業資料
   - `assignmentData.customReminderTiming`: 提醒時間設定
   - `initialData`: 傳遞給表單的初始資料
   - `formData`: 表單的當前狀態

### 3. 驗證編輯功能
1. 在編輯表單中更改提醒時間設定
2. 點擊「儲存」
3. 觀察 Console 中的 `updateAssignment` 調試信息
4. 重新編輯同一個作業，確認設定已保存

## 預期結果
- 編輯表單應該顯示正確的當前提醒時間設定
- 更改提醒時間後應該能夠成功保存
- 重新編輯時應該顯示更新後的設定

## 調試信息位置
- `assignment-form.tsx`: 表單初始化和提交
- `assignment-management.tsx`: 編輯按鈕和資料獲取
- `hooks/use-courses.ts`: API 調用和資料更新