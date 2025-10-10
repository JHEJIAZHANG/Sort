# AI 摘要添加至筆記功能

## 功能說明
在筆記詳情頁面點擊"AI 摘要"按鈕後，會顯示 AI 生成的摘要內容。現在新增了一個"添加至筆記"按鈕，讓用戶可以將 AI 摘要內容直接添加到原筆記中。

## 修改的檔案

### 1. `components/note-detail.tsx`

#### 新增的狀態
```typescript
const [isAddingToNote, setIsAddingToNote] = useState(false)
```

#### 新增的 Props
```typescript
interface NoteDetailProps {
  note: Note
  course?: Course
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdate?: (noteId: string, updates: Partial<Note>) => Promise<void> // 新增
}
```

#### 新增的函數
```typescript
const handleAddSummaryToNote = async () => {
  if (!aiSummary || !onUpdate) return
  
  setIsAddingToNote(true)
  try {
    // 將摘要中的換行符轉換為 <br> 標籤以保留換行格式
    const formattedSummary = aiSummary.summary.replace(/\n/g, '<br>')
    
    // 構建要添加的內容
    const summarySection = `\n\n<hr>\n<h3>📝 AI 摘要</h3>\n<p style="white-space: pre-line;">${formattedSummary}</p>\n`
    const keywordsSection = aiSummary.keywords.length > 0 
      ? `<p><strong>關鍵詞：</strong>${aiSummary.keywords.join('、')}</p>\n`
      : ''
    
    const newContent = note.content + summarySection + keywordsSection
    
    // 調用更新函數
    await onUpdate(note.id, { content: newContent })
    
    alert('AI 摘要已成功添加至筆記！')
    
    // 清除 AI 摘要顯示（因為已經添加到筆記中了）
    setAiSummary(null)
  } catch (error) {
    console.error('添加摘要失敗:', error)
    alert(`添加摘要失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
  } finally {
    setIsAddingToNote(false)
  }
}
```

#### UI 修改
在 AI 摘要卡片的標題旁邊添加了"添加至筆記"按鈕：

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <LightbulbIcon className="w-5 h-5 text-blue-600" />
    <h3 className="font-semibold text-blue-800">AI 摘要</h3>
  </div>
  {onUpdate && (
    <Button
      size="sm"
      onClick={handleAddSummaryToNote}
      disabled={isAddingToNote}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isAddingToNote ? '添加中...' : '添加至筆記'}
    </Button>
  )}
</div>
```

### 2. `app/page.tsx`

#### 修改 NoteDetail 的調用
添加了 `onUpdate` 回調函數：

```typescript
<NoteDetail
  note={note}
  course={getCourseById(note.courseId)}
  onBack={() => setSelectedNoteId(null)}
  onEdit={() => {
    setEditingNote(note.id)
    setSelectedNoteId(null)
    setShowNoteForm(true)
  }}
  onDelete={() => {
    if (confirm("確定要刪除這個筆記嗎？")) {
      deleteNote(note.id)
      setSelectedNoteId(null)
    }
  }}
  onUpdate={async (noteId, updates) => {
    await updateNote(noteId, updates)
    // 重新載入筆記以顯示更新後的內容
    setSelectedNoteId(null)
    setTimeout(() => setSelectedNoteId(noteId), 100)
  }}
/>
```

## 功能流程

```
用戶點擊"AI 摘要"按鈕
    ↓
顯示 AI 生成的摘要和關鍵詞
    ↓
用戶點擊"添加至筆記"按鈕
    ↓
構建摘要內容（HTML 格式）
    ↓
將摘要添加到筆記內容末尾
    ↓
調用 updateNote API 更新筆記
    ↓
顯示成功訊息
    ↓
清除 AI 摘要顯示
    ↓
重新載入筆記以顯示更新後的內容
```

## 添加的內容格式

AI 摘要會以以下 HTML 格式添加到筆記末尾：

```html
<hr>
<h3>📝 AI 摘要</h3>
<p style="white-space: pre-line;">這是 AI 生成的摘要內容...<br>支援多行顯示</p>
<p><strong>關鍵詞：</strong>關鍵詞1、關鍵詞2、關鍵詞3</p>
```

### 格式說明
- `<hr>` - 分隔線，將摘要與原內容分開
- `<h3>📝 AI 摘要</h3>` - 標題，使用 emoji 圖標
- `<p style="white-space: pre-line;">摘要內容</p>` - 摘要文字，保留換行格式
  - 換行符 `\n` 會被轉換為 `<br>` 標籤
  - 使用 `white-space: pre-line` 樣式確保換行正確顯示
- `<p><strong>關鍵詞：</strong>...</p>` - 關鍵詞列表（如果有）

