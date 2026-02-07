"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Activity, Inspection } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuggestedActivities } from "@/components/suggested-activities"
import { ImageLightbox } from "@/components/image-lightbox"
import {
  ArrowLeft,
  Share2,
  Check,
  X,
  Edit2,
  Clock,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Reply,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { VisibilityType } from "@/lib/mock-data"

export function ActivityDetailView({
  activity,
  inspection,
  fromInspectionId,
}: {
  activity: Activity
  inspection: Inspection
  fromInspectionId?: string
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState(activity.description)
  const [editedVisibility, setEditedVisibility] = useState<VisibilityType>(activity.visibility)
  const [editedStatus, setEditedStatus] = useState(activity.status)
  const [shareUrl, setShareUrl] = useState("")
  const [shareCopied, setShareCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showRemarks, setShowRemarks] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/activities/${activity.id}`
    setShareUrl(url)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleSave = () => {
    // In a real app, this would update the server
    setIsEditing(false)
  }

  const backUrl = fromInspectionId ? `/inspector/${fromInspectionId}` : "/"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-muted">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backUrl)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className={cn("gap-2 transition-all", shareCopied && "bg-emerald-50 border-emerald-200 text-emerald-700")}
            >
              <Share2 className="w-4 h-4" />
              {shareCopied ? "Link Copied!" : "Share"}
            </Button>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedDescription(activity.description)
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            {/* Activity Card */}
            <Card className="overflow-hidden border-border/60">
              <CardHeader className="pb-4 border-b border-muted/50 bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 ring-2 ring-background ring-offset-2 ring-offset-muted/20 shadow-sm">
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

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <Select value={editedStatus} onValueChange={(val) => setEditedStatus(val as "pending" | "verified")} disabled={!isEditing}>
                          <SelectTrigger
                            className={cn(
                              "w-[140px] h-8 text-[10px] font-black uppercase tracking-widest",
                              editedStatus === "verified"
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
                              Pending
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={editedVisibility} onValueChange={(val: any) => setEditedVisibility(val)}>
                          <SelectTrigger className="w-[140px] h-8 text-[10px] font-black uppercase tracking-widest">
                            <Eye className="w-3 h-3" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public" className="text-[10px] font-black uppercase">
                              Public
                            </SelectItem>
                            <SelectItem value="private" className="text-[10px] font-black uppercase">
                              Private
                            </SelectItem>
                            <SelectItem value="allowed-accounts" className="text-[10px] font-black uppercase">
                              Allowed Only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Images */}
                {activity.images.length > 0 && (
                  <div className="p-4 bg-muted/20 border-b border-muted/50">
                    <ImageGrid images={activity.images} onImageClick={(idx) => setLightboxIndex(idx)} />
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Description */}
                  {isEditing ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="min-h-[120px] text-sm resize-none"
                      placeholder="Edit activity description..."
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-foreground/90 leading-relaxed font-medium">{editedDescription}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(activity.date).toLocaleString()}
                    </div>
                    {activity.editedBy && (
                      <div>
                        Edited by {activity.editedBy.name} on {new Date(activity.editedBy.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Remarks Section */}
                  <div className="space-y-4 border-t pt-6">
                    <button
                      onClick={() => setShowRemarks(!showRemarks)}
                      className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wide hover:text-primary/80 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Remarks ({activity.remarks?.length || 0})
                      {showRemarks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showRemarks && (
                      <div className="space-y-6 mt-4 pl-4 border-l-2 border-primary/20">
                        {activity.remarks?.map((remark) => (
                          <div key={remark.id} className="space-y-3">
                            <div className="flex gap-3">
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage
                                  src={remark.author.avatar || "/placeholder.svg"}
                                  alt={remark.author.name}
                                />
                                <AvatarFallback>{remark.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                                  <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <p className="font-bold text-xs text-foreground">{remark.author.name}</p>
                                    <time className="text-[10px] text-muted-foreground">
                                      {new Date(remark.timestamp).toLocaleDateString()}
                                    </time>
                                  </div>
                                  <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-2 italic">
                                    {remark.author.role}
                                  </p>
                                  <p className="text-xs text-foreground/80">{remark.content}</p>
                                </div>
                                <button className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary mt-2 flex items-center gap-1 transition-colors">
                                  <Reply className="w-3 h-3" />
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Related Metadata */}
          <div className="col-span-1 sticky top-24 h-fit space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-muted/50">
                <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Inspection Info</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Project</p>
                  <p className="font-medium text-foreground">{inspection.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Location</p>
                  <p className="font-medium text-foreground">{inspection.location}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Recorded</p>
                  <p className="font-medium text-foreground">
                    {new Date(inspection.dateRecorded).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suggested Activities */}
        <div className="mt-16">
          <SuggestedActivities currentActivityId={activity.id} inspection={inspection} />
        </div>
      </div>

      <ImageLightbox
        images={activity.images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
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
      </div>
    )
  }

  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="rounded-xl overflow-hidden bg-muted group cursor-pointer relative"
            onClick={() => onImageClick(idx)}
          >
            <img
              src={img || "/placeholder.svg"}
              alt={`Activity image ${idx + 1}`}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.slice(0, 3).map((img, idx) => (
        <div
          key={idx}
          className={cn(
            "rounded-xl overflow-hidden bg-muted group cursor-pointer relative",
            idx === 0 ? "col-span-2 row-span-2" : "",
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
              <span className="text-white text-lg font-black">+{images.length - 3}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
