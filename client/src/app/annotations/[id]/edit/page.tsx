import { Metadata } from 'next'
import EditAnnotationPageContent from './EditAnnotationPageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Edit Annotation #${id}`,
    description: 'Edit and resubmit your annotation for review.',
  }
}

export default async function EditAnnotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditAnnotationPageContent id={Number(id)} />
}
