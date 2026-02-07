"use client"

import type { Inspection } from "@/lib/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function SuggestedActivities({
  currentActivityId,
  inspection,
}: {
  currentActivityId: string
  inspection: Inspection
}) {
  // Filter out current activity and get last 6
  const suggested = inspection.activities.filter((act) => act.id !== currentActivityId).slice(0, 6)

  if (suggested.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-foreground tracking-tight">More from this Inspection</h2>
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          {suggested.length} related activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggested.map((activity) => (
          <Link key={activity.id} href={`/activities/${activity.id}?from=${inspection.id}`}>
            <Card className="overflow-hidden hover:border-primary/40 transition-all duration-300 h-full cursor-pointer">
              {activity.images.length > 0 && (
                <div className="relative h-40 bg-muted overflow-hidden">
                  <img
                    src={activity.images[0] || "/placeholder.svg"}
                    alt="Activity thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {activity.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold">
                      +{activity.images.length - 1}
                    </div>
                  )}
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={activity.postedBy.avatar || "/placeholder.svg"} alt={activity.postedBy.name} />
                      <AvatarFallback>{activity.postedBy.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{activity.postedBy.name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase truncate">
                        {activity.postedBy.role}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] font-black uppercase whitespace-nowrap",
                      activity.status === "verified"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100",
                    )}
                  >
                    {activity.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-4 space-y-2">
                <p className="text-xs text-foreground/80 line-clamp-2 font-medium">{activity.description}</p>

                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {new Date(activity.date).toLocaleDateString()}
                </p>

                {activity.remarks && activity.remarks.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider pt-1">
                    💬 {activity.remarks.length} Remark{activity.remarks.length !== 1 ? "s" : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
