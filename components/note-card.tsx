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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card
      className={`p-3 sm:p-5 relative ${onClick ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-slate-900/90" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight mb-2">{note.title}</h3>
          {course && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              {course.name}
            </span>
          )}
        </div>
        <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 opacity-60" />
      </div>

      <div className="mb-3 sm:mb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{stripHtml(note.content)}</p>
      </div>

      {note.attachments && note.attachments.length > 0 && (
        <div className="mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
          {note.attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors">
              <svg className="w-3 h-3 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="text-xs text-foreground truncate max-w-[150px]">{attachment.name}</span>
              <span className="text-xs text-muted-foreground">({formatFileSize(attachment.size)})</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground space-y-1 flex-1 min-w-0">
          <p className="font-medium">建立：{note.createdAt.toLocaleDateString("zh-TW")}</p>
          {note.updatedAt.getTime() !== note.createdAt.getTime() && (
            <p className="font-medium">更新：{note.updatedAt.toLocaleDateString("zh-TW")}</p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 flex-shrink-0">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl font-medium bg-transparent text-xs h-8 px-2 sm:px-3 touch-manipulation">
                編輯
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="text-destructive hover:text-destructive bg-transparent rounded-xl font-medium text-xs h-8 px-2 sm:px-3 touch-manipulation"
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
