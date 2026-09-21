/** YYYY-MM-DD → YYYY년 MM월 DD일. 빈 문자열이면 '—' 반환 */
export function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${month}월 ${day}일`
}

/** YYYY-MM-DD → YY. MM. DD. */
export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year.slice(2)}. ${month}. ${day}.`
}
