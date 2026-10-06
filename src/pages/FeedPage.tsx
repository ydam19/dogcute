import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heic2any from 'heic2any'
import { Device } from '@apps-in-toss/web-framework'
import { FeedPost, Comment } from '../types/pet'
import {
  getPosts, deletePost, getLikedIds, toggleLike,
  getComments, addComment, deleteComment,
  getLastAuthor, saveLastAuthor,
} from '../utils/feedStorage'
import { containsProfanity } from '../utils/profanityFilter'
import styles from './FeedPage.module.css'

const DOUBLE_TAP_MS = 280

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60)   return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

/** 이미지 data URL을 최대 maxPx 크기로 리사이즈 후 JPEG data URL 반환 */
async function resizeImage(dataUrl: string, maxPx = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round(height * maxPx / width)
          width = maxPx
        } else {
          width = Math.round(width * maxPx / height)
          height = maxPx
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export function FeedPage() {
  const navigate = useNavigate()
  const [posts, setPosts]       = useState<FeedPost[]>(() => getPosts())
  const [likedIds, setLikedIds] = useState<Set<string>>(() => getLikedIds())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedPost, setExpandedPost]       = useState<FeedPost | null>(null)
  const [heartAnim, setHeartAnim]             = useState<string | null>(null)

  // 댓글 상태
  const [comments, setComments]   = useState<Comment[]>([])
  const [author, setAuthor]       = useState(() => getLastAuthor())
  const [content, setContent]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [profanityError, setProfanityError] = useState(false)

  // 댓글 사진 첨부 상태
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const commentPhotoRef = useRef<HTMLInputElement>(null)

  // 댓글 사진 확대 라이트박스
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const tapTimers    = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const expandLastTap = useRef<number>(0)
  const commentListRef = useRef<HTMLDivElement>(null)

  // 확대 보기 열릴 때 댓글 로드
  useEffect(() => {
    if (expandedPost) {
      setComments(getComments(expandedPost.id))
      setContent('')
      setCommentPhoto(null)
    }
  }, [expandedPost?.id])

  // 새 댓글 추가 후 스크롤 아래로
  useEffect(() => {
    if (commentListRef.current) {
      commentListRef.current.scrollTop = commentListRef.current.scrollHeight
    }
  }, [comments.length])

  function refreshPosts() {
    const fresh = getPosts()
    setPosts(fresh)
    setLikedIds(getLikedIds())
    setExpandedPost(prev => prev ? (fresh.find(p => p.id === prev.id) ?? null) : null)
  }

  function handleDelete(id: string) {
    deletePost(id)
    refreshPosts()
    setConfirmDeleteId(null)
    if (expandedPost?.id === id) setExpandedPost(null)
  }

  function handleLike(postId: string) {
    console.log('handleLike 호출됨', postId)
    try {
      // ① localStorage를 source of truth로: 읽기 → 토글 → 즉시 쓰기
      toggleLike(postId)

      // ② localStorage에서 방금 쓴 최신 값을 다시 읽어 React state에 반영
      const freshPosts = getPosts()
      const freshLiked = getLikedIds()

      setPosts(freshPosts)
      setLikedIds(freshLiked)
      setExpandedPost(prev =>
        prev ? (freshPosts.find(p => p.id === prev.id) ?? null) : null
      )
    } catch (err) {
      console.error('handleLike 오류:', err)
    }
  }

  async function handleCommentPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhotoLoading(true)

    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')

    let blob: Blob = file
    if (isHeic) {
      try {
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
        blob = Array.isArray(converted) ? converted[0] : converted
      } catch {
        setPhotoLoading(false)
        return
      }
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) {
        try {
          const resized = await resizeImage(dataUrl, 1200)
          setCommentPhoto(resized)
        } catch {
          setCommentPhoto(dataUrl)
        }
      }
      setPhotoLoading(false)
    }
    reader.readAsDataURL(blob)
  }

  async function handleSelectCommentPhoto(e: React.MouseEvent) {
    if (Device.getAlbumItems.isSupported()) {
      e.preventDefault()
      const items = await Device.getAlbumItems({ types: ['PHOTO'], maxCount: 1 })
      if (items.length > 0) {
        setPhotoLoading(true)
        try {
          const resized = await resizeImage(items[0].dataUri, 1200)
          setCommentPhoto(resized)
        } catch {
          setCommentPhoto(items[0].dataUri)
        } finally {
          setPhotoLoading(false)
        }
      }
    }
    // isSupported()가 false면 label 기본 동작으로 file input이 열림
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!expandedPost) return
    if (!author.trim()) return
    if (!content.trim() && !commentPhoto) return
    if (containsProfanity(author) || containsProfanity(content)) {
      setProfanityError(true)
      setTimeout(() => setProfanityError(false), 3000)
      return
    }
    setSubmitting(true)
    const trimmedAuthor = author.trim()
    saveLastAuthor(trimmedAuthor)
    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      postId: expandedPost.id,
      author: trimmedAuthor,
      content: content.trim(),
      ...(commentPhoto ? { imageUrl: commentPhoto } : {}),
      createdAt: Date.now(),
    }
    addComment(comment)
    setComments(getComments(expandedPost.id))
    setContent('')
    setCommentPhoto(null)
    setSubmitting(false)
  }

  function handleDeleteComment(commentId: string) {
    deleteComment(commentId)
    if (expandedPost) setComments(getComments(expandedPost.id))
  }

  function showHeart(key: string) {
    setHeartAnim(key)
    setTimeout(() => setHeartAnim(prev => prev === key ? null : prev), 750)
  }

  function handleGridImageTap(post: FeedPost) {
    if (tapTimers.current.has(post.id)) {
      clearTimeout(tapTimers.current.get(post.id)!)
      tapTimers.current.delete(post.id)
      // React state(likedIds)는 stale일 수 있으므로 localStorage에서 직접 읽는다.
      if (!getLikedIds().has(post.id)) handleLike(post.id)
      showHeart(`grid:${post.id}`)
    } else {
      const capturedId = post.id
      const timer = setTimeout(() => {
        tapTimers.current.delete(capturedId)
        // 캡처 시점의 stale post 객체 대신 타이머 발동 시점의 최신 데이터를 사용한다.
        setExpandedPost(() => getPosts().find(p => p.id === capturedId) ?? null)
      }, DOUBLE_TAP_MS)
      tapTimers.current.set(post.id, timer)
    }
  }

  function handleExpandDoubleTap() {
    if (!expandedPost) return
    const now = Date.now()
    if (now - expandLastTap.current < DOUBLE_TAP_MS) {
      expandLastTap.current = 0
      // React state(likedIds)는 stale일 수 있으므로 localStorage에서 직접 읽는다.
      if (!getLikedIds().has(expandedPost.id)) handleLike(expandedPost.id)
      showHeart(`expand:${expandedPost.id}`)
    } else {
      expandLastTap.current = now
    }
  }

  const canSubmit = !submitting && !!author.trim() && (!!content.trim() || !!commentPhoto)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>🐾 반려동물 피드</h1>
      </header>

      {posts.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🐾</span>
          <p className={styles.emptyText}>아직 게시된 카드가 없어요</p>
          <p className={styles.emptySub}>신분증을 만들고 게시해보세요!</p>
          <button className={styles.makeBtn} onClick={() => navigate('/')}>신분증 만들러 가기</button>
        </div>
      ) : (
        <>
          <p className={styles.count}>총 {posts.length}마리</p>
          <div className={styles.grid}>
            {posts.map(post => {
              const liked = likedIds.has(post.id)
              return (
                <div key={post.id} className={styles.card}>
                  <img
                    src={post.imageDataUrl}
                    alt={`${post.petName} 카드`}
                    className={styles.cardImage}
                    onClick={() => handleGridImageTap(post)}
                  />
                  {heartAnim === `grid:${post.id}` && (
                    <span className={styles.heartBurst} aria-hidden>
                      <HeartIcon filled size={64} />
                    </span>
                  )}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardInfoTop}>
                      <span className={styles.petName}>{post.petName}</span>
                      <span className={styles.cardTypeBadge}>
                        {post.cardType === 'id' ? '🪪 신분증' : '🎴 프로필'}
                      </span>
                    </div>
                    <button
                      key={`like-${post.id}`}
                      className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                      onPointerDown={e => {
                        e.stopPropagation()
                        // 이미지 더블탭 타이머가 살아있으면 취소 — 모달 열림 방지
                        const t = tapTimers.current.get(post.id)
                        if (t) { clearTimeout(t); tapTimers.current.delete(post.id) }
                        console.log('🐾 그리드 좋아요', post.id)
                        handleLike(post.id)
                      }}
                      onClick={e => {
                        e.stopPropagation()
                        // e.detail === 0 이면 키보드(Enter/Space) 트리거 — pointerDown이 없으므로 여기서 처리
                        if (e.detail === 0) handleLike(post.id)
                      }}
                      aria-label={liked ? '좋아요 취소' : '좋아요'}
                    >
                      <HeartIcon key={`heart-grid-${post.id}`} filled={liked} size={22} />
                      <span className={styles.likeCount}>{post.likes}</span>
                    </button>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => setConfirmDeleteId(post.id)} aria-label="게시 취소">✕</button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 확대 보기 모달 ── */}
      {expandedPost && (() => {
        const liked = likedIds.has(expandedPost.id)
        return (
          <div className={styles.expandOverlay}>
            {/* 헤더 */}
            <div className={styles.expandHeader}>
              <button className={styles.expandClose} onClick={() => setExpandedPost(null)}>✕</button>
              <span className={styles.expandTitle}>{expandedPost.petName}</span>
              <div style={{ width: 60 }} />
            </div>

            {/* 스크롤 가능 본문 */}
            <div className={styles.expandBody}>
              {/* 이미지 + 더블탭 좋아요 */}
              <div
                className={styles.expandImageWrap}
                onClick={handleExpandDoubleTap}
              >
                <img
                  src={expandedPost.imageDataUrl}
                  alt={`${expandedPost.petName} 카드`}
                  className={styles.expandImage}
                />
                {heartAnim === `expand:${expandedPost.id}` && (
                  <span className={styles.heartBurstExpand} aria-hidden>
                    <HeartIcon filled size={96} />
                  </span>
                )}
              </div>

              {/* 좋아요 바 */}
              <div className={styles.expandLikeBar}>
                <button
                  key={`like-expand-${expandedPost.id}`}
                  className={`${styles.expandLikeBtn} ${liked ? styles.expandLikeBtnActive : ''}`}
                  onPointerDown={e => {
                    e.stopPropagation()
                    console.log('🐾 확대뷰 좋아요', expandedPost.id)
                    handleLike(expandedPost.id)
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    if (e.detail === 0) handleLike(expandedPost.id)
                  }}
                  aria-label={liked ? '좋아요 취소' : '좋아요'}
                >
                  <HeartIcon key={`heart-expand-${expandedPost.id}`} filled={liked} size={26} />
                  <span>{expandedPost.likes}</span>
                </button>
                {!expandedPost.commentsEnabled && (
                  <span className={styles.commentsOff}>💬 댓글 비허용</span>
                )}
              </div>

              {/* 댓글 섹션 */}
              {expandedPost.commentsEnabled && (
                <div className={styles.commentsSection}>
                  <h3 className={styles.commentsTitle}>댓글 {comments.length > 0 ? `${comments.length}개` : ''}</h3>
                  {comments.length === 0 ? (
                    <p className={styles.commentsEmpty}>첫 번째 댓글을 남겨보세요 🐾</p>
                  ) : (
                    <div className={styles.commentList} ref={commentListRef}>
                      {comments.map(c => (
                        <div key={c.id} className={styles.commentItem}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>{c.author}</span>
                            <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                            <button
                              className={styles.commentDeleteBtn}
                              onClick={() => handleDeleteComment(c.id)}
                              aria-label="댓글 삭제"
                            >✕</button>
                          </div>
                          {c.content && <p className={styles.commentContent}>{c.content}</p>}
                          {c.imageUrl && (
                            <button
                              className={styles.commentImageBtn}
                              onClick={() => setLightboxSrc(c.imageUrl!)}
                              aria-label="사진 크게 보기"
                            >
                              <img
                                src={c.imageUrl}
                                className={styles.commentImage}
                                alt="첨부 사진"
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 입력 폼 여백 (sticky 폼이 겹치지 않게) */}
              {expandedPost.commentsEnabled && <div className={styles.commentInputSpacer} />}
            </div>

            {/* 댓글 입력 (sticky 하단) */}
            {expandedPost.commentsEnabled && (
              <form className={styles.commentForm} onSubmit={handleSubmitComment}>
                {profanityError && (
                  <span className={styles.profanityError}>부적절한 표현이 포함되어 있어요</span>
                )}
                {/* 사진 미리보기 */}
                {commentPhoto && (
                  <div className={styles.commentPhotoPreviewRow}>
                    <img src={commentPhoto} className={styles.commentPhotoThumb} alt="첨부 사진 미리보기" />
                    <button
                      type="button"
                      className={styles.commentPhotoRemoveBtn}
                      onClick={() => setCommentPhoto(null)}
                      aria-label="사진 제거"
                    >✕</button>
                  </div>
                )}
                <div className={styles.commentInputRow}>
                  <input
                    className={styles.authorInput}
                    placeholder="닉네임"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    maxLength={20}
                  />
                  <input
                    className={styles.contentInput}
                    placeholder="댓글을 입력하세요"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={200}
                  />
                  {/* 사진 첨부 버튼 */}
                  <label
                    className={`${styles.commentPhotoBtn} ${photoLoading ? styles.commentPhotoBtnLoading : ''}`}
                    aria-label="사진 첨부"
                    onClick={handleSelectCommentPhoto}
                  >
                    {photoLoading ? <span className={styles.photoSpinner} /> : '📷'}
                    <input
                      ref={commentPhotoRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      style={{ display: 'none' }}
                      onChange={handleCommentPhotoChange}
                      disabled={photoLoading}
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.submitCommentBtn}
                    disabled={!canSubmit}
                  >
                    게시
                  </button>
                </div>
              </form>
            )}

            {/* 댓글 사진 라이트박스 */}
            {lightboxSrc && (
              <div
                className={styles.lightboxOverlay}
                onClick={() => setLightboxSrc(null)}
                aria-label="닫기"
              >
                <img
                  src={lightboxSrc}
                  className={styles.lightboxImg}
                  alt="사진 크게 보기"
                  onClick={e => e.stopPropagation()}
                />
                <button
                  className={styles.lightboxClose}
                  onClick={() => setLightboxSrc(null)}
                >✕</button>
              </div>
            )}
          </div>
        )
      })()}

      {/* 삭제 확인 모달 */}
      {confirmDeleteId && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmText}>이 게시물을 삭제할까요?</p>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmCancel} onClick={() => setConfirmDeleteId(null)}>취소</button>
              <button className={styles.confirmDelete} onClick={() => handleDelete(confirmDeleteId)}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeartIcon({ filled, size = 22 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#C4607A' : 'none'}
      stroke={filled ? '#C4607A' : '#b08090'}
      strokeWidth={filled ? 1.5 : 2}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
