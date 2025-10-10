"use client"
import { useEffect, useState } from "react"

export default function LiveDashboardStats() {
  const [payload, setPayload] = useState<{ ts: number; counter: number; message: string } | null>(null)
  useEffect(() => {
    const es = new EventSource("/api/stream")
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setPayload(data)
      } catch (err) {
        console.error("SSE 解析失敗", err)
      }
    }
    return () => es.close()
  }, [])

  return null
}
import { Card } from "@/components/ui/card"
import { CalendarIcon, ClockIcon, ClipboardIcon, DocumentIcon } from "@/components/icons"
import type { Course, Assignment, Note, Exam } from "@/types/course"
import { getDaysDifferenceTaiwan } from "@/lib/taiwan-time"

interface DashboardStatsProps {
  courses: Course[]
  assignments: Assignment[]
  notes: Note[]
  exams: Exam[]
}

export function DashboardStats({ courses, assignments, notes, exams }: DashboardStatsProps) {
  const pendingAssignments = assignments.filter((a) => a.status === "pending").length
  const totalExams = exams.length
  const overdueAssignments = assignments.filter((a) => {
    const daysUntilDue = getDaysDifferenceTaiwan(new Date(), a.dueDate)
    return a.status === "pending" && daysUntilDue < 0
  }).length
  const totalNotes = notes.length

  const stats = [
    {
      label: "總課程數",
      value: courses.length,
      icon: CalendarIcon,
      color: "text-primary",
    },
    {
      label: "待完成作業",
      value: pendingAssignments,
      icon: ClockIcon,
      color: "text-green-600",
    },
    {
      label: "考試總數",
      value: totalExams,
      icon: ClipboardIcon,
      color: "text-amber-600",
    },
    {
      label: "筆記總數",
      value: totalNotes,
      icon: DocumentIcon,
      color: "text-blue-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
              <div>
                <p className={`text-lg lg:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
