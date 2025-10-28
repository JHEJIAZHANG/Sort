"use client"

import { Button } from "@/components/ui/button"
import { BookIcon, ClipboardIcon, NoteIcon } from "@/components/icons"

interface DesktopActionBarProps {
  onAddCourse: () => void
  onAddAssignment: () => void
  onAddNote: () => void
  onAddExam: () => void
}

export function DesktopActionBar({ onAddCourse, onAddAssignment, onAddNote, onAddExam }: DesktopActionBarProps) {
  return (
    <div className="hidden lg:flex lg:items-center lg:gap-3 lg:p-4 lg:bg-white lg:border-b lg:border-border lg:ml-[var(--sidebar-width)] lg:transition-[margin] lg:duration-300">
      <Button onClick={onAddCourse} className="gap-2">
        <BookIcon className="w-4 h-4" />
        新增課程
      </Button>
      <Button onClick={onAddAssignment} variant="outline" className="gap-2 bg-transparent">
        <ClipboardIcon className="w-4 h-4" />
        新增作業
      </Button>
      <Button onClick={onAddExam} variant="outline" className="gap-2 bg-transparent">
        <ClipboardIcon className="w-4 h-4" />
        新增考試
      </Button>
      <Button onClick={onAddNote} variant="outline" className="gap-2 bg-transparent">
        <NoteIcon className="w-4 h-4" />
        新增筆記
      </Button>
    </div>
  )
}
