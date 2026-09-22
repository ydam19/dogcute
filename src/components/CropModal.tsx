import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'
import { getCroppedImg } from '../utils/getCroppedImg'
import styles from './CropModal.module.css'

const CROP_ASPECT = 1  // 1:1 정사각형

interface CropModalProps {
  imageSrc: string
  onComplete: (croppedDataUrl: string) => void
  onCancel: () => void
}

export function CropModal({ imageSrc, onComplete, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleComplete() {
    if (!croppedAreaPixels || processing) return
    setProcessing(true)
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels)
      onComplete(cropped)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={styles.overlay}>
      {/* 상단 바 */}
      <div className={styles.topBar}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          취소
        </button>
        <span className={styles.topTitle}>사진 편집</span>
        <button
          className={`${styles.doneBtn} ${processing ? styles.doneBtnDisabled : ''}`}
          onClick={handleComplete}
          disabled={processing}
        >
          {processing ? '처리 중…' : '완료'}
        </button>
      </div>

      {/* 크로퍼 영역 */}
      <div className={styles.cropContainer}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={CROP_ASPECT}
          cropShape="rect"
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#111' },
            cropAreaStyle: {
              border: '2px solid #fff',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
            },
          }}
        />
      </div>

      {/* 하단 컨트롤 */}
      <div className={styles.controls}>
        <div className={styles.zoomRow}>
          <ZoomOutIcon />
          <input
            type="range"
            className={styles.slider}
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            aria-label="확대/축소"
          />
          <ZoomInIcon />
        </div>
        <p className={styles.hint}>핀치하거나 슬라이더로 확대 · 드래그로 위치 조정</p>
      </div>
    </div>
  )
}

function ZoomOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}
