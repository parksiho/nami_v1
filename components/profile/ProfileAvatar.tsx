import { profileInitials } from '@/lib/profile/avatar'

type Props = {
  name: string | null | undefined
  avatarUrl: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = 'sm',
  className,
}: Props) {
  const classes = [
    'profile-avatar',
    `profile-avatar--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-hidden={!avatarUrl}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" />
      ) : (
        <span className="profile-avatar__fallback">{profileInitials(name)}</span>
      )}
    </span>
  )
}
