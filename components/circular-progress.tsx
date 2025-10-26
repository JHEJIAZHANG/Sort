"use client"

import { useEffect, useState } from "react"

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  submittedCount?: number
  totalCount?: number
}

export function CircularProgress({
  percentage,
  size = 200,
  strokeWidth = 20,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)

  // 淺色背景環比較細
  const thinStrokeWidth = strokeWidth - 10
  // 深色進度環比較粗
  const thickStrokeWidth = strokeWidth

  // 計算半徑 - 使用粗的進度環來計算
  const progressRadius = (size - thickStrokeWidth) / 2
  const backgroundRadius = (size - thinStrokeWidth) / 2
  const innerRadius = progressRadius - thickStrokeWidth - 4

  const circumference = progressRadius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  // 計算小圓點的位置 - 在進度環的末端
  const angle = (progress / 100) * 360 - 90 // -90 因為從頂部開始
  const dotX = size / 2 + progressRadius * Math.cos((angle * Math.PI) / 180)
  const dotY = size / 2 + progressRadius * Math.sin((angle * Math.PI) / 180)

  useEffect(() => {
    // 動畫效果：從 0 到目標百分比
    const timer = setTimeout(() => {
      setProgress(percentage)
    }, 100)

    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 內圈填滿的圓形 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="#ff9100"
        />

        {/* 外圈背景圓環（淺色、較細） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={backgroundRadius}
          stroke="#fed7aa"
          strokeWidth={thinStrokeWidth}
          fill="none"
        />

        {/* 外圈進度圓環（深橘色、較粗） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={progressRadius}
          stroke="#ff9100"
          strokeWidth={thickStrokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />

        {/* 進度末端的小圓點 */}
        {progress > 0 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={6}
            fill="white"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>

      {/* 中間文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
