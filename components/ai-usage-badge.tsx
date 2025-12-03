"use client"

import { useMembership } from "@/contexts/membership-context"
import { useRouter } from "next/navigation"

export function AIUsageBadge() {
    const { membershipStatus, loading } = useMembership()
    const router = useRouter()

    if (loading || !membershipStatus) return null

    const { aiUsage } = membershipStatus

    // Pro 用戶顯示
    if (aiUsage.isUnlimited) {
        return (
            <div
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-xs cursor-pointer hover:bg-purple-500/20 transition-colors"
                onClick={() => router.push('/pricing')}
            >
                <span>👑</span>
                <span className="font-medium">Pro 會員</span>
            </div>
        )
    }

    const percentage = aiUsage.limit ? (aiUsage.used / aiUsage.limit) * 100 : 0
    const isLow = percentage >= 80
    const isExhausted = (aiUsage.remaining || 0) <= 0

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors border ${isExhausted
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                    : isLow
                        ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                }`}
            onClick={() => router.push('/pricing')}
        >
            <span>🤖 AI 配額</span>
            <span className="font-medium">
                {aiUsage.remaining} / {aiUsage.limit}
            </span>
            {isLow && !isExhausted && <span className="hidden sm:inline opacity-75">(即將用完)</span>}
            {isExhausted && <span className="hidden sm:inline font-bold">(已用完)</span>}
        </div>
    )
}
