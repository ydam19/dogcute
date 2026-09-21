import { Species } from '../../types/pet'

interface PawMarkProps {
  species: Species
  size?: number
  color?: string
  opacity?: number
}

/** 강아지/고양이 발바닥 SVG */
export function PawMark({ species, size = 80, color = '#1a4a8a', opacity = 0.15 }: PawMarkProps) {
  if (species === 'dog') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill={color}
        opacity={opacity}
        aria-label="강아지 발바닥"
      >
        {/* 메인 패드 */}
        <ellipse cx="50" cy="65" rx="22" ry="18" />
        {/* 발가락 패드 4개 */}
        <ellipse cx="28" cy="45" rx="9" ry="11" />
        <ellipse cx="42" cy="38" rx="9" ry="11" />
        <ellipse cx="58" cy="38" rx="9" ry="11" />
        <ellipse cx="72" cy="45" rx="9" ry="11" />
      </svg>
    )
  }

  // 고양이 발바닥 (발가락 3개 + 날카로운 형태)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      opacity={opacity}
      aria-label="고양이 발바닥"
    >
      {/* 메인 패드 (하트형) */}
      <path d="M50 80 C30 70 20 55 28 43 C34 35 44 36 50 43 C56 36 66 35 72 43 C80 55 70 70 50 80Z" />
      {/* 발가락 패드 3개 */}
      <ellipse cx="33" cy="34" rx="9" ry="10" transform="rotate(-15 33 34)" />
      <ellipse cx="50" cy="28" rx="9" ry="10" />
      <ellipse cx="67" cy="34" rx="9" ry="10" transform="rotate(15 67 34)" />
    </svg>
  )
}
