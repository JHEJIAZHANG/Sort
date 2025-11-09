"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { ApiService } from "@/services/apiService"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Assignment, Course, Exam } from "@/types/course"

interface LearningResource {
  title: string
  url: string
  type: "youtube" | "website" | "documentation" | "github" | "stackoverflow" | "medium" | "coursera" | "udemy"
  description: string
  source?: "ai" | "manual" | "keyword"
  score?: number
  difficulty?: "beginner" | "intermediate" | "advanced"
  duration?: string
  language?: string
}

interface LearningResourcesProps {
  assignment?: Assignment
  exam?: Exam
  course?: Course
  searchQuery?: string
}

// 與 ApiService 對齊的後端設定
const API_BASE = ApiService.backendOrigin
const LINE_USER_ID = ApiService.bootstrapLineUserId()

type RecItem = {
  source: string
  url: string
  title: string
  snippet?: string
  score?: number
}

type RecResponse = {
  assignment: string
  query: string
  results: RecItem[]
}

const extractResourceInfo = (url: string) => {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return {
      title: `YouTube 影片 - ${videoId}`,
      description: "從 YouTube 拖曳新增的學習資源",
      type: "youtube" as const,
      source: "manual" as const,
    }
  }

  // GitHub
  if (url.includes('github.com')) {
    const pathParts = url.split('/')
    const repo = pathParts.slice(-2).join('/')
    return {
      title: `GitHub 專案 - ${repo}`,
      description: "開源程式碼專案",
      type: "github" as const,
      source: "manual" as const,
    }
  }

  // Stack Overflow
  if (url.includes('stackoverflow.com')) {
    return {
      title: "Stack Overflow 問答",
      description: "程式設計問題解答",
      type: "stackoverflow" as const,
      source: "manual" as const,
    }
  }

  // Medium
  if (url.includes('medium.com')) {
    return {
      title: "Medium 文章",
      description: "技術文章和教學",
      type: "medium" as const,
      source: "manual" as const,
    }
  }

  // Coursera
  if (url.includes('coursera.org')) {
    return {
      title: "Coursera 課程",
      description: "線上課程平台",
      type: "coursera" as const,
      source: "manual" as const,
    }
  }

  // Udemy
  if (url.includes('udemy.com')) {
    return {
      title: "Udemy 課程",
      description: "線上學習課程",
      type: "udemy" as const,
      source: "manual" as const,
    }
  }

  return null
}

const extractWebsiteInfo = (url: string) => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace("www.", "")

    // 檢查是否為文檔網站
    if (domain.includes('docs.') || domain.includes('documentation') || 
        url.includes('/docs/') || url.includes('/documentation/')) {
      return {
        title: `文檔 - ${domain}`,
        description: "技術文檔和API參考",
        type: "documentation" as const,
        source: "manual" as const,
      }
    }

    return {
      title: `網站 - ${domain}`,
      description: "從網站拖曳新增的學習資源",
      type: "website" as const,
      source: "manual" as const,
    }
  } catch {
    return {
      title: "網站連結",
      description: "從網站拖曳新增的學習資源",
      type: "website" as const,
      source: "manual" as const,
    }
  }
}



// 移除模擬學習資源數據庫，改為空函數
const getResourcesByKeywords = (keywords: Array<string | undefined | null>): LearningResource[] => {
  // 不再使用假資料，只依賴後端 API 結果
  return []
}

const getTypeIcon = (type: LearningResource["type"]) => {
  switch (type) {
    case "youtube":
      return "📺"
    case "website":
      return "🌐"
    case "documentation":
      return "📚"
    case "github":
      return "💻"
    case "stackoverflow":
      return "❓"
    case "medium":
      return "📝"
    case "coursera":
      return "🎓"
    case "udemy":
      return "🎯"
    default:
      return "🔗"
  }
}

const getTypeText = (type: LearningResource["type"]) => {
  switch (type) {
    case "youtube":
      return "影片"
    case "website":
      return "網站"
    case "documentation":
      return "文檔"
    case "github":
      return "程式碼"
    case "stackoverflow":
      return "問答"
    case "medium":
      return "文章"
    case "coursera":
      return "課程"
    case "udemy":
      return "課程"
    default:
      return "連結"
  }
}

