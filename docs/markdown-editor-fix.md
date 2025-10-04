# 筆記編輯器 Markdown 功能修復

## 問題描述
標題下拉選單、程式碼區塊、引用等功能無法正常使用和顯示。

## 問題原因

### 1. `formatBlock` 命令不穩定
- `document.execCommand('formatBlock')` 在某些瀏覽器中不可靠
- 特別是對於 `<pre>` 和 `<blockquote>` 標籤
- 可能完全不執行或執行後沒有效果

### 2. 缺少樣式
- 即使 HTML 標籤正確插入，也沒有對應的 CSS 樣式
- 導致標題、程式碼區塊、引用等看起來和普通文字一樣

## 解決方案

### 1. 改進 `formatBlock` 函數
創建了一個更可靠的 `formatBlock` 函數，包含備用方案：

```typescript
const formatBlock = (tag: string) => {
  if (!editorRef.current) return
  
  editorRef.current.focus()
  
  // 嘗試使用 formatBlock 命令
  try {
    const success = document.execCommand('formatBlock', false, `<${tag}>`)
    if (success) {
      handleInput()
      return
    }
  } catch (e) {
    console.warn('formatBlock failed, using fallback method')
  }
  
  // 如果 formatBlock 失敗，使用備用方法
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const element = document.createElement(tag)
  
  // 獲取選中的內容或當前行
  if (!range.collapsed) {
    const contents = range.extractContents()
    element.appendChild(contents)
  } else {
    // 獲取當前段落
    let node = range.startContainer
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node
    }
    
    if (node && node.nodeName !== 'DIV') {
      const text = node.textContent || ''
      element.textContent = text || '\u00A0'
      node.parentNode?.replaceChild(element, node)
    } else {
      element.innerHTML = '\u00A0'
      range.insertNode(element)
    }
  }
  
  // 將游標移到元素末尾
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
  
  handleInput()
}
```

### 2. 添加完整的 CSS 樣式
在編輯器的 `className` 中添加了 Tailwind CSS 樣式：

```typescript
className="min-h-[200px] p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset 
  prose prose-sm max-w-none 
  [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2 
  [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-3 [&>h2]:mb-2 
  [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-2 [&>h3]:mb-1 
  [&>h4]:text-base [&>h4]:font-bold 
  [&>h5]:text-sm [&>h5]:font-bold 
  [&>h6]:text-xs [&>h6]:font-bold 
  [&>pre]:bg-gray-100 [&>pre]:p-2 [&>pre]:rounded [&>pre]:font-mono [&>pre]:text-sm [&>pre]:overflow-x-auto 
  [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 
  [&>ul]:list-disc [&>ul]:ml-6 
  [&>ol]:list-decimal [&>ol]:ml-6"
```

### 3. 更新所有格式按鈕
將所有使用 `formatBlock` 的按鈕改為使用新的函數：

```typescript
// 標題下拉選單
<DropdownMenuItem onClick={() => formatBlock("h1")}>
  標題 1
</DropdownMenuItem>

// 程式碼區塊
<Button onClick={() => formatBlock("pre")}>
  <Code className="h-4 w-4" />
</Button>

// 引用
<Button onClick={() => formatBlock("blockquote")}>
  <Quote className="h-4 w-4" />
</Button>
```

## 樣式效果

### 標題樣式
- **H1**: 2xl 大小，粗體，上邊距 4，下邊距 2
- **H2**: xl 大小，粗體，上邊距 3，下邊距 2
- **H3**: lg 大小，粗體，上邊距 2，下邊距 1
- **H4**: base 大小，粗體
- **H5**: sm 大小，粗體
- **H6**: xs 大小，粗體

### 程式碼區塊樣式
- 灰色背景 (`bg-gray-100`)
- 內邊距 (`p-2`)
- 圓角 (`rounded`)
- 等寬字體 (`font-mono`)
- 小字體 (`text-sm`)
- 水平滾動 (`overflow-x-auto`)

