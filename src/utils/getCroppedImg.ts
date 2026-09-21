import { Area } from 'react-easy-crop'

const OUTPUT_MAX_PX = 1200  // 출력 최대 픽셀 (긴 쪽 기준)

/**
 * 원본 이미지 data URL + react-easy-crop의 pixelCrop 영역을 받아
 * 크롭된 JPEG data URL 반환.
 * aspect=1 (1:1 정사각형) 기준이므로 출력도 정사각형.
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const img = await loadImage(imageSrc)

  // 1:1이므로 width == height. 큰 쪽을 OUTPUT_MAX_PX로 캡.
  const size = Math.min(Math.max(pixelCrop.width, pixelCrop.height), OUTPUT_MAX_PX)

  console.log('[getCroppedImg] 원본:', img.naturalWidth, '×', img.naturalHeight)
  console.log('[getCroppedImg] pixelCrop:', pixelCrop.x, pixelCrop.y,
    pixelCrop.width, '×', pixelCrop.height,
    '비율:', (pixelCrop.width / pixelCrop.height).toFixed(4), '(1:1 = 1.0000)')
  console.log('[getCroppedImg] 출력:', size, '×', size, '(1:1 정사각형)')

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  )

  return canvas.toDataURL('image/jpeg', 0.9)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
