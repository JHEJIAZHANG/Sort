# Frontend Remediation Log

## 1. 提醒 LINE 已入群但未加入 Classroom 的學生
- **變更**
  - 新增 `ApiService.getCourseMemberStatus`、`sendClassroomReminder`，並在 `TeacherCourseDetail` 內顯示差集與提醒操作。
  - 於學生分頁提供成員列表、全選/刷新與一鍵提醒按鈕。
- **測試建議**
  - 以教師帳號載入課程詳情，確認「LINE 已入群但未加入 Classroom」區塊可正確顯示數量。
  - 勾選部分學生後點擊提醒，觀察 API 200 回應且出現成功提示。
  - 測試無差集情境應顯示「沒有需要提醒的學生」。

## 2. 課程編輯僅允許調整時間
- **變更**
  - `CourseForm` 在編輯模式將課程名稱、代碼、教師、教室欄位設為唯讀並顯示警示文字。
- **測試建議**
  - 從教師課程詳情進入編輯頁面，確認上述欄位無法輸入且仍可調整時段。
  - 建立新課程時應維持原樣可輸入。

## 3. 群組成員數同步與檢視
- **變更**
  - `ApiService.refreshLineGroupMembers` 與群組分頁的「重新同步人數」按鈕可即時更新成員數。
  - `TeacherCourseDetail` 透過 `loadCourseMemberStatus` 顯示最新差集資料，避免快取過舊。
- **測試建議**
  - 綁定 LINE 群組後，點擊「重新同步人數」需看到更新的 member_count。
  - 於 LINE 群組新增/移除成員後重新整理，前端數字應與後端一致。

## 4. 「我的 > 設定 > 通知設定」讀寫修正
- **變更**
  - 加入通知設定資料正規化、載入狀態與錯誤提示，並統一 snake_case / camelCase 轉換。
  - 儲存按鈕僅在設定異動時啟用，儲存後會重置比較基準。
- **測試建議**
  - 變更提醒時間與勿擾設定，確認儲存後重新進入頁面為最新值。
  - 斷線或模擬 API 失敗時應顯示錯誤訊息且保留可再次儲存。

## 5. 測試與驗證建議
- `npm run lint`（或 `pnpm lint`）確保無型別／語法錯誤。
- 於桌機與手機版 UI 檢視新增的提醒卡片與唯讀欄位樣式。
- 透過瀏覽器 devtools 監看 `POST /teacher/courses/{id}/remind-classroom/` 與 `.../line-groups/{groupId}/refresh/` 回應。

## 6. 教師端 OCR 課程匯入並自動建立 Classroom 課程
- **變更**
  - 追加後端 `POST /api/classroom/teacher/ocr-import/`，沿用學生 OCR confirm 的資料結構，伺服器端負責建立 Google Classroom 課程並寫入本地 `Course` / `CourseSchedule`。
  - `TeacherOCRImportButton` 再次呼叫 `ApiService.teacherOcrConfirm`，成功後自動刷新課程列表。
  - 支援 `auto_create_classroom` 旗標，預設直接建課；若未建課需提供 `google_course_id`。
- **測試建議**
  - 於教師課程頁點擊「OCR 匯入課程」，選取圖片、調整內容後提交，network 需有 `POST /api/classroom/teacher/ocr-import/` 回傳成功。
  - 確認作業建立後，本地資料庫與 Classroom 均出現新課程，排課資訊同步寫入。

## 7. LINE 差集提醒與通知設定修補
- **變更**
  - `ApiService.getCourseMemberStatus` / `sendClassroomReminder` 改用 `/api/teacher/...` 前綴；後端對應新增 `member-status` 與 `remind-classroom` 端點，可一次抓取 LINE 群組與 Classroom 差集並推送提醒。
  - 新增 `lib/notification-settings.ts` 統一通知設定的預設值、映射與型別，`ProfileContent` 與 `TeacherProfileContent` 皆共享同一套轉換邏輯並於 `ApiService` 層設置 `line_user_id`。
  - 將教師通知設定儲存 API 的 payload 轉為 snake_case，並在無 `lineUserId` 時退回預設值，避免儲存失敗導致 LINE 推播中斷。
  - `TeacherAssignmentManagement` 以 `assignment.status` 為準計算「進行中/已結束」的計數、篩選與排序，解決過去僅依截止日期導致標籤顯示錯誤的問題。
- **測試建議**
  - 重新載入教師課程詳情，確認「LINE 已入群但未加入 Classroom」列表不再 404，且可勾選學生觸發 `POST /api/teacher/courses/{id}/remind-classroom/`，LINE 實際收到提醒。
  - 分別在學生與教師的「通知設定」頁切換勿擾/提醒時機，儲存後重新進入應維持最新狀態，並確認 `PUT /api/notification-settings/{lineId}` payload 已為 snake_case。
  - 切換作業篩選標籤（全部/進行中/已結束），確認計數與列表同步更新，進行中的卡片只會顯示 `status=pending` 的作業，已結束則包含 `completed/overdue`。
