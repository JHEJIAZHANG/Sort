"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Clock, MapPin, User, BookOpen, X, Check, Calendar, GraduationCap, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface OCRSchedule {
  day_of_week: number
  start: string
  end: string
}

interface OCRConflict {
  day_of_week: number
  start_time: string
  end_time: string
  conflicting_course: {
    id: number
    title: string
    instructor: string
    classroom: string
    start_time: string
    end_time: string
  }
}

interface OCRCourse {
  title: string
  instructor: string
  classroom: string
  schedule: OCRSchedule[]
  conflicts?: OCRConflict[]
  has_conflicts?: boolean
}

interface OCRPreviewData {
  items: OCRCourse[]
  total_courses: number
  courses_with_conflicts: number
}

interface OCRPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: OCRPreviewData | null
  onConfirm: (selectedCourses: OCRCourse[]) => void
  loading?: boolean
}

const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export function OCRPreviewModal({ isOpen, onClose, data, onConfirm, loading = false }: OCRPreviewModalProps) {
  const [editedCourses, setEditedCourses] = useState<OCRCourse[]>([])
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())

  React.useEffect(() => {
    if (data?.items) {
      setEditedCourses([...data.items])
      // 預設選擇沒有衝突的課程
      const noConflictIndices = data.items
        .map((course, index) => ({ course, index }))
        .filter(({ course }) => !course.has_conflicts)
        .map(({ index }) => index)
      setSelectedCourses(new Set(noConflictIndices))
      // 預設展開有衝突的課程
      const conflictIndices = data.items
        .map((course, index) => ({ course, index }))
        .filter(({ course }) => course.has_conflicts)
        .map(({ index }) => index)
      setExpandedCourses(new Set(conflictIndices))
    }
  }, [data])

  const handleCourseEdit = (index: number, field: keyof OCRCourse, value: string) => {
    const updated = [...editedCourses]
    if (field === 'title' || field === 'instructor' || field === 'classroom') {
      updated[index] = { ...updated[index], [field]: value }
      setEditedCourses(updated)
    }
  }

  const handleScheduleEdit = (courseIndex: number, scheduleIndex: number, field: keyof OCRSchedule, value: string) => {
    const updated = [...editedCourses]
    const updatedSchedule = [...updated[courseIndex].schedule]
    if (field === 'start' || field === 'end') {
      updatedSchedule[scheduleIndex] = { ...updatedSchedule[scheduleIndex], [field]: value }
    } else if (field === 'day_of_week') {
      updatedSchedule[scheduleIndex] = { ...updatedSchedule[scheduleIndex], [field]: parseInt(value) }
    }
    updated[courseIndex] = { ...updated[courseIndex], schedule: updatedSchedule }
    setEditedCourses(updated)
  }

  const toggleCourseSelection = (index: number) => {
    const newSelected = new Set(selectedCourses)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedCourses(newSelected)
  }

  const toggleCourseExpansion = (index: number) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCourses(newExpanded)
  }

  // 全選/取消全選功能
  const handleSelectAll = () => {
    const availableCourses = editedCourses
      .map((course, index) => ({ course, index }))
      .filter(({ course }) => !course.has_conflicts)
      .map(({ index }) => index)
    
    if (selectedCourses.size === availableCourses.length) {
      // 如果已全選，則取消全選
      setSelectedCourses(new Set())
    } else {
      // 否則全選所有可用課程
      setSelectedCourses(new Set(availableCourses))
    }
  }

  // 展開/收起所有課程
  const handleExpandAll = () => {
    if (expandedCourses.size === editedCourses.length) {
      setExpandedCourses(new Set())
    } else {
      setExpandedCourses(new Set(editedCourses.map((_, index) => index)))
    }
  }

  const handleConfirm = () => {
    const selected = editedCourses.filter((_, index) => selectedCourses.has(index))
    onConfirm(selected)
  }

  const selectedCount = selectedCourses.size
  const conflictCount = editedCourses.filter(course => course.has_conflicts).length
  const availableCount = editedCourses.length - conflictCount
  const isAllSelected = selectedCount === availableCount && availableCount > 0
  const isAllExpanded = expandedCourses.size === editedCourses.length

  if (!data) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            OCR 課程識別結果預覽
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            請檢查並編輯識別結果，選擇要新增的課程
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* 統計信息和控制按鈕 */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      識別到 <span className="font-semibold text-foreground">{data.total_courses}</span> 個課程
                    </span>
                  </div>
                  {conflictCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600">
                        <span className="font-semibold">{conflictCount}</span> 個課程有時段衝突
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={availableCount === 0}
                    className="flex items-center gap-2"
                  >
                    {isAllSelected ? (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        取消全選
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4" />
                        全選可用
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandAll}
                    className="flex items-center gap-2"
                  >
                    {isAllExpanded ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        收起全部
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        展開全部
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 課程列表 */}
          {editedCourses.map((course, courseIndex) => (
            <Card key={courseIndex} className={`transition-all duration-200 ${
              course.has_conflicts 
                ? 'border-orange-200 bg-orange-50/50 shadow-sm' 
                : selectedCourses.has(courseIndex)
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card shadow-sm hover:shadow-md'
            }`}>
              <Collapsible 
                open={expandedCourses.has(courseIndex)}
                onOpenChange={() => toggleCourseExpansion(courseIndex)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedCourses.has(courseIndex)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedCourses)
                            if (checked) {
                              newSelected.add(courseIndex)
                            } else {
                              newSelected.delete(courseIndex)
                            }
                            setSelectedCourses(newSelected)
                          }}
                          disabled={course.has_conflicts}
                          className="h-5 w-5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div className="flex flex-col">
                            <CardTitle className="text-lg font-semibold">
                              {course.title || `課程 ${courseIndex + 1}`}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {course.instructor && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {course.instructor}
                                </span>
                              )}
                              {course.classroom && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {course.classroom}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.schedule.length} 個時段
                              </span>
                            </div>
                          </div>
                        </div>
                        {course.has_conflicts && (
                          <Badge variant="destructive" className="flex items-center gap-1 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            時段衝突
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedCourses.has(courseIndex) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* 課程基本信息 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-muted-foreground">課程基本信息</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`course-name-${courseIndex}`} className="text-sm font-medium">
                            課程名稱 <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`course-name-${courseIndex}`}
                            value={course.title}
                            onChange={(e) => handleCourseEdit(courseIndex, 'title', e.target.value)}
                            placeholder="請輸入課程名稱"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`course-instructor-${courseIndex}`} className="text-sm font-medium">
                            授課教師
                          </Label>
                          <Input
                            id={`course-instructor-${courseIndex}`}
                            value={course.instructor}
                            onChange={(e) => handleCourseEdit(courseIndex, 'instructor', e.target.value)}
                            placeholder="請輸入授課教師"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`course-location-${courseIndex}`} className="text-sm font-medium">
                            上課地點
                          </Label>
                          <Input
                            id={`course-location-${courseIndex}`}
                            value={course.classroom}
                            onChange={(e) => handleCourseEdit(courseIndex, 'classroom', e.target.value)}
                            placeholder="請輸入上課地點"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* 時段信息 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-muted-foreground">課程時段</h4>
                      </div>
                      <div className="space-y-3">
                        {course.schedule.map((schedule, scheduleIndex) => (
                          <div key={scheduleIndex} className={`p-4 rounded-lg border transition-all duration-200 ${
                            course.has_conflicts 
                              ? 'border-destructive/30 bg-destructive/5' 
                              : 'border-border bg-muted/30'
                          }`}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">星期</Label>
                                <select
                                  value={schedule.day_of_week}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'day_of_week', e.target.value)}
                                  className="px-2 py-1 border rounded text-sm w-full"
                                >
                                  {dayNames.map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">開始時間</Label>
                                <Input
                                  type="time"
                                  value={schedule.start}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'start', e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">結束時間</Label>
                                <Input
                                  type="time"
                                  value={schedule.end}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'end', e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">教室</Label>
                                <div className="font-medium text-sm flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {course.classroom || '未指定'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 衝突資訊 */}
                    {course.conflicts && course.conflicts.length > 0 && (
                      <div className="bg-orange-100 border border-orange-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">時段衝突詳情</span>
                        </div>
                        <div className="space-y-2">
                          {course.conflicts.map((conflict, index) => (
                            <div key={index} className="text-sm text-orange-700 bg-white p-2 rounded">
                              <div className="font-medium">
                                {dayNames[conflict.day_of_week]} {conflict.start_time}-{conflict.end_time}
                              </div>
                              <div className="text-xs mt-1">
                                與現有課程衝突：{conflict.conflicting_course.title} 
                                ({conflict.conflicting_course.instructor})
                                {conflict.conflicting_course.start_time}-{conflict.conflicting_course.end_time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        <DialogFooter className="pt-6 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  已選擇 <span className="font-semibold text-foreground">{selectedCourses.size}</span> / {availableCount} 個可用課程
                </span>
              </div>
              {conflictCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600 text-sm">
                    <span className="font-semibold">{conflictCount}</span> 個有衝突，將被跳過
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="font-medium">
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedCourses.size === 0 || loading}
                className="font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    處理中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    確認新增 {selectedCourses.size} 個課程
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}