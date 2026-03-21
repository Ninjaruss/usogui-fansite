// client/src/app/guides/[id]/edit/page.tsx
import { Metadata } from 'next'
import EditGuidePageContent from './EditGuidePageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Edit Guide #${id}`,
    description: 'Edit and resubmit your guide for review.',
  }
}

export default async function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditGuidePageContent id={Number(id)} />
}
