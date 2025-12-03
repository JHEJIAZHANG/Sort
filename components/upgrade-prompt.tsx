"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface UpgradePromptProps {
    open: boolean
    onClose: () => void
    quotaDetails?: {
        tier: string
        used: number
        limit: number
    }
}

export function UpgradePrompt({ open, onClose, quotaDetails }: UpgradePromptProps) {
    const router = useRouter()

    const handleUpgrade = () => {
        onClose()
        router.push('/pricing')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <span>⚠️</span> AI 使用次數已達上限
                    </DialogTitle>
                    <DialogDescription>
                        您的會員方案配額已用完，升級以繼續使用強大的 AI 功能。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {quotaDetails && (
                        <div className="bg-muted p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">本月使用統計：</p>
                            <div className="flex justify-between items-center">
                                <span>已使用次數</span>
                                <span className="font-bold">{quotaDetails.used} / {quotaDetails.limit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                                <div className="bg-amber-600 h-2.5 rounded-full w-full"></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                        <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">升級至 Pro 方案解鎖：</h3>
                        <ul className="text-sm space-y-2 text-purple-800 dark:text-purple-200">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✅</span> 無限次 AI 學習資源推薦
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✅</span> 無限次 OCR 課表辨識
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✅</span> 優先獲得新功能體驗
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                            立即升級
                        </Button>
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            稍後再說
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
