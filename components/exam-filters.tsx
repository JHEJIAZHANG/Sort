"use client"

import { Button } from "@/components/ui/button"
import { PencilIcon } from "@/components/icons"

interface ExamFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: {
    all: number
    upcoming: number
    completed: number
    scheduled: number
    overdue: number
  }
  onEdit?: () => void
}

export function ExamFilters({ activeFilter, onFilterChange, counts, onEdit }: ExamFiltersProps) {
  const filters = [
    { id: "all", label: "全部", count: counts.all },
    { id: "scheduled", label: "已排程", count: counts.scheduled },
    { id: "upcoming", label: "即將來臨", count: counts.upcoming },
    { id: "overdue", label: "已逾期", count: counts.overdue },
    { id: "completed", label: "已結束", count: counts.completed },
  ]

  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
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
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-shrink-0 bg-transparent">
          <PencilIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
