import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingStates() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="diamond-card">
                        <CardContent className="p-6">
                            <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-6 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart Skeletons */}
            <div className="grid md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="diamond-card">
                        <CardContent className="p-6">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64 mb-6" />
                            <Skeleton className="h-[250px] w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function RecordCardSkeleton() {
    return (
        <Card className="diamond-card">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {[...Array(rows)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    );
}
