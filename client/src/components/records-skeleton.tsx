import { Skeleton } from "@/components/ui/skeleton";

export function RecordsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-24 bg-blue-50" />
                            <Skeleton className="h-7 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>

                    <div className="space-y-3 mb-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