export function LearningResources({ assignment, exam, course, searchQuery }: LearningResourcesProps) {
  const [customSearch, setCustomSearch] = useState("")
  const [showCustomSearch, setShowCustomSearch] = useState(false)
  const [submittedQuery, setSubmittedQuery] = useState<string>("")
  const [customResources, setCustomResources] = useState<LearningResource[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendResources, setBackendResources] = useState<LearningResource[]>([])
  const [backendQuery, setBackendQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<"relevance" | "type" | "difficulty" | "source">("relevance")

  // 生成搜索關鍵字
  const generateKeywords = (): string[] => {
    const keywords: string[] = []

    if (customSearch.trim()) {
      keywords.push(customSearch.trim())
    } else if (searchQuery) {
      keywords.push(searchQuery)
    } else if (assignment) {
      keywords.push(assignment.title)
      if (assignment.description) {
        keywords.push(assignment.description)
      }
    } else if (exam) {
      keywords.push(exam.title)
      if (exam.description) {
        keywords.push(exam.description)
      }
    }

    if (course) {
      keywords.push(course.name)
    }

    return keywords
  }

  const keywords = generateKeywords()

  // 從後端取得推薦結果（若有 assignment 或 exam）
  useEffect(() => {
    let aborted = false
    async function fetchRecommendations() {
      if (!assignment?.id && !exam?.id) {
        setBackendResources([])
        setBackendQuery("")
        return
      }
      try {
        setLoading(true)
        setError(null)
        const params: any = { limit: 12, perSource: 6 }
        // 若未輸入自訂查詢，改以 keywords 合成預設查詢字串，確保後端使用 perplexity / youtube 管線能得到合理結果
        if (submittedQuery && submittedQuery.trim()) {
          params.q = submittedQuery.trim()
        } else if (keywords && keywords.length) {
          params.q = keywords.join(' ').slice(0, 300)
        }
        
        let resp
        if (assignment?.id) {
          resp = await ApiService.getAssignmentRecommendations(assignment.id, params)
        } else if (exam?.id) {
          resp = await ApiService.getExamRecommendations(exam.id, params)
        } else {
          throw new Error("No assignment or exam ID provided")
        }
        if (resp.error) {
          // 如果是 404 錯誤（作業不存在），顯示友善的錯誤訊息
          if (resp.error.includes('404') || resp.error.includes('does not exist') || resp.error.includes('No AssignmentV2 matches')) {
            throw new Error("此作業可能已被刪除或不存在，請重新整理頁面")
          }
          throw new Error(resp.error)
        }
        // 在瀏覽器 Console 顯示來源統計，確認是否有使用到 perplexity / youtube
         const meta: any = (resp as any)?.data?.meta
        const data: RecResponse = resp.data as any
        if (aborted) return
        setBackendQuery(data.query)
        const mapped: LearningResource[] = (data.results || []).map((r) => {
          let type: LearningResource["type"] = "website"
          
          // 根據來源和URL判斷類型
          if (r.source === "youtube" || r.url.includes('youtube.com') || r.url.includes('youtu.be')) {
            type = "youtube"
          } else if (r.url.includes('github.com')) {
            type = "github"
          } else if (r.url.includes('stackoverflow.com')) {
            type = "stackoverflow"
          } else if (r.url.includes('medium.com')) {
            type = "medium"
          } else if (r.url.includes('coursera.org')) {
            type = "coursera"
          } else if (r.url.includes('udemy.com')) {
            type = "udemy"
          } else if (r.url.includes('/docs/') || r.url.includes('documentation')) {
            type = "documentation"
          }
          
          return {
            title: r.title,
            url: r.url,
            type,
            description: r.snippet || "",
            source: "ai",
            score: r.score,
          }
        })
        setBackendResources(mapped)
      } catch (e: any) {
        if (aborted) return
        setError(e?.message || "載入失敗")
        setBackendResources([])
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    fetchRecommendations()
    return () => {
      aborted = true
    }
    // 僅 assignment 或 exam 變動時觸發
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id, exam?.id, submittedQuery])

  // 只使用後端結果，不使用本地假資料
  const defaultResources = useMemo(() => {
    return backendResources
  }, [backendResources])

  const allResources = useMemo(() => {
    const merged = [...defaultResources]
    // 合併自訂資源（去重）
    for (const r of customResources) {
      if (!merged.some((m) => m.url === r.url)) merged.push(r)
    }
    
    // 排序邏輯
    return merged.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          // AI推薦優先，然後按評分排序
          if (a.source === "ai" && b.source !== "ai") return -1
          if (b.source === "ai" && a.source !== "ai") return 1
          return (b.score || 0) - (a.score || 0)
        
        case "type":
          return a.type.localeCompare(b.type)
        
        case "difficulty":
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
          const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0
          const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0
          return aDiff - bDiff
        
        case "source":
          const sourceOrder = { ai: 1, manual: 2, keyword: 3 }
          const aSource = sourceOrder[a.source as keyof typeof sourceOrder] || 4
          const bSource = sourceOrder[b.source as keyof typeof sourceOrder] || 4
          return aSource - bSource
        
        default:
          return 0
      }
    })
  }, [defaultResources, customResources, sortBy])

  const handleCustomSearch = () => {
    if (customSearch.trim()) {
      // 設定提交的查詢字串並觸發重新搜索
      setSubmittedQuery(customSearch.trim())
      setShowCustomSearch(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    let url = e.dataTransfer.getData("text/uri-list")
    if (!url) {
      url = e.dataTransfer.getData("text/plain")
    }
    if (!url) {
      url = e.dataTransfer.getData("URL")
    }

    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
       // Check if URL already exists
       const existsInDefault = allResources.some((resource: LearningResource) => resource.url === url)
       const existsInCustom = customResources.some((resource: LearningResource) => resource.url === url)

       if (existsInDefault || existsInCustom) {
         return // Don't add duplicate
       }

       // Extract info based on URL type
       const resourceInfo = extractResourceInfo(url)
       const websiteInfo = extractWebsiteInfo(url)

       const newResource: LearningResource = {
         url,
         ...(resourceInfo || websiteInfo),
       }

       setCustomResources((prev) => [newResource, ...prev])
     }
  }

  const removeCustomResource = (urlToRemove: string) => {
    setCustomResources((prev) => prev.filter((resource) => resource.url !== urlToRemove))
  }

  return (
    <Card
      className={`p-3 sm:p-4 transition-all duration-200 ${
        isDragOver ? "bg-primary/5 border-primary border-2 border-dashed shadow-lg" : "hover:shadow-md"
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <h2 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
          <span>🎯</span>
          <span className="truncate">學習資源推薦</span>
        </h2>
        <div className="flex gap-2">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 border rounded bg-background flex-1 sm:flex-none"
          >
            <option value="relevance">相關性</option>
            <option value="type">類型</option>
            <option value="difficulty">難度</option>
            <option value="source">來源</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCustomSearch(!showCustomSearch)}
            className="text-[10px] sm:text-xs h-8 px-2 sm:px-3 whitespace-nowrap"
          >
            自訂搜索
          </Button>
        </div>
      </div>

      {showCustomSearch && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted rounded-lg">
          <div className="flex gap-2">
            <Input
              placeholder="輸入搜索關鍵字..."
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCustomSearch()}
              className="text-xs sm:text-sm h-8 sm:h-9"
            />
            <Button 
              size="sm" 
              onClick={handleCustomSearch}
              className="text-xs h-8 px-3 whitespace-nowrap"
            >
              搜索
            </Button>
          </div>
        </div>
      )}

      {isDragOver && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 border-2 border-dashed border-primary bg-primary/5 rounded-lg text-center">
          <p className="text-xs sm:text-sm text-primary font-medium">📎 放開以新增學習資源</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">支援 YouTube 影片和網站連結</p>
        </div>
      )}

      {(backendQuery || keywords.length > 0) && (
        <div className="mb-2 sm:mb-3">
          {backendQuery ? (
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">推薦查詢：{backendQuery}</p>
          ) : (
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">搜索關鍵字：{keywords.join(", ")}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="mb-3 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm">正在載入推薦資源…</div>
      )}
      {error && (
        <div className="mb-3 p-2 sm:p-3 bg-destructive/10 text-destructive rounded text-xs sm:text-sm break-words">{error}</div>
      )}

      {allResources.length > 0 ? (
        <div className="space-y-3">
          {allResources.map((resource, index) => {
            const isCustomResource = customResources.some((cr) => cr.url === resource.url)

            return (
              <div
                key={index}
                className="flex flex-col p-2.5 sm:p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors gap-2"
              >
                {/* 手機版：圖示、標籤、按鈕在同一行 */}
                <div className="flex sm:hidden items-center gap-1.5 flex-wrap">
                  <span className="text-base flex-shrink-0">{getTypeIcon(resource.type)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-background rounded-full text-muted-foreground whitespace-nowrap">
                    {getTypeText(resource.type)}
                  </span>
                  {resource.source && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      resource.source === "ai" 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                        : resource.source === "manual"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {resource.source === "ai" ? "🤖 AI" : 
                       resource.source === "manual" ? "👤 手動" : "🔍"}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.url, "_blank")}
                      className="text-xs h-8 px-3 whitespace-nowrap"
                    >
                      開啟
                    </Button>
                    {isCustomResource && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomResource(resource.url)}
                        className="text-[9px] h-4 px-3 text-destructive hover:text-destructive whitespace-nowrap"
                      >
                        刪除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 桌面版：保持原有佈局 */}
                <div className="hidden sm:flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <span className="text-xl">{getTypeIcon(resource.type)}</span>
                      <span className="text-xs px-2 py-1 bg-background rounded-full text-muted-foreground whitespace-nowrap">
                        {getTypeText(resource.type)}
                      </span>
                      {resource.source && (
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          resource.source === "ai" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                            : resource.source === "manual"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {resource.source === "ai" ? "🤖 AI推薦" : 
                           resource.source === "manual" ? "👤 手動新增" : "🔍 關鍵字"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-foreground break-words mb-1">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words">{resource.description}</p>
                      
                      {/* 額外資訊標籤 */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {resource.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            resource.difficulty === "beginner" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : resource.difficulty === "intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}>
                            {resource.difficulty === "beginner" ? "🟢 初級" : 
                             resource.difficulty === "intermediate" ? "🟡 中級" : "🔴 高級"}
                          </span>
                        )}
                        {resource.duration && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full whitespace-nowrap">
                            ⏱️ {resource.duration}
                          </span>
                        )}
                        {resource.language && (
                          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full whitespace-nowrap">
                            🌐 {resource.language}
                          </span>
                        )}
                        {resource.score && (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full whitespace-nowrap">
                            ⭐ {(resource.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.url, "_blank")}
                      className="text-xs"
                    >
                      開啟連結
                    </Button>
                    {isCustomResource && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomResource(resource.url)}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        刪除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 標題和描述（僅手機版顯示） */}
                <div className="flex-1 min-w-0 sm:hidden">
                  <h3 className="font-medium text-sm text-foreground break-words mb-1">{resource.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2 break-words">{resource.description}</p>
                  
                  {/* 額外資訊標籤（僅手機版顯示） */}
                  <div className="flex flex-wrap gap-1">
                    {resource.difficulty && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                        resource.difficulty === "beginner" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : resource.difficulty === "intermediate"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {resource.difficulty === "beginner" ? "🟢 初級" : 
                         resource.difficulty === "intermediate" ? "🟡 中級" : "🔴 高級"}
                      </span>
                    )}
                    {resource.duration && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full whitespace-nowrap">
                        ⏱️ {resource.duration}
                      </span>
                    )}
                    {resource.language && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full whitespace-nowrap">
                        🌐 {resource.language}
                      </span>
                    )}
                    {resource.score && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full whitespace-nowrap">
                        ⭐ {(resource.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-4 sm:py-6">
          <p className="text-sm sm:text-base text-muted-foreground mb-2">找不到相關學習資源</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground px-2">嘗試使用不同的關鍵字搜索或拖曳連結新增資源</p>
        </div>
      )}

      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center break-words px-2">
          💡 提示：點擊「自訂搜索」可以搜索特定主題的學習資源，或直接拖曳網址到此區域新增
        </p>
      </div>
    </Card>
  )
}
