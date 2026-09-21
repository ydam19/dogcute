import { Gender, Species } from '../types/pet'

/**
 * 발급번호 생성
 * 형식: YYMMDD-[성별코드][종코드][순번3자리]
 *
 * 기준일 우선순위:
 *   1. 탄생일 (알고 있을 때)
 *   2. 처음 만난 날 (탄생일 모름일 때)
 *   3. 보호자 생년월일 (위 둘 다 모름일 때)
 *   4. 랜덤 6자리 (위 셋 모두 없을 때)
 */
export function generateIssueNumber(
  birthday: string,
  birthdayUnknown: boolean,
  firstMetDate: string,
  firstMetDateUnknown: boolean,
  guardianBirthday: string,
  gender: Gender,
  species: Species,
  sequence: number,
): string {
  // 기준일 결정
  let baseDate: string | null = null

  if (!birthdayUnknown && birthday) {
    baseDate = birthday
  } else if (!firstMetDateUnknown && firstMetDate) {
    baseDate = firstMetDate
  } else if (guardianBirthday) {
    baseDate = guardianBirthday
  }

  // YYMMDD 생성
  let datePart: string
  if (baseDate) {
    const [year, month, day] = baseDate.split('-')
    datePart = `${year.slice(2)}${month}${day}`
  } else {
    // 모든 날짜가 없을 때: 랜덤 6자리
    datePart = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  }

  const genderCode = gender === 'male' ? 'M' : 'F'
  const speciesCode = species === 'dog' ? 'D' : 'C'
  const seqPart = String(sequence).padStart(3, '0')

  return `${datePart}-${genderCode}${speciesCode}${seqPart}`
}

/** localStorage 기반 단순 순번 발급 (실 서비스에선 서버 연동 필요) */
export function getNextSequence(): number {
  const key = 'pet_id_sequence'
  const current = parseInt(localStorage.getItem(key) ?? '0', 10)
  const next = current + 1
  localStorage.setItem(key, String(next))
  return next
}
