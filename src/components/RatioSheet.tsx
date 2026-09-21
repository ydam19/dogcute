import { useEffect } from 'react'
import { SaveRatio } from '../utils/saveCardAsImage'
import styles from './RatioSheet.module.css'

interface RatioSheetProps {
  open: boolean
  onSelect: (ratio: SaveRatio) => void
  onClose: () => void
}

export function RatioSheet({ open, onSelect, onClose }: RatioSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.title}>저장 비율 선택</h2>
        <p className={styles.desc}>사용할 채널에 맞는 비율을 선택하세요</p>

        <div className={styles.options}>
          {/* ratio 값을 리터럴로 고정 — 클로저 바인딩 문제 원천 차단 */}
          <button className={styles.option} onClick={() => onSelect('feed')}>
            <div className={styles.optionIcon}><FeedIcon /></div>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>피드 게시물</span>
              <span className={styles.optionSub}>4:5 비율 · 1080×1350px</span>
            </div>
            <ChevronIcon />
          </button>

          <button className={styles.option} onClick={() => onSelect('story')}>
            <div className={styles.optionIcon}><StoryIcon /></div>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>스토리</span>
              <span className={styles.optionSub}>9:16 비율 · 1080×1920px</span>
            </div>
            <ChevronIcon />
          </button>
        </div>

        <button className={styles.cancelBtn} onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  )
}

function FeedIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="3" width="18" height="22" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="6" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="15" y="6" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="8" y="13" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
      <rect x="8" y="16" width="9" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

function StoryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="7" y="2" width="14" height="24" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="5" width="8" height="9" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="10" y="16" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
      <rect x="10" y="19" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
