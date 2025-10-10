"use client"

import { Button } from "@/components/ui/button"
import { PencilIcon } from "@/components/icons"

interface AssignmentFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: {
    all: number
    pending: number
    completed: number
    overdue: number
  }
  onEdit?: () => void
}

export function AssignmentFilters({ activeFilter, onFilterChange, counts, onEdit }: AssignmentFiltersProps) {
  const filters = [
    { id: "all", label: "全部", count: counts.all },
    { id: "pending", label: "進行中", count: counts.pending },
    { id: "overdue", label: "已逾期", count: counts.overdue },
    { id: "completed", label: "已完成", count: counts.completed },
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
