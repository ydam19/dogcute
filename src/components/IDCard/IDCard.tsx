import { useEffect, useRef } from 'react'
import { PetIDCard } from '../../types/pet'
import { formatKoreanDate } from '../../utils/formatDate'
import { PawMark } from './PawMark'
import { GuillocheBg } from './GuillocheBg'
import styles from './IDCard.module.css'

interface IDCardProps {
  data: PetIDCard
}

const GENDER_LABEL = { male: '수컷', female: '암컷' }
const SPECIES_LABEL = { dog: '강아지', cat: '고양이' }
const ISSUER_SHORT = { dog: '멍협회', cat: '냥협회' }
const ISSUER_FULL = { dog: '대한민국 멍협회', cat: '대한민국 냥협회' }

export function IDCard({ data }: IDCardProps) {
  const photoFrameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!photoFrameRef.current) return
    const { width, height } = photoFrameRef.current.getBoundingClientRect()
    console.log(
      `[IDCard] photoFrame — width: ${width.toFixed(1)}px, height: ${height.toFixed(1)}px, ratio: ${(width / height).toFixed(3)} (1:1이면 1.000)`
    )
  }, [])

  return (
    // 비율 유지 래퍼: 가로:세로 = 856:540 ≈ 1.585:1 (실물 카드 비율)
    <div className={styles.cardRatio}>
      <div className={styles.card}>

        {/* 길로셰 배경 패턴 */}
        <GuillocheBg />

        {/* ─── 헤더 ─── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.emblem}>
              <PawMark species={data.species} size={22} color="#fff" opacity={0.95} />
            </div>
            <div className={styles.issuerBlock}>
              <span className={styles.countryName}>대한민국</span>
              <span className={styles.orgName}>{ISSUER_FULL[data.species]}</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.cardTitle}>반려동물 신분증</span>
            <span className={styles.cardTitleEn}>PET IDENTIFICATION CARD</span>
          </div>
        </div>

        {/* 금색 스트라이프 */}
        <div className={styles.goldStripe} />

        {/* ─── 본문 ─── */}
        <div className={styles.body}>
          {/* 왼쪽: 인적사항 */}
          <div className={styles.infoCol}>
            <InfoRow label="🐾 성명" value={data.name} isName />
            <InfoRow label="💜 성별" value={GENDER_LABEL[data.gender]} />
            <InfoRow label="🎂 탄생일" value={data.birthdayUnknown ? '비공개' : formatKoreanDate(data.birthday)} />
            <InfoRow label="✨ 특이사항" value={data.personality || '—'} />
            <InfoRow label="🏷️ 종" value={SPECIES_LABEL[data.species]} />
          </div>

          {/* 오른쪽: 세로형 증명사진 */}
          <div className={styles.photoCol}>
            <div className={styles.photoFrame} ref={photoFrameRef}>
              {data.photo ? (
                // <img> + object-fit:cover는 html2canvas에서 무시됨 →
                // background-size:cover 방식으로 통일 (화면·저장 이미지 동일하게 크롭)
                <div
                  className={styles.photo}
                  style={{ backgroundImage: `url(${data.photo})` }}
                  role="img"
                  aria-label={data.name}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <PawMark species={data.species} size={32} color="#C4607A" opacity={0.35} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 푸터 ─── */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <FooterRow label="♾️ 유효기간" value="평생" />
            <FooterRow label="🏛️ 발급기관" value={ISSUER_SHORT[data.species]} />
            <FooterRow label="🔢 발급번호" value={data.issueNumber} mono />
          </div>

          {/* 홀로그램 자리 → 발바닥 장식 마크 */}
          <div className={styles.hologramZone}>
            <div className={styles.hologramPaws}>
              <PawMark species={data.species} size={10} color="#C060A0" opacity={0.20} />
              <PawMark species={data.species} size={30} color="#6A1090" opacity={0.90} />
              <PawMark species={data.species} size={10} color="#C060A0" opacity={0.20} />
            </div>
            <span className={styles.hologramLabel}>{ISSUER_SHORT[data.species]}</span>
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  isName,
}: {
  label: string
  value: string
  isName?: boolean
}) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${isName ? styles.infoValueName : ''}`}>
        {value}
      </span>
    </div>
  )
}

function FooterRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className={styles.footerRow}>
      <span className={styles.footerLabel}>{label}</span>
      <span className={`${styles.footerValue} ${mono ? styles.footerValueMono : ''}`}>
        {value}
      </span>
    </div>
  )
}
