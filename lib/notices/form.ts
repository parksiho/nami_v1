export type NoticeFormValues = {
  title: string
  body: string
}

export function parseNoticeFormData(
  formData: FormData,
): { data: NoticeFormValues } | { error: 'required' } {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!title || !body) return { error: 'required' }
  return { data: { title, body } }
}
