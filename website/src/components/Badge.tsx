type BadgeProps = {
  text: string
  vertical?: 'baseline' | 'bottom' | 'middle' | 'sub' | 'super' | 'text-bottom' | 'text-top' | 'top'
}

export default function Badge({ text, vertical = 'middle' }: BadgeProps) {
  return (
    <span className="surgio-badge" style={{ verticalAlign: vertical }}>
      {text}
    </span>
  )
}
