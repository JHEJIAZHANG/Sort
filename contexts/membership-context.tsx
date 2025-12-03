"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { ApiService } from "@/services/apiService"

interface MembershipStatus {
    tier: 'free' | 'basic' | 'pro'
    tierDisplay: string
    aiUsage: {
        used: number
        limit: number | null
        remaining: number | null
        isUnlimited: boolean
        yearMonth: string
    }
    subscription: {
        hasActive: boolean
        planName: string | null
        endAt: string | null
    } | null
}

interface MembershipContextType {
    membershipStatus: MembershipStatus | null
    loading: boolean
    error: string | null
    refreshMembership: () => Promise<void>
    checkQuota: () => boolean
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined)

export function MembershipProvider({ children }: { children: React.ReactNode }) {
    const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refreshMembership = useCallback(async () => {
        try {
            setLoading(true)
            const lineUserId = ApiService.bootstrapLineUserId()
            if (!lineUserId) {
                setLoading(false)
                return
            }

            const response = await fetch(`${ApiService.backendOrigin}/api/v2/me/membership`, {
                headers: {
                    'X-LINE-UserId': lineUserId
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch membership status')
            }

            const data = await response.json()
            setMembershipStatus(data)
            setError(null)
        } catch (err: any) {
            console.error('Error fetching membership:', err)
            setError(err.message || '無法獲取會員狀態')
        } finally {
            setLoading(false)
        }
    }, [])

    // 初始加載
    useEffect(() => {
        refreshMembership()
    }, [refreshMembership])

    // 檢查配額是否足夠
    const checkQuota = useCallback(() => {
        if (!membershipStatus) return false
        if (membershipStatus.aiUsage.isUnlimited) return true
        return (membershipStatus.aiUsage.remaining || 0) > 0
    }, [membershipStatus])

    return (
        <MembershipContext.Provider value={{ membershipStatus, loading, error, refreshMembership, checkQuota }}>
            {children}
        </MembershipContext.Provider>
    )
}

export function useMembership() {
    const context = useContext(MembershipContext)
    if (context === undefined) {
        throw new Error("useMembership must be used within a MembershipProvider")
    }
    return context
}
