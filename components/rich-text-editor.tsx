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
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h1")}>
              <Heading1 className="h-4 w-4 mr-2" />
              標題 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h2")}>
              <Heading2 className="h-4 w-4 mr-2" />
              標題 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h3")}>
              <Heading3 className="h-4 w-4 mr-2" />
              標題 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h4")}>
              <span className="text-sm mr-2">H4</span>
              標題 4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h5")}>
              <span className="text-xs mr-2">H5</span>
              標題 5
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h6")}>
              <span className="text-xs mr-2">H6</span>
              標題 6
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "p")}>
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
          onClick={() => execCommand("formatBlock", "pre")}
          className="h-8 w-8 p-0"
          title="程式碼區塊"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("formatBlock", "blockquote")}
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
          className="min-h-[200px] p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          style={{ whiteSpace: "pre-wrap" }}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  )
}
