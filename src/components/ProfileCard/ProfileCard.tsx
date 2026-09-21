import { PetIDCard } from '../../types/pet'
import { PawMark } from '../IDCard/PawMark'
import styles from './ProfileCard.module.css'

interface ProfileCardProps {
  data: PetIDCard
}

const GENDER_LABEL = { male: '수컷', female: '암컷' }
const SPECIES_EMOJI = { dog: '🐶', cat: '🐱' }
const GENDER_EMOJI  = { male: '♂', female: '♀' }

/** 성격 텍스트 → 해시태그 배열. 쉼표 우선, 없으면 공백 기준으로 분리 */
function parseTags(personality: string): string[] {
  if (!personality.trim()) return []
  const sep = personality.includes(',') ? ',' : /[\s　]+/
  return personality.split(sep).map(t => t.trim()).filter(Boolean)
}

export function ProfileCard({ data }: ProfileCardProps) {
  const tags = parseTags(data.personality)

  return (
    <div className={styles.card}>

      {/* ── 폴라로이드 사진 영역 ── */}
      <div className={styles.photoWrap}>
        <div className={styles.photoFrame}>
          {data.photo ? (
            <div
              className={styles.photo}
              style={{ backgroundImage: `url(${data.photo})` }}
              role="img"
              aria-label={data.name}
            />
          ) : (
            <div className={styles.photoEmpty}>
              <PawMark species={data.species} size={52} color="#C4607A" opacity={0.22} />
            </div>
          )}
        </div>
      </div>

      {/* ── 텍스트 영역 ── */}
      <div className={styles.textArea}>
        {/* 이름 */}
        <p className={styles.name}>{data.name}</p>

        {/* 해시태그 성격 */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag, i) => (
              <span key={i} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* 종 + 성별 */}
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            {SPECIES_EMOJI[data.species]} {data.species === 'dog' ? '강아지' : '고양이'}
          </span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>
            {GENDER_EMOJI[data.gender]} {GENDER_LABEL[data.gender]}
          </span>
        </div>
      </div>

      {/* ── 하단 발바닥 장식 ── */}
      <div className={styles.footer}>
        <PawMark species={data.species} size={12} color="#C4607A" opacity={0.18} />
        <PawMark species={data.species} size={16} color="#C4607A" opacity={0.14} />
        <PawMark species={data.species} size={12} color="#C4607A" opacity={0.18} />
      </div>

    </div>
  )
}
