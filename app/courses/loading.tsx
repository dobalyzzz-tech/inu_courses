export default function CoursesLoading() {
  return (
    <div className="min-h-screen pb-20 w-full relative">
      <div className="max-w-7xl mx-auto px-8 pt-40 pb-10">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-4">
          <div className="h-9 bg-zinc-200 rounded-lg w-64 animate-pulse"></div>
          <div className="h-5 bg-zinc-200 rounded-md w-24 animate-pulse"></div>
        </div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 24 }).map((_, cardIndex) => (
            <div 
              key={cardIndex} 
              className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm h-[320px] flex flex-col relative"
            >
              {/* Shimmer Effect Overlay */}
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent z-10"></div>
              
              <div className="p-5 flex-1 flex flex-col bg-zinc-50/30">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="space-y-2 w-full">
                    <div className="h-5 bg-zinc-200 rounded-md w-full animate-pulse"></div>
                    <div className="h-5 bg-zinc-200 rounded-md w-2/3 animate-pulse"></div>
                  </div>
                  <div className="h-7 bg-zinc-200 rounded-lg w-14 shrink-0 animate-pulse"></div>
                </div>
                
                <div className="space-y-3 mt-auto w-full">
                  {[1, 2, 3, 4, 5].map((line) => (
                    <div key={line} className="flex justify-between items-center py-1">
                      <div className="h-3 bg-zinc-200 rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-zinc-200 rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 pt-0">
                <div className="w-full h-12 bg-zinc-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
