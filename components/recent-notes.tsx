"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyStateSimple } from "@/components/empty-state"
import { DocumentIcon, PaperclipIcon } from "@/components/icons"
import type { Note, Course } from "@/types/course"
import { isSameDayTaiwan, isTodayTaiwan } from "@/lib/taiwan-time"

interface RecentNotesProps {
  notes: Note[]
  courses: Course[]
  selectedDate?: Date
  onViewNote: (noteId: string) => void
  onViewAllNotes: () => void
}

export function RecentNotes({ notes, courses, selectedDate, onViewNote, onViewAllNotes }: RecentNotesProps) {
  const viewingDate = selectedDate || new Date()
  const isViewingToday = isTodayTaiwan(viewingDate)

  const recentNotes = isViewingToday
    ? notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3)
    : notes
        .filter((note) => isSameDayTaiwan(note.createdAt, viewingDate) || isSameDayTaiwan(note.updatedAt, viewingDate))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 3)

  const getCourseById = (id: string) => courses.find((course) => course.id === id)

  const stripHtml = (html: string) => {
    const temp = document.createElement("div")
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ""
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <DocumentIcon className="w-5 h-5 text-blue-600" />
          最近筆記
        </h2>
        {notes.length > 3 && (
          <Button variant="outline" size="sm" onClick={onViewAllNotes}>
            查看全部
          </Button>
        )}
      </div>

      {recentNotes.length > 0 ? (
        <div className="space-y-3">
          {recentNotes.map((note) => {
            const course = getCourseById(note.courseId)
            return (
              <div
                key={note.id}
                className="flex items-start gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors relative"
                onClick={() => onViewNote(note.id)}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: course?.color || "#8b5cf6" }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground text-balance">{note.title}</h3>
                  {note.attachments && note.attachments.length > 0 && (
                    <PaperclipIcon className="w-4 h-4 text-muted-foreground/60 absolute top-3 right-2" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{course?.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{stripHtml(note.content)}</p>
                  <p className="text-xs text-slate-600 mt-2">{note.updatedAt.toLocaleDateString("zh-TW")}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyStateSimple
          title={isViewingToday ? "還沒有任何筆記" : "該日期沒有筆記"}
          description="開始記錄學習筆記和重點"
          showAction={false}
        />
      )}
    </Card>
  )
}
