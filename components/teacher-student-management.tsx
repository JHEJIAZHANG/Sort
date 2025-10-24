"use client"

import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface StudentItem {
  id: string
  name: string
  email?: string
  lineConnected: boolean
  hasSubmitted: boolean
}

export function TeacherStudentManagement() {
  const [query, setQuery] = useState("")
  const [students, setStudents] = useState<StudentItem[]>([
    { id: "s1", name: "王小明", email: "ming@example.com", lineConnected: true, hasSubmitted: false },
    { id: "s2", name: "李小華", email: "hua@example.com", lineConnected: false, hasSubmitted: false },
    { id: "s3", name: "陳大同", email: "tong@example.com", lineConnected: true, hasSubmitted: true },
    { id: "s4", name: "林安安", email: "anan@example.com", lineConnected: false, hasSubmitted: true },
  ])

  const filtered = useMemo(() => {
    if (!query.trim()) return students
    const q = query.trim().toLowerCase()
    return students.filter(s => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
  }, [query, students])

  const remindUnsubmitted = () => {
    const targets = students.filter(s => !s.hasSubmitted).map(s => s.name)
    console.log("提醒未繳交：", targets)
    alert(`已觸發提醒未繳交（模擬）：${targets.join("、")}`)
  }

  const importFromGoogleClassroom = () => {
    console.log("匯入 Google Classroom 學生（模擬）")
    alert("已觸發 Google Classroom 匯入（模擬）")
  }

  const addStudent = () => {
    const newId = `s${students.length + 1}`
    const newName = `新學生 ${students.length + 1}`
    setStudents(prev => [...prev, { id: newId, name: newName, lineConnected: false, hasSubmitted: false }])
  }

  const toggleLine = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, lineConnected: !s.lineConnected } : s))
  }

  const toggleSubmitted = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, hasSubmitted: !s.hasSubmitted } : s))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">學生管理</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={importFromGoogleClassroom}>匯入 Google Classroom</Button>
          <Button variant="outline" onClick={addStudent}>新增學生</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={remindUnsubmitted}>提醒未繳交</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>學生清單</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋姓名或 Email"
              className="w-full sm:w-64 border rounded-md px-3 py-2 text-sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">沒有符合條件的學生</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {s.name.slice(0,1)}
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email || "無 Email"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={s.lineConnected ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}>
                      {s.lineConnected ? "LINE 已綁定" : "LINE 未綁定"}
                    </Badge>
                    <Badge variant="outline" className={s.hasSubmitted ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}>
                      {s.hasSubmitted ? "已繳交" : "未繳交"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleLine(s.id)}>
                      {s.lineConnected ? "解除綁定" : "綁定 LINE"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleSubmitted(s.id)}>
                      {s.hasSubmitted ? "標記未繳交" : "標記已繳交"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}