import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6 lg:space-y-0 mb-6 max-w-full overflow-hidden">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                {/* Live Stats Skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>

                {/* Scroll Summary Skeleton */}
                <Card>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 w-64 flex-shrink-0" />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Schedule Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column (Calendar) */}
            <div className="lg:col-span-3 w-full">
                <Card className="h-full min-h-[500px]">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-48" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-4 mt-4">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
