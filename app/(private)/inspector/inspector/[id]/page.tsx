import { notFound } from "next/navigation"
import { MOCK_INSPECTOR_DATA } from "@/lib/mock-data"
import { InspectorDetailContent } from "@/components/inspector-detail-content"
import { Suspense } from "react"

export default function InspectorDetailPage({ params }: { params: { id: string } }) {
  const inspection = MOCK_INSPECTOR_DATA[params.id]

  if (!inspection) {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <InspectorDetailContent inspection={inspection} />
    </Suspense>
  )
}
