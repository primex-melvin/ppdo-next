"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Activity, Remark } from "@/lib/mock-data"
import { Clock, MessageSquare, MoreHorizontal, Reply, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export function ActivityTimeline({
  activities,
  onImageClick,
  inspectionId,
}: { activities: Activity[]; onImageClick: (images: string[], index: number) => void; inspectionId: string }) {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black text-foreground tracking-tight italic">Activity Timeline</h2>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded">
          {activities.length} entries
        </div>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <Link key={activity.id} href={`/activities/${activity.id}?from=${inspectionId}`}>
            <ActivityCard activity={activity} onImageClick={onImageClick} />
          </Link>
        ))}
      </div>
    </div>
  )
}

function ActivityCard({
  activity,
  onImageClick,
}: { activity: Activity; onImageClick: (images: string[], index: number) => void }) {
  const [status, setStatus] = useState(activity.status)
  const [showRemarks, setShowRemarks] = useState(false)

  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/20 transition-all duration-300">
      <CardHeader className="pb-3 border-b border-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-background ring-offset-2 ring-offset-muted/20 shadow-sm">
              <AvatarImage src={activity.postedBy.avatar || "/placeholder.svg"} alt={activity.postedBy.name} />
              <AvatarFallback>{activity.postedBy.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm text-foreground">{activity.postedBy.name}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                {activity.postedBy.role}
              </p>
            </div>
          </div>

          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger
              className={cn(
                "w-[160px] h-8 text-[10px] font-black uppercase tracking-widest",
                status === "verified"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified" className="text-[10px] font-black uppercase">
                Verified
              </SelectItem>
              <SelectItem value="pending" className="text-[10px] font-black uppercase">
                Pending Verification
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Image Grid */}
        {activity.images.length > 0 && (
          <div className="p-4 bg-muted/20">
            <ImageGrid images={activity.images} onImageClick={(idx) => onImageClick(activity.images, idx)} />
          </div>
        )}

        <div className="p-4 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">{activity.description}</p>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <time dateTime={activity.date}>{new Date(activity.date).toLocaleString()}</time>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-[10px] font-black uppercase gap-1.5 px-3 rounded-full",
                  showRemarks ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
                onClick={() => setShowRemarks(!showRemarks)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Remarks ({activity.remarks?.length || 0})
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showRemarks && (
            <div className="space-y-6 pt-4 border-t border-muted/50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                {activity.remarks?.map((remark) => (
                  <RemarkTree key={remark.id} remark={remark} depth={0} />
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Add a remark..." className="min-h-[40px] text-xs resize-none" />
                <Button size="sm" className="h-auto font-black uppercase text-[10px]">
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RemarkTree({ remark, depth }: { remark: Remark; depth: number }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const hasReplies = remark.replies && remark.replies.length > 0

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-4 pl-4 border-l border-primary/20")}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-background ring-offset-1 ring-primary/10">
          <AvatarImage src={remark.author.avatar || "/placeholder.svg"} alt={remark.author.name} />
          <AvatarFallback>{remark.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-2xl p-3 border border-border/40">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="font-bold text-xs text-foreground tracking-tight">{remark.author.name}</p>
              <time className="text-[10px] text-muted-foreground font-medium">
                {new Date(remark.timestamp).toLocaleDateString()}
              </time>
            </div>
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-2 italic">
              {remark.author.role}
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">{remark.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 ml-1">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>

            {hasReplies && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isExpanded ? "Hide" : "Show"} {remark.replies!.length} Replies
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-1">
              <Textarea placeholder="Write a reply..." className="min-h-[40px] text-xs resize-none" />
              <Button size="sm" className="h-auto font-black uppercase text-[10px]">
                Send
              </Button>
            </div>
          )}
        </div>
      </div>

      {hasReplies && isExpanded && (
        <div className="space-y-4">
          {remark.replies!.map((reply) => (
            <RemarkTree key={reply.id} remark={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function ImageGrid({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  const imageCount = images.length

  if (imageCount === 1) {
    return (
      <div
        className="rounded-xl overflow-hidden bg-muted group cursor-pointer relative"
        onClick={() => onImageClick(0)}
      >
        <img
          src={images[0] || "/placeholder.svg"}
          alt="Activity image"
          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <MoreHorizontal className="text-white h-8 w-8" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-2", imageCount === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {images.slice(0, 3).map((img, idx) => (
        <div
          key={idx}
          className={cn(
            "relative rounded-xl overflow-hidden bg-muted group cursor-pointer aspect-square",
            imageCount === 3 && idx === 0 ? "col-span-2 row-span-2 aspect-auto h-full" : "",
          )}
          onClick={() => onImageClick(idx)}
        >
          <img
            src={img || "/placeholder.svg"}
            alt={`Activity image ${idx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {idx === 2 && images.length > 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-xl font-black">+{images.length - 3}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
