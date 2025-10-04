"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Link2, Heading1, Heading2, Heading3, Code, Quote, Minus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!isEditorFocused) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value, isEditorFocused])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertElement = (tagName: string) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const element = document.createElement(tagName)
    
    // 如果有選中的內容，將其放入新元素中
    if (!range.collapsed) {
      const contents = range.extractContents()
      element.appendChild(contents)
    } else {
      // 如果沒有選中內容，添加一個空格或換行
      element.innerHTML = tagName === 'pre' ? '\n' : '&nbsp;'
    }
    
    range.insertNode(element)
    
    // 將游標移到元素內部
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    
    handleInput()
  }

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
        element.textContent = text || '\u00A0' // 使用不間斷空格
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          execCommand("bold")
          break
        case "i":
          e.preventDefault()
          execCommand("italic")
          break
        case "u":
          e.preventDefault()
          execCommand("underline")
          break
      }
    }
  }

  return (
    <div className={`border rounded-lg relative ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
        {/* Heading Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
              <Heading1 className="h-4 w-4 mr-1" />
              <span className="text-xs">標題</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => formatBlock("h1")}>
              <Heading1 className="h-4 w-4 mr-2" />
              標題 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("h2")}>
              <Heading2 className="h-4 w-4 mr-2" />
              標題 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("h3")}>
              <Heading3 className="h-4 w-4 mr-2" />
              標題 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("h4")}>
              <span className="text-sm mr-2">H4</span>
              標題 4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("h5")}>
              <span className="text-xs mr-2">H5</span>
              標題 5
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("h6")}>
              <span className="text-xs mr-2">H6</span>
              標題 6
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatBlock("p")}>
              <span className="text-sm mr-2">P</span>
              一般文字
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-8 w-8 p-0" title="粗體 (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-8 w-8 p-0" title="斜體 (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-8 w-8 p-0" title="底線 (Ctrl+U)">
          <span className="text-sm font-bold underline">U</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")} className="h-8 w-8 p-0" title="刪除線">
          <span className="text-sm font-bold line-through">S</span>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          className="h-8 w-8 p-0"
          title="無序列表"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          className="h-8 w-8 p-0"
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Code and Quote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock("pre")}
          className="h-8 w-8 p-0"
          title="程式碼區塊"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock("blockquote")}
          className="h-8 w-8 p-0"
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link and HR */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("輸入連結網址:")
            if (url) execCommand("createLink", url)
          }}
          className="h-8 w-8 p-0"
          title="插入連結"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertHorizontalRule")}
          className="h-8 w-8 p-0"
          title="分隔線"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onKeyDown={handleKeyDown}
          className="min-h-[200px] p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset prose prose-sm max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-3 [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-2 [&>h3]:mb-1 [&>h4]:text-base [&>h4]:font-bold [&>h5]:text-sm [&>h5]:font-bold [&>h6]:text-xs [&>h6]:font-bold [&>pre]:bg-gray-100 [&>pre]:p-2 [&>pre]:rounded [&>pre]:font-mono [&>pre]:text-sm [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6"
          style={{ whiteSpace: "pre-wrap" }}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  )
}
