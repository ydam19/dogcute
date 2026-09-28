import html2canvas from 'html2canvas'
import { File as TossFile } from '@apps-in-toss/web-framework'

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
 * 카드 DOM 요소로 출력용 캔버스를 만들어 반환 (다운로드 없음)
 */
export async function buildCardCanvas(
  cardElement: HTMLElement,
  ratio: SaveRatio,
): Promise<HTMLCanvasElement> {
  const cfg = RATIO_CONFIG[ratio]
  if (!cfg) throw new Error(`buildCardCanvas: 알 수 없는 ratio 값 "${ratio}"`)
  const { width: OUT_W, height: OUT_H, marginX: MARGIN_X } = cfg

  await document.fonts.load('700 28px "Gaegu"').catch(() => {})

  console.log('[buildCardCanvas] html2canvas 시작')
  const scale = 2
  const raw = await html2canvas(cardElement, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  })
  console.log(`[buildCardCanvas] html2canvas 완료 — raw: ${raw.width}x${raw.height}`)

  const out = document.createElement('canvas')
  out.width = OUT_W
  out.height = OUT_H
  const ctx = out.getContext('2d')!

  ctx.fillStyle = '#F9D0DC'
  ctx.fillRect(0, 0, OUT_W, OUT_H)

  drawPawPattern(ctx, OUT_W, OUT_H)

  const cardW = OUT_W - MARGIN_X * 2
  const cardH = Math.round((raw.height / raw.width) * cardW)
  const cardX = MARGIN_X
  const cardY = Math.round((OUT_H - cardH) / 2)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 20
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.restore()

  ctx.drawImage(raw, cardX, cardY, cardW, cardH)

  if (ratio === 'story') {
    drawStoryDecorations(ctx, OUT_W, OUT_H, cardY, cardH)
  }

  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.fillStyle = '#C4607A'
  ctx.font = '700 28px "Gaegu", "Apple SD Gothic Neo", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐾 우리집 강아지 귀여워 🐾', OUT_W / 2, OUT_H - 56)
  ctx.restore()

  return out
}

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

  console.log('[saveCardAsImage] 시작 — ratio:', ratio)

  const out = await buildCardCanvas(cardElement, ratio)
  console.log(`[saveCardAsImage] buildCardCanvas 완료 — output: ${out.width}x${out.height}`)

  const safeName = petName.replace(/[^\w가-힣]/g, '_') || 'pet'

  if (TossFile.saveBase64.isSupported()) {
    const fileName = `${safeName}_${cfg.suffix}.jpg`
    const dataUrl = out.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
    console.log(`[saveCardAsImage] toDataURL(jpeg/85%) 완료 — base64 길이: ${base64.length}`)

    try {
      await TossFile.saveBase64({ data: base64, fileName, mimeType: 'image/jpeg' })
      console.log('[saveCardAsImage] File.saveBase64 완료 — 갤러리 저장 성공')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[saveCardAsImage] File.saveBase64 실패:', msg, err)
      throw err
    }
  } else {
    // 브라우저 폴백: 다운로드 링크 클릭
    const fileName = `${safeName}_${cfg.suffix}.jpg`
    const link = document.createElement('a')
    link.download = fileName
    link.href = out.toDataURL('image/jpeg', 0.85)
    link.click()
    console.log('[saveCardAsImage] 브라우저 다운로드 트리거 완료')
  }
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
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#E080A0'

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
  ctx.globalAlpha = 0.35
  ctx.fillStyle = '#E080A0'

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
