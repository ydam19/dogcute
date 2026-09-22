import { useState, useEffect } from 'react'
import styles from './PublishSheet.module.css'

interface PublishSheetProps {
  open: boolean
  onSelect: (type: 'id' | 'profile', commentsEnabled: boolean) => void
  onClose: () => void
}

export function PublishSheet({ open, onSelect, onClose }: PublishSheetProps) {
  const [commentsEnabled, setCommentsEnabled] = useState(true)

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
        <h2 className={styles.title}>어떤 버전으로 게시할까요?</h2>
        <p className={styles.desc}>선택한 버전으로 피드에 게시돼요</p>

        {/* 댓글 허용 토글 */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleIcon}>💬</span>
            <div>
              <span className={styles.toggleTitle}>댓글 허용</span>
              <span className={styles.toggleSub}>게시물에 댓글을 달 수 있어요</span>
            </div>
          </div>
          <button
            className={`${styles.toggle} ${commentsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setCommentsEnabled(v => !v)}
            aria-label={commentsEnabled ? '댓글 허용 끄기' : '댓글 허용 켜기'}
            role="switch"
            aria-checked={commentsEnabled}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.options}>
          <button className={styles.option} onClick={() => onSelect('id', commentsEnabled)}>
            <div className={styles.optionIcon}><IDCardIcon /></div>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>신분증 버전</span>
              <span className={styles.optionSub}>공식 신분증 스타일</span>
            </div>
            <ChevronIcon />
          </button>

          <button className={styles.option} onClick={() => onSelect('profile', commentsEnabled)}>
            <div className={styles.optionIcon}><ProfileCardIcon /></div>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>프로필 카드 버전</span>
              <span className={styles.optionSub}>폴라로이드 스타일</span>
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

function IDCardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2.5" />
      <line x1="13" y1="10" x2="19" y2="10" />
      <line x1="13" y1="13" x2="17" y2="13" />
    </svg>
  )
}

function ProfileCardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="7" y="5" width="10" height="8" rx="1" />
      <line x1="7" y1="16" x2="17" y2="16" />
      <line x1="7" y1="19" x2="13" y2="19" />
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