## 使用步驟

### 1. 查看筆記
1. 進入"筆記"頁面
2. 點擊任一筆記查看詳情

### 2. 生成 AI 摘要
1. 點擊右上角的"AI 摘要"按鈕
2. 等待 AI 分析（顯示"AI 分析中..."）
3. 查看生成的摘要和關鍵詞

### 3. 添加至筆記
1. 點擊"添加至筆記"按鈕
2. 等待添加完成（顯示"添加中..."）
3. 看到成功訊息："AI 摘要已成功添加至筆記！"
4. AI 摘要卡片消失
5. 筆記內容自動重新載入，顯示包含摘要的完整內容

## 測試步驟

### 測試 1：基本功能
1. 創建一個包含內容的筆記
2. 查看筆記詳情
3. 點擊"AI 摘要"按鈕
4. 確認顯示 AI 摘要卡片
5. 點擊"添加至筆記"按鈕
6. 確認顯示成功訊息
7. 確認 AI 摘要卡片消失
8. 點擊"編輯筆記"查看內容
9. 確認摘要已添加到筆記末尾

**預期結果：**
- ✅ AI 摘要成功添加到筆記
- ✅ 摘要格式正確（包含分隔線、標題、內容、關鍵詞）
- ✅ 原筆記內容保持不變
- ✅ AI 摘要卡片消失

### 測試 2：多次添加
1. 生成 AI 摘要
2. 點擊"添加至筆記"
3. 再次點擊"AI 摘要"按鈕
4. 再次點擊"添加至筆記"

**預期結果：**
- ✅ 可以多次添加摘要
- ✅ 每次添加都會追加到筆記末尾
- ✅ 不會覆蓋之前的內容

### 測試 3：無摘要時
1. 查看筆記詳情
2. 不點擊"AI 摘要"按鈕

**預期結果：**
- ✅ 不顯示"添加至筆記"按鈕
- ✅ 不顯示 AI 摘要卡片

### 測試 4：錯誤處理
1. 模擬網路錯誤或 API 失敗
2. 點擊"添加至筆記"按鈕

**預期結果：**
- ✅ 顯示錯誤訊息
- ✅ 按鈕恢復可用狀態
- ✅ AI 摘要卡片仍然顯示

## 優點

### 1. 提高效率
- 用戶不需要手動複製貼上 AI 摘要
- 一鍵添加，節省時間

### 2. 保持格式
- 自動添加分隔線和標題
- 統一的格式，易於閱讀

### 3. 不破壞原內容
- 摘要添加到筆記末尾
- 原內容保持完整

### 4. 視覺反饋
- 顯示"添加中..."狀態
- 成功後顯示提示訊息
- AI 摘要卡片自動消失

## 換行處理

### 問題
AI 摘要可能包含多行內容，如果直接放在 `<p>` 標籤中，換行符會被忽略。

### 解決方案
1. **轉換換行符**：將 `\n` 轉換為 `<br>` 標籤
   ```typescript
   const formattedSummary = aiSummary.summary.replace(/\n/g, '<br>')
   ```

2. **添加樣式**：使用 `white-space: pre-line` 確保換行正確顯示
   ```html
   <p style="white-space: pre-line;">摘要內容</p>
   ```

### 效果
- ✅ 保留 AI 摘要的原始換行格式
- ✅ 在筆記詳情頁面正確顯示多行內容
- ✅ 與現有 HTML 格式兼容

## 注意事項

### 1. 重複添加
- 目前允許多次添加同一個摘要
- 未來可以考慮添加重複檢查

### 2. 內容長度
- 如果筆記內容很長，添加摘要後可能超過限制
- 建議在後端添加內容長度檢查

### 3. 格式兼容性
- 使用 HTML 格式，確保與現有筆記編輯器兼容
- 如果筆記使用 Markdown，需要調整格式
- 換行符轉換為 `<br>` 標籤，確保在 HTML 中正確顯示

## 未來改進建議

1. **添加確認對話框**
   - 在添加前詢問用戶確認
   - 顯示預覽效果

2. **重複檢查**
   - 檢查筆記中是否已包含相同的摘要
   - 避免重複添加

3. **位置選擇**
   - 讓用戶選擇添加位置（開頭、末尾、指定位置）
   - 提供更靈活的控制

4. **格式選項**
   - 支援 Markdown 格式
   - 支援純文字格式
   - 讓用戶選擇偏好的格式

5. **撤銷功能**
   - 添加後提供撤銷選項
   - 保存添加前的版本

## 相關文件
- [delete-category-cascade.md](./delete-category-cascade.md) - 刪除分類級聯功能
- [notification-time-update.md](./notification-time-update.md) - 提醒時間動態更新功能
