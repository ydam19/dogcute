/**
 * 길로셰(Guilloche) 보안 패턴 배경
 * 실제 신분증의 미세 기하 무늬를 SVG pattern으로 구현
 */
export function GuillocheBg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        {/* 가로 사인파 — 빽빽한 파도 줄 */}
        <pattern id="gw-h" x="0" y="0" width="80" height="9" patternUnits="userSpaceOnUse">
          <path
            d="M0,4.5 C13.3,0 26.7,9 40,4.5 C53.3,0 66.7,9 80,4.5"
            stroke="rgba(196,96,122,0.13)"
            strokeWidth="0.55"
            fill="none"
          />
        </pattern>

        {/* 세로 사인파 — 교차 적용으로 격자 느낌 */}
        <pattern id="gw-v" x="0" y="0" width="9" height="80" patternUnits="userSpaceOnUse">
          <path
            d="M4.5,0 C9,13.3 0,26.7 4.5,40 C9,53.3 0,66.7 4.5,80"
            stroke="rgba(196,96,122,0.07)"
            strokeWidth="0.55"
            fill="none"
          />
        </pattern>

        {/* 대각선 미세 선 */}
        <pattern id="gw-d" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <line x1="0" y1="14" x2="14" y2="0" stroke="rgba(196,96,122,0.07)" strokeWidth="0.4" />
        </pattern>

        {/* 큰 동심원호 — 모서리 장식 */}
        <pattern id="gw-arc" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="30" stroke="rgba(196,96,122,0.06)" strokeWidth="0.5" fill="none" />
          <circle cx="0" cy="0" r="50" stroke="rgba(196,96,122,0.05)" strokeWidth="0.5" fill="none" />
          <circle cx="0" cy="0" r="70" stroke="rgba(196,96,122,0.04)" strokeWidth="0.5" fill="none" />
          <circle cx="120" cy="120" r="30" stroke="rgba(196,96,122,0.06)" strokeWidth="0.5" fill="none" />
          <circle cx="120" cy="120" r="50" stroke="rgba(196,96,122,0.05)" strokeWidth="0.5" fill="none" />
          <circle cx="120" cy="120" r="70" stroke="rgba(196,96,122,0.04)" strokeWidth="0.5" fill="none" />
        </pattern>

        {/* 발바닥 반복 패턴 — 메인 패드 + 4개 발가락 패드 */}
        <pattern id="gw-paw" x="0" y="0" width="58" height="58" patternUnits="userSpaceOnUse">
          {/* 메인 패드 */}
          <ellipse cx="29" cy="33" rx="7" ry="5.5" fill="rgba(196,96,122,0.10)" />
          {/* 발가락 패드 4개 */}
          <ellipse cx="18" cy="24" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.10)" />
          <ellipse cx="24" cy="20" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.10)" />
          <ellipse cx="31" cy="19" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.10)" />
          <ellipse cx="37.5" cy="22" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.10)" />
        </pattern>

        {/* 오프셋 발바닥 — 격자 느낌 방지용 반 칸 이동 */}
        <pattern id="gw-paw2" x="29" y="29" width="58" height="58" patternUnits="userSpaceOnUse">
          <ellipse cx="29" cy="33" rx="7" ry="5.5" fill="rgba(196,96,122,0.07)" />
          <ellipse cx="18" cy="24" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.07)" />
          <ellipse cx="24" cy="20" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.07)" />
          <ellipse cx="31" cy="19" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.07)" />
          <ellipse cx="37.5" cy="22" rx="3.2" ry="2.6" fill="rgba(196,96,122,0.07)" />
        </pattern>
      </defs>

      {/* 레이어 순서: 동심원호 → 가로파 → 세로파 → 대각선 → 발바닥 */}
      <rect width="100%" height="100%" fill="url(#gw-arc)" />
      <rect width="100%" height="100%" fill="url(#gw-h)" />
      <rect width="100%" height="100%" fill="url(#gw-v)" />
      <rect width="100%" height="100%" fill="url(#gw-d)" />
      <rect width="100%" height="100%" fill="url(#gw-paw)" />
      <rect width="100%" height="100%" fill="url(#gw-paw2)" />
    </svg>
  )
}