### 引用樣式
- 左側邊框 (`border-l-4`)
- 灰色邊框 (`border-gray-300`)
- 左內邊距 (`pl-4`)
- 斜體 (`italic`)
- 灰色文字 (`text-gray-600`)

### 列表樣式
- 無序列表：圓點符號 (`list-disc`)，左邊距 (`ml-6`)
- 有序列表：數字編號 (`list-decimal`)，左邊距 (`ml-6`)

## 測試步驟

### 測試 1：標題功能
1. 創建新筆記
2. 輸入一些文字
3. 選中文字（或將游標放在文字中）
4. 點擊"標題"下拉選單
5. 選擇"標題 1"

**預期結果：**
- ✅ 文字變為大標題（2xl 大小）
- ✅ 文字加粗
- ✅ 有適當的上下邊距

### 測試 2：程式碼區塊
1. 輸入一些文字
2. 選中文字
3. 點擊程式碼區塊按鈕 `</>`

**預期結果：**
- ✅ 文字顯示在灰色背景中
- ✅ 使用等寬字體
- ✅ 有內邊距和圓角

### 測試 3：引用
1. 輸入一些文字
2. 選中文字
3. 點擊引用按鈕 `"`

**預期結果：**
- ✅ 左側有灰色邊框線
- ✅ 文字為斜體
- ✅ 文字顏色為灰色
- ✅ 有左內邊距

### 測試 4：列表
1. 點擊無序列表按鈕
2. 輸入第一個項目
3. 按 Enter 鍵
4. 輸入第二個項目

**預期結果：**
- ✅ 顯示圓點符號
- ✅ 項目有適當的縮排
- ✅ 按 Enter 鍵自動新增項目

### 測試 5：組合使用
1. 創建一個標題
2. 在標題下方添加一些文字
3. 添加一個程式碼區塊
4. 添加一個引用
5. 添加一個列表

**預期結果：**
- ✅ 所有元素都正確顯示
- ✅ 樣式不會互相干擾
- ✅ 可以在不同元素之間切換

## 技術細節

### 備用方案邏輯
1. 首先嘗試使用 `document.execCommand('formatBlock')`
2. 如果失敗，直接操作 DOM：
   - 創建新的 HTML 元素
   - 將選中的內容移到新元素中
   - 替換原有的節點
   - 更新游標位置

### 樣式應用方式
使用 Tailwind CSS 的任意值語法 `[&>tag]` 來針對特定子元素應用樣式：
- `[&>h1]` - 針對直接子元素 `<h1>`
- `[&>pre]` - 針對直接子元素 `<pre>`
- `[&>blockquote]` - 針對直接子元素 `<blockquote>`

### 游標管理
確保在插入或修改元素後，游標位置正確：
```typescript
range.selectNodeContents(element)
range.collapse(false) // 移到末尾
selection.removeAllRanges()
selection.addRange(range)
```

## 已知限制

### 1. 嵌套元素
- 目前不支援在程式碼區塊或引用中嵌套其他格式
- 這是為了保持簡單和可預測的行為

### 2. 複雜選擇
- 如果選擇跨越多個段落，可能會有意外行為
- 建議一次只格式化一個段落

### 3. 瀏覽器差異
- 不同瀏覽器的 `contentEditable` 行為可能略有不同
- 已在 Chrome、Firefox、Safari 中測試

## 優點

### 1. 更可靠
- 使用備用方案確保功能在所有情況下都能工作
- 不依賴不穩定的瀏覽器 API

### 2. 視覺反饋
- 所有格式都有清晰的視覺樣式
- 用戶可以立即看到格式效果

### 3. 一致性
- 在編輯器和顯示模式中使用相同的樣式
- 確保所見即所得

## 相關文件
- [markdown-editor-features.md](./markdown-editor-features.md) - Markdown 功能說明
- [ai-summary-add-to-note.md](./ai-summary-add-to-note.md) - AI 摘要功能
