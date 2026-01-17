export default function Loading() {
    return (
        <div className="flex-1 p-6 space-y-6">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>

            {/* Content cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                        <div className="h-2 w-full bg-muted animate-pulse rounded" />
                        <div className="h-2 w-2/3 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* List/Table skeleton */}
            <div className="border rounded-xl p-6 space-y-6 mt-8">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                            <div className="space-y-1">
                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
