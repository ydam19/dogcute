import html2canvas from 'html2canvas'

export type SaveRatio = 'feed' | 'story'

const RATIO_CONFIG = {
  feed: {
    width: 1080,
    height: 1350,   // 4:5
    marginX: 60,
    suffix: '피드',
  },
  story: {
    width: 1080,
    height: 1920,   // 9:16
    marginX: 80,
    suffix: '스토리',
  },
} as const

/**
 * 카드 DOM 요소를 인스타그램 최적화 PNG로 저장
 * ratio: 'feed'  → 1080×1350 (4:5 피드)
 * ratio: 'story' → 1080×1920 (9:16 스토리)
 */
export async function saveCardAsImage(
  cardElement: HTMLElement,
  petName: string,
  ratio: SaveRatio,
): Promise<void> {
  const cfg = RATIO_CONFIG[ratio]
  if (!cfg) throw new Error(`saveCardAsImage: 알 수 없는 ratio 값 "${ratio}"`)
  const { width: OUT_W, height: OUT_H, marginX: MARGIN_X, suffix } = cfg

  // Gaegu 폰트가 로드될 때까지 대기 (워터마크에 사용)
  await document.fonts.load('700 28px "Gaegu"').catch(() => {})

  // 1) 카드를 3× 스케일로 고해상도 캡처
  const scale = 3
  const raw = await html2canvas(cardElement, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  })

  // 2) 출력 캔버스 생성
  const out = document.createElement('canvas')
  out.width = OUT_W
  out.height = OUT_H
  const ctx = out.getContext('2d')!

  // ── 배경 그라디언트 (파스텔 핑크 계열) ──
  const bg = ctx.createLinearGradient(0, 0, OUT_W, OUT_H)
  bg.addColorStop(0,   '#5C1530')
  bg.addColorStop(0.4, '#8C2D45')
  bg.addColorStop(0.6, '#C4607A')
  bg.addColorStop(1,   '#5C1530')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, OUT_W, OUT_H)

  // ── 미묘한 대각선 패턴 ──
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  for (let i = -OUT_H; i < OUT_W + OUT_H; i += 18) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + OUT_H, OUT_H)
    ctx.stroke()
  }
  ctx.restore()

  // ── 발바닥 반복 패턴 ──
  drawPawPattern(ctx, OUT_W, OUT_H)

  // 3) 카드 배치 (좌우 MARGIN_X, 세로 중앙)
  const cardW = OUT_W - MARGIN_X * 2
  const cardH = Math.round((raw.height / raw.width) * cardW)
  const cardX = MARGIN_X
  const cardY = Math.round((OUT_H - cardH) / 2)

  // ── 카드 그림자 ──
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 20
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.restore()

  ctx.drawImage(raw, cardX, cardY, cardW, cardH)

  // 4) 스토리 전용 도트 장식
  if (ratio === 'story') {
    drawStoryDecorations(ctx, OUT_W, OUT_H, cardY, cardH)
  }

  // 5) 하단 워터마크 — Gaegu 손글씨 폰트 + 발바닥 이모지
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#FFD6E0'
  ctx.font = '700 28px "Gaegu", "Apple SD Gothic Neo", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐾 우리집 강아지 귀여워 🐾', OUT_W / 2, OUT_H - 56)
  ctx.restore()

  // 6) 다운로드
  const safeName = petName.replace(/[^\w가-힣]/g, '_') || 'pet'
  const link = document.createElement('a')
  link.download = `${safeName}_${suffix}.png`
  link.href = out.toDataURL('image/png')
  link.click()
}

/**
 * 캔버스 위에 발바닥 하나를 그린다
 * cx, cy: 메인 패드 중심 / size: 메인 패드 가로 반지름 기준 / angle: 회전(라디안)
 */
function drawPaw(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  angle: number,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  // 메인 패드
  ctx.beginPath()
  ctx.ellipse(0, size * 0.7, size, size * 0.78, 0, 0, Math.PI * 2)
  ctx.fill()

  // 발가락 4개
  const toes: [number, number, number, number][] = [
    [-size * 1.35, -size * 0.25, size * 0.45, size * 0.36],
    [-size * 0.48, -size * 0.72, size * 0.45, size * 0.36],
    [ size * 0.48, -size * 0.72, size * 0.45, size * 0.36],
    [ size * 1.35, -size * 0.25, size * 0.45, size * 0.36],
  ]
  for (const [tx, ty, rx, ry] of toes) {
    ctx.beginPath()
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** 전체 캔버스에 발바닥 패턴을 타일링 */
function drawPawPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.globalAlpha = 0.09
  ctx.fillStyle = '#FFD6E0'

  const step = 170
  const size = 22
  let row = 0
  for (let y = -step / 2; y < h + step; y += step * 0.75) {
    const offsetX = row % 2 === 0 ? 0 : step / 2
    for (let x = -step / 2 + offsetX; x < w + step; x += step) {
      // 살짝 회전 변화로 기계적 느낌 제거
      const angle = ((x * 0.3 + y * 0.17) % (Math.PI * 2))
      drawPaw(ctx, x, y, size, angle)
    }
    row++
  }
  ctx.restore()
}

function drawStoryDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cardY: number,
  cardH: number,
) {
  const topCenter = cardY / 2
  const bottomCenter = cardY + cardH + (h - cardY - cardH) / 2

  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#FFD6E0'

  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.arc(w / 2 + i * 36, topCenter, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.arc(w / 2 + i * 36, bottomCenter - 20, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
