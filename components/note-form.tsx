"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/rich-text-editor"
import { FileUpload } from "@/components/file-upload"
import type { Note, Course } from "@/types/course"

interface NoteFormProps {
  courses: Course[]
  onSubmit: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
  initialData?: Partial<Note>
}

export function NoteForm({ courses, onSubmit, onCancel, initialData }: NoteFormProps) {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || courses[0]?.id || "",
    title: initialData?.title || "",
    content: initialData?.content || "",
    attachments: initialData?.attachments || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim() || !formData.courseId) return

    onSubmit({
      courseId: formData.courseId,
      title: formData.title.trim(),
      content: formData.content.trim(),
      attachments: formData.attachments,
    })
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="courseId" className="font-bold">
            選擇課程 *
          </Label>
          <select
            id="courseId"
            value={formData.courseId}
            onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
            required
          >
            <option value="">請選擇課程</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="title" className="font-bold">
            筆記標題 *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="輸入筆記標題"
            required
          />
        </div>

        <div>
          <Label htmlFor="content" className="font-bold">
            筆記內容 *
          </Label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
            placeholder="輸入筆記內容..."
            className="mt-1"
          />
        </div>

        <div>
          <Label className="font-bold">附加檔案</Label>
          <FileUpload
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
            maxFiles={5}
            maxSize={10}
          />
          <p className="text-xs text-muted-foreground mt-1">單檔上限 10MB，總上限受伺服器限制。</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {initialData ? "更新筆記" : "新增筆記"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            取消
          </Button>
        </div>
      </form>
    </Card>
  )
}
