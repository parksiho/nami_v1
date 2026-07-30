import { createClient } from '@/lib/supabase/server'

export type ChangeLogInput = {
  actorId: string
  action: string
  targetType: string
  targetId: string | null
  summary: string
}

export async function writeChangeLog(input: ChangeLogInput): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('change_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    summary: input.summary,
  })

  if (error) {
    throw new Error(`Failed to write change log: ${error.message}`)
  }
}
