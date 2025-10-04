"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { LearningResources } from "@/components/learning-resources"
import { CheckIcon, ClockIcon, PlusIcon, XIcon, EditIcon } from "@/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Exam, Course, Assignment } from "@/types/course"
import { isExamEndedTaiwan, getDaysToExamEndTaiwan } from "@/lib/taiwan-time"

interface ExamDetailProps {
  exam: Exam
  course?: Course
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Exam["status"]) => void
  onUpdateAnnotations?: (annotations: string[], notes?: string) => void
}

export function ExamDetail({ exam, course, onBack, onEdit, onDelete, onStatusChange, onUpdateAnnotations }: ExamDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState("")
  const [examNotes, setExamNotes] = useState(exam.notes || "")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [annotations, setAnnotations] = useState<string[]>(exam.annotations || [])

  const getExamStatus = (examDate: Date, duration: number) => {
    const isEnded = isExamEndedTaiwan(examDate, duration)
    const daysToExamEnd = getDaysToExamEndTaiwan(examDate, duration)

    if (isEnded) return { status: "已結束", color: "text-gray-700 bg-gray-100 border-gray-200" }
    if (daysToExamEnd <= 3)
      return { status: "即將到來", color: "text-destructive bg-destructive/10 border-destructive/20" }
    if (daysToExamEnd <= 7) return { status: "本週", color: "text-chart-5 bg-chart-5/10 border-chart-5/20" }
    return { status: "未來", color: "text-chart-1 bg-chart-1/10 border-chart-1/20" }
  }

  const getTypeText = (type: Exam["type"]) => {
    switch (type) {
      case "midterm":
        return "期中考"
      case "final":
        return "期末考"
      case "quiz":
        return "小考"
      default:
        return "其他"
    }
  }

  const examStatus = getExamStatus(exam.examDate, exam.duration)

  const handleDeleteConfirm = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      const updatedAnnotations = [...annotations, newAnnotation.trim()]
      setAnnotations(updatedAnnotations)
      setNewAnnotation("")
      onUpdateAnnotations?.(updatedAnnotations, examNotes)
    }
  }

  const handleRemoveAnnotation = (index: number) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index)
    setAnnotations(updatedAnnotations)
    onUpdateAnnotations?.(updatedAnnotations, examNotes)
  }

  const handleSaveNotes = () => {
    setIsEditingNotes(false)
    onUpdateAnnotations?.(annotations, examNotes)
  }

  const handleCancelEditNotes = () => {
    setExamNotes(exam.notes || "")
    setIsEditingNotes(false)
  }

  return (
    <>
      <PageHeader
        title={exam.title}
        action={
          <Button variant="outline" size="sm" onClick={onBack}>
            返回
          </Button>
        }
      />

      <div className="space-y-6 mb-6">
        {/* Status and Course Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${examStatus.color}`}>
              {examStatus.status}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {getTypeText(exam.type)}
            </span>
          </div>

          {course && (
            <div>
              <p className="text-sm text-muted-foreground">課程：{course.name}</p>
            </div>
          )}
        </div>

        {/* Exam Date */}
        <div className="space-y-1">
          <span className="text-sm font-medium">考試時間</span>
          <p className="text-sm text-muted-foreground">{exam.examDate.toLocaleString("zh-TW")}</p>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <span className="text-sm font-medium">考試時長</span>
          <p className="text-sm text-muted-foreground">{exam.duration} 分鐘</p>
        </div>

        {/* Location */}
        {exam.location && (
          <div className="space-y-1">
            <span className="text-sm font-medium">考試地點</span>
            <p className="text-sm text-muted-foreground">{exam.location}</p>
          </div>
        )}

        {/* Description */}
        {exam.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">考試備註</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{exam.description}</p>
          </div>
        )}
      </div>

      {/* Annotations Section */}
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            📝 考試標註
          </h3>
          
          {/* Add new annotation */}
          <div className="flex gap-2">
            <Input
              placeholder="添加新的標註或重點..."
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddAnnotation()}
              className="flex-1"
            />
            <Button onClick={handleAddAnnotation} size="sm" disabled={!newAnnotation.trim()}>
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Display annotations */}
          {annotations.length > 0 && (
            <div className="space-y-2">
              {annotations.map((annotation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm flex-1">{annotation}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAnnotation(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Notes Section */}
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              📄 考試筆記
            </h3>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="h-6 text-muted-foreground hover:text-foreground"
              >
                <EditIcon className="w-3 h-3 mr-1" />
                編輯
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                placeholder="添加考試相關筆記..."
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} size="sm">
                  保存
                </Button>
                <Button onClick={handleCancelEditNotes} variant="outline" size="sm">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[60px]">
              {examNotes ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{examNotes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">點擊編輯按鈕添加考試筆記...</p>
              )}
            </div>
          )}
        </div>
      </Card>

      <LearningResources
        exam={exam}
        searchQuery={`${exam.title} ${exam.description || ""} 考試 複習`}
        course={course}
      />

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {(exam.status === "pending" || exam.status === "overdue") && (
            <Button onClick={() => onStatusChange("completed")} className="flex-1">
              <CheckIcon className="w-4 h-4 mr-2" />
              標記結束
            </Button>
          )}
          {exam.status === "completed" && (
            <Button variant="outline" onClick={() => onStatusChange("pending")} className="flex-1">
              <ClockIcon className="w-4 h-4 mr-2" />
              標記未結束
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="flex-1 bg-transparent">
            編輯
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="flex-1 text-destructive hover:text-destructive bg-transparent"
          >
            刪除考試
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個考試嗎？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法復原。考試「{exam.title}」將被永久刪除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
