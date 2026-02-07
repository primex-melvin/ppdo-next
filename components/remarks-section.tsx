"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Remark } from "@/lib/mock-data"
import { MessageSquare, Reply } from "lucide-react"
import { cn } from "@/lib/utils"

// This file is no longer used as remarks are now integrated directly into activities
// Keeping it for potential future reference or until fully removed from project

export function RemarksSection({ remarks, inspectionId }: { remarks: Remark[]; inspectionId: string }) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Remarks ({remarks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {remarks.map((remark) => (
            <RemarkTree key={remark.id} remark={remark} depth={0} />
          ))}

          {remarks.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No remarks yet. Be the first to comment.</p>
          )}
        </div>

        {/* Add New Remark */}
        <div className="pt-4 border-t">
          {!showReplyForm ? (
            <Button onClick={() => setShowReplyForm(true)} variant="outline" className="w-full" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Remark
            </Button>
          ) : (
            <RemarkForm onCancel={() => setShowReplyForm(false)} onSubmit={() => setShowReplyForm(false)} />
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
    <div className={cn("space-y-2", depth > 0 && "ml-6 pl-3 border-l-2 border-gray-200")}>
      <div className="flex gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={remark.author.avatar || "/placeholder.svg"} alt={remark.author.name} />
          <AvatarFallback>{remark.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="font-semibold text-xs text-gray-900">{remark.author.name}</p>
              <time className="text-[10px] text-gray-500 whitespace-nowrap">
                {new Date(remark.timestamp).toLocaleDateString()}
              </time>
            </div>
            <p className="text-xs text-gray-500 mb-2">{remark.author.role}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{remark.content}</p>
          </div>

          <div className="flex items-center gap-3 mt-1.5 ml-1">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>

            {hasReplies && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isExpanded ? "Hide" : "Show"} {remark.replies!.length}{" "}
                {remark.replies!.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-3">
              <RemarkForm onCancel={() => setShowReplyForm(false)} onSubmit={() => setShowReplyForm(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Recursive Replies */}
      {hasReplies && isExpanded && (
        <div className="space-y-2 mt-2">
          {remark.replies!.map((reply) => (
            <RemarkTree key={reply.id} remark={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function RemarkForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  const [content, setContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      // In a real app, this would make an API call
      console.log("[v0] New remark submitted:", content)
      setContent("")
      onSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Add your remark..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] text-sm"
        required
      />
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!content.trim()}>
          Submit
        </Button>
      </div>
    </form>
  )
}
