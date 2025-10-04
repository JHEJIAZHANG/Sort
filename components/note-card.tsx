"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DocumentIcon } from "@/components/icons"
import type { Note, Course } from "@/types/course"

interface NoteCardProps {
  note: Note
  course?: Course
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
}

const stripHtml = (html: string) => {
  const div = document.createElement("div")
  div.innerHTML = html
  return div.textContent || div.innerText || ""
}

export function NoteCard({ note, course, onEdit, onDelete, onClick }: NoteCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return
    }
    onClick?.()
  }

  return (
    <Card
      className={`p-3 sm:p-5 relative ${onClick ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-slate-900/90" : ""}`}
      onClick={handleCardClick}
    >
      <div
        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full absolute left-3 sm:left-4 top-5 sm:top-6"
        style={{ backgroundColor: course?.color || "#8b5cf6" }}
      />
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 ml-6 sm:ml-8">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight">{note.title}</h3>
          {course && <p className="text-sm text-muted-foreground mt-2 font-medium truncate">{course.name}</p>}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {note.attachments && note.attachments.length > 0 && (
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )}
          <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 opacity-60" />
        </div>
      </div>

      <div className="mb-3 sm:mb-4 ml-6 sm:ml-8">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{stripHtml(note.content)}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 ml-6 sm:ml-8">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">建立：{note.createdAt.toLocaleDateString("zh-TW")}</p>
          {note.updatedAt.getTime() !== note.createdAt.getTime() && (
            <p className="font-medium">更新：{note.updatedAt.toLocaleDateString("zh-TW")}</p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 sm:gap-3">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl font-medium bg-transparent text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation">
                編輯
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="text-destructive hover:text-destructive bg-transparent rounded-xl font-medium text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
              >
                刪除
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
