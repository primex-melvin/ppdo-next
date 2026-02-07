import { MOCK_INSPECTOR_DATA } from "@/lib/mock-data"
import { ActivityDetailView } from "@/components/activity-detail-view"
import { notFound } from "next/navigation"

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ activityId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { activityId } = await params
  const { from } = await searchParams

  // Find the activity across all inspections
  let activity = null
  let inspection = null

  for (const insp of Object.values(MOCK_INSPECTOR_DATA)) {
    const found = insp.activities.find((act) => act.id === activityId)
    if (found) {
      activity = found
      inspection = insp
      break
    }
  }

  if (!activity || !inspection) {
    notFound()
  }

  return <ActivityDetailView activity={activity} inspection={inspection} fromInspectionId={from} />
}
