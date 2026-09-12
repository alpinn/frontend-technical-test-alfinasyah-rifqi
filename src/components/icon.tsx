import type { LucideIcon, LucideProps } from 'lucide-react'

type IconProps = LucideProps & {
  icon: LucideIcon
}

export function Icon({ icon: Glyph, strokeWidth = 1.7, ...props }: IconProps) {
  return <Glyph strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...props} />
}
