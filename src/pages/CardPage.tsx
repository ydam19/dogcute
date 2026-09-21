import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePet } from '../context/PetContext'
import { IDCard } from '../components/IDCard/IDCard'
import { ProfileCard } from '../components/ProfileCard/ProfileCard'
import { RatioSheet } from '../components/RatioSheet'
import { saveCardAsImage, SaveRatio } from '../utils/saveCardAsImage'
import styles from './CardPage.module.css'

type CardType = 'id' | 'profile'

export function CardPage() {
  const navigate = useNavigate()
  const { card } = usePet()
  const cardRef = useRef<HTMLDivElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cardType, setCardType] = useState<CardType>('id')

  if (!card) {
    navigate('/', { replace: true })
    return null
  }

  async function handleRatioSelect(ratio: SaveRatio) {
    setSheetOpen(false)
    if (!cardRef.current) return
    setSaving(true)
    try {
      await saveCardAsImage(cardRef.current, card!.name, ratio)
    } catch (err) {
      console.error('이미지 저장 실패:', err)
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← 다시 만들기
        </button>
        <h1 className={styles.title}>
          {cardType === 'id' ? '반려동물 신분증' : '프로필 카드'}
        </h1>
      </header>

      {/* 탭 전환 */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${cardType === 'id' ? styles.tabActive : ''}`}
          onClick={() => setCardType('id')}
        >
          🪪 신분증
        </button>
        <button
          className={`${styles.tab} ${cardType === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setCardType('profile')}
        >
          🎴 프로필 카드
        </button>
      </div>

      <div className={styles.cardWrapper}>
        <div ref={cardRef} className={styles.cardCapture}>
          {cardType === 'id'
            ? <IDCard data={card} />
            : <ProfileCard data={card} />
          }
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.saveBtn} ${saving ? styles.saveBtnLoading : ''}`}
          onClick={() => setSheetOpen(true)}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className={styles.spinner} />
              저장 중...
            </>
          ) : (
            <>
              <SaveIcon />
              이미지로 저장
            </>
          )}
        </button>
        <button className={styles.newBtn} onClick={() => navigate('/')}>
          새로 만들기
        </button>
      </div>

      {saving && (
        <div className={styles.savingOverlay}>
          <p>이미지 생성 중...</p>
        </div>
      )}

      <RatioSheet
        open={sheetOpen}
        onSelect={handleRatioSelect}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
