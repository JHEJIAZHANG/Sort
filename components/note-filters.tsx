"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon } from "@/components/icons"
import type { Course } from "@/types/course"

interface NoteFiltersProps {
  courses: Course[]
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: Record<string, number>
  sortBy: string
  onSortChange: (sort: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function NoteFilters({
  courses,
  activeFilter,
  onFilterChange,
  counts,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: NoteFiltersProps) {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isComposing, setIsComposing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        onSearchChange(value)
      }, 300)
    },
    [onSearchChange],
  )

  useEffect(() => {
    if (!isComposing && inputValue !== searchQuery) {
      debouncedSearch(inputValue)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [inputValue, isComposing, debouncedSearch, searchQuery])

  useEffect(() => {
    if (searchQuery !== inputValue) {
      setInputValue(searchQuery)
    }
  }, [searchQuery])

  const filters = [
    { id: "all", label: "全部", count: counts.all || 0 },
    ...courses.map((course) => ({
      id: course.id,
      label: course.name,
      count: counts[course.id] || 0,
    })),
  ]

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className="whitespace-nowrap"
          >
            {filter.label} ({filter.count})
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋筆記..."
            value={inputValue}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-32 bg-white border-gray-300">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">修改日期</SelectItem>
            <SelectItem value="createdAt">建立日期</SelectItem>
            <SelectItem value="title">名稱</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
