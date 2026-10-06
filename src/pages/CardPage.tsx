import { useRef, useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePet } from '../context/PetContext'
import { IDCard } from '../components/IDCard/IDCard'
import { ProfileCard } from '../components/ProfileCard/ProfileCard'
import { RatioSheet } from '../components/RatioSheet'
import { PublishSheet } from '../components/PublishSheet'
import { buildCardCanvas, SaveRatio } from '../utils/saveCardAsImage'
import { addPost } from '../utils/feedStorage'
import { FeedPost } from '../types/pet'
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'
import styles from './CardPage.module.css'

const AD_GROUP_ID = 'ait.v2.live.3bde7acb281044f8'

type CardType = 'id' | 'profile'

export function CardPage() {
  const navigate = useNavigate()
  const { card } = usePet()
  const cardRef = useRef<HTMLDivElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cardType, setCardType] = useState<CardType>('id')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [publishSheetOpen, setPublishSheetOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const [retryRatio, setRetryRatio] = useState<SaveRatio | null>(null)
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null)
  const [saveImageUrl, setSaveImageUrl] = useState<string | null>(null)
  const adReadyRef = useRef(false)
  const rewardEarnedRef = useRef(false)
  const saveGenRef = useRef(0)
  const pendingRatioRef = useRef<SaveRatio | null>(null)
  const unloadAdRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!loadFullScreenAd.isSupported()) return
    function loadAd() {
      adReadyRef.current = false
      unloadAdRef.current?.()
      unloadAdRef.current = loadFullScreenAd({
        options: { adGroupId: AD_GROUP_ID },
        onEvent(event) {
          if (event.type === 'loaded') adReadyRef.current = true
        },
        onError(err) {
          console.warn('광고 로드 실패:', err)
          adReadyRef.current = false
        },
      })
    }
    loadAd()
    return () => { unloadAdRef.current?.() }
  }, [])

  if (!card) {
    navigate('/', { replace: true })
    return null
  }

  async function handlePublishSelect(type: 'id' | 'profile', commentsEnabled: boolean) {
    setPublishSheetOpen(false)
    setPublishing(true)
    try {
      // 선택한 카드 타입으로 전환 후 즉시 DOM 반영
      flushSync(() => setCardType(type))

      if (!cardRef.current) throw new Error('카드 요소 없음')
      // story(9:16) 완성 이미지(배경+발바닥+카드+워터마크)를 그대로 피드에 저장
      const storyCanvas = await buildCardCanvas(cardRef.current, 'story')
      // 파일 크기 절약: 640×1137로 리사이즈 후 JPEG 저장
      const thumbW = 640
      const thumbH = Math.round(storyCanvas.height * (thumbW / storyCanvas.width))
      const thumb = document.createElement('canvas')
      thumb.width = thumbW
      thumb.height = thumbH
      thumb.getContext('2d')!.drawImage(storyCanvas, 0, 0, thumbW, thumbH)
      const imageDataUrl = thumb.toDataURL('image/jpeg', 0.82)

      const post: FeedPost = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        cardType: type,
        imageDataUrl,
        petName: card!.name,
        species: card!.species,
        publishedAt: Date.now(),
        likes: 0,
        commentsEnabled,
      }
      addPost(post)
      setPublishSuccess(true)
      setTimeout(() => setPublishSuccess(false), 2500)
    } catch (err) {
      console.error('게시 실패:', err)
      setErrorMsg('게시에 실패했습니다. 다시 시도해주세요.')
      setTimeout(() => setErrorMsg(null), 3000)
    } finally {
      setPublishing(false)
    }
  }

  async function doSave(ratio: SaveRatio) {
    if (!cardRef.current) return
    const gen = ++saveGenRef.current
    console.log('[doSave] 시작 — ratio:', ratio, 'gen:', gen)
    setSaving(true)
    setRetryRatio(null)
    setSaveErrorMsg(null)
    try {
      const canvas = await buildCardCanvas(cardRef.current, ratio)
      if (gen !== saveGenRef.current) return
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setSaveImageUrl(dataUrl)
    } catch (err) {
      if (gen !== saveGenRef.current) return
      const name = err instanceof Error ? err.name : 'Error'
      const msg  = err instanceof Error ? err.message : String(err)
      console.error('[doSave] 실패:', name, msg, err)
      setRetryRatio(ratio)
      setSaveErrorMsg(`${name}: ${msg}`)
    } finally {
      if (gen === saveGenRef.current) {
        setSaving(false)
      }
    }
  }

  function reloadAd() {
    if (!loadFullScreenAd.isSupported()) return
    adReadyRef.current = false
    unloadAdRef.current?.()
    unloadAdRef.current = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent(event) {
        if (event.type === 'loaded') adReadyRef.current = true
      },
      onError(err) { console.warn('광고 재로드 실패:', err) },
    })
  }

  function handleRatioSelect(ratio: SaveRatio) {
    setSheetOpen(false)
    const adSupported = loadFullScreenAd.isSupported()
    if (!adSupported || !adReadyRef.current) {
      doSave(ratio)
      return
    }
    rewardEarnedRef.current = false
    pendingRatioRef.current = ratio
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent(event) {
        if (event.type === 'userEarnedReward') {
          rewardEarnedRef.current = true
          doSave(pendingRatioRef.current!)
        } else if (event.type === 'dismissed') {
          if (!rewardEarnedRef.current) {
            setErrorMsg('광고를 끝까지 봐야 저장됩니다.')
            setTimeout(() => setErrorMsg(null), 3000)
          }
          reloadAd()
        } else if (event.type === 'failedToShow') {
          doSave(pendingRatioRef.current!)
          reloadAd()
        }
      },
      onError(err) {
        console.warn('광고 표시 실패:', err)
        doSave(pendingRatioRef.current!)
        reloadAd()
      },
    })
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
          disabled={saving || publishing}
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
        <button
          className={`${styles.publishBtn} ${publishing ? styles.saveBtnLoading : ''}`}
          onClick={() => setPublishSheetOpen(true)}
          disabled={saving || publishing}
        >
          {publishing ? (
            <>
              <span className={styles.spinnerDark} />
              게시 중...
            </>
          ) : (
            <>
              <PublishIcon />
              게시하기
            </>
          )}
        </button>
        <div className={styles.bottomRow}>
          <button className={styles.newBtn} onClick={() => navigate('/')}>
            새로 만들기
          </button>
          <button className={styles.feedBtn} onClick={() => navigate('/feed')}>
            피드 보기
          </button>
        </div>
      </div>

      {saving && (
        <div className={styles.savingOverlay}>
          <p>이미지 생성 중...</p>
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorToast}>{errorMsg}</div>
      )}

      {retryRatio && (
        <div className={styles.errorToast}>
          <span>저장에 실패했어요&nbsp;
            <button
              className={styles.toastLink}
              onClick={() => doSave(retryRatio)}
            >
              다시 시도
            </button>
          </span>
          {saveErrorMsg && (
            <span className={styles.errorDetail}>{saveErrorMsg}</span>
          )}
        </div>
      )}

      {publishSuccess && (
        <div className={styles.successToast}>
          🐾 피드에 게시됐어요!&nbsp;
          <button className={styles.toastLink} onClick={() => navigate('/feed')}>
            피드 보기 →
          </button>
        </div>
      )}

      <PublishSheet
        open={publishSheetOpen}
        onSelect={handlePublishSelect}
        onClose={() => setPublishSheetOpen(false)}
      />

      <RatioSheet
        open={sheetOpen}
        onSelect={handleRatioSelect}
        onClose={() => setSheetOpen(false)}
      />

      {saveImageUrl && (
        <div className={styles.imageModalOverlay} onClick={() => setSaveImageUrl(null)}>
          <div className={styles.imageModal} onClick={e => e.stopPropagation()}>
            <button
              className={styles.imageModalClose}
              onClick={() => setSaveImageUrl(null)}
              aria-label="닫기"
            >
              ✕
            </button>
            <img
              src={saveImageUrl}
              alt="저장할 카드 이미지"
              className={styles.imageModalImg}
              draggable={false}
            />
            <p className={styles.imageModalHint}>📱 사진을 길게 눌러서 저장하세요</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PublishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <polyline points="5 12 12 5 19 12" />
      <line x1="5" y1="21" x2="19" y2="21" />
    </svg>
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
