import { FeedPost, Comment } from '../types/pet'

const POSTS_KEY    = 'dogcute_feed_posts'
const LIKED_KEY    = 'dogcute_liked_ids'
const COMMENTS_KEY = 'dogcute_comments'
const AUTHOR_KEY   = 'dogcute_last_author'

// ── 게시물 CRUD ──

export function getPosts(): FeedPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (!raw) return []
    const posts = JSON.parse(raw) as FeedPost[]
    // 기존 데이터 호환: likes 필드 없으면 0으로 채움
    return posts
      .map(p => ({ ...p, likes: p.likes ?? 0 }))
      .sort((a, b) => b.publishedAt - a.publishedAt)
  } catch {
    return []
  }
}

export function addPost(post: FeedPost): void {
  try {
    const posts = getPosts()
    localStorage.setItem(POSTS_KEY, JSON.stringify([post, ...posts]))
  } catch {
    throw new Error('저장 공간이 부족합니다.')
  }
}

export function deletePost(id: string): void {
  try {
    const posts = getPosts().filter(p => p.id !== id)
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
    const liked = getLikedIds()
    liked.delete(id)
    saveLikedIds(liked)
    // 해당 게시물 댓글도 삭제
    const all = getAllComments().filter(c => c.postId !== id)
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

// ── 좋아요 ──

export function getLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveLikedIds(ids: Set<string>): void {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]))
}

export function isLiked(postId: string): boolean {
  return getLikedIds().has(postId)
}

// ── 댓글 ──

function getAllComments(): Comment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    return raw ? (JSON.parse(raw) as Comment[]) : []
  } catch {
    return []
  }
}

export function getComments(postId: string): Comment[] {
  return getAllComments()
    .filter(c => c.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt)  // 오래된 순
}

export function addComment(comment: Comment): void {
  try {
    const all = getAllComments()
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([...all, comment]))
  } catch {
    throw new Error('댓글 저장에 실패했습니다.')
  }
}

export function deleteComment(commentId: string): void {
  try {
    const all = getAllComments().filter(c => c.id !== commentId)
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

export function getLastAuthor(): string {
  return localStorage.getItem(AUTHOR_KEY) ?? ''
}

export function saveLastAuthor(name: string): void {
  localStorage.setItem(AUTHOR_KEY, name)
}

/** 좋아요 토글.
 *  호출 시점에 localStorage를 직접 읽어 현재 상태를 확인하고,
 *  반대 값으로 뒤집어 localStorage에 즉시 쓴다.
 *  React state에는 일절 의존하지 않는다. */
export function toggleLike(postId: string): void {
  // ─ liked IDs ─
  const raw = localStorage.getItem(LIKED_KEY)
  const arr: string[] = raw ? (JSON.parse(raw) as string[]) : []
  const wasLiked = arr.includes(postId)
  const nowLiked = !wasLiked

  const newArr = nowLiked
    ? [...arr, postId]
    : arr.filter(id => id !== postId)
  localStorage.setItem(LIKED_KEY, JSON.stringify(newArr))

  // ─ posts likes 카운트 ─
  const postsRaw = localStorage.getItem(POSTS_KEY)
  const posts: FeedPost[] = postsRaw ? (JSON.parse(postsRaw) as FeedPost[]) : []
  const updated = posts.map(p =>
    p.id === postId
      ? { ...p, likes: Math.max(0, p.likes + (nowLiked ? 1 : -1)) }
      : p
  )
  localStorage.setItem(POSTS_KEY, JSON.stringify(updated))
}
