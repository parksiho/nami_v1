type Props = {
  message: string
  variant: 'error' | 'success'
}

export function AuthAlert({ message, variant }: Props) {
  return <p className={variant === 'error' ? 'auth-error' : 'auth-success'}>{message}</p>
}
