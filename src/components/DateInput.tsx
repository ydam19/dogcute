import { useState, useRef, useEffect } from 'react'
import styles from './DateInput.module.css'

interface DateInputProps {
  value: string           // YYYY-MM-DD or ''
  onChange: (value: string) => void
  hasError?: boolean
  disabled?: boolean
}

export function DateInput({ value, onChange, hasError, disabled }: DateInputProps) {
  const parts = value.split('-')
  const [year, setYear] = useState(parts[0] ?? '')
  const [month, setMonth] = useState(parts[1] ?? '')
  const [day, setDay] = useState(parts[2] ?? '')

  // 항상 최신 값을 들고 있는 ref — emit 시 stale 클로저 방지
  const yearRef = useRef(parts[0] ?? '')
  const monthRef = useRef(parts[1] ?? '')
  const dayRef = useRef(parts[2] ?? '')

  const monthInputRef = useRef<HTMLInputElement>(null)
  const dayInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const parts = value.split('-')
    const y = parts[0] ?? ''
    const m = parts[1] ?? ''
    const d = parts[2] ?? ''
    yearRef.current = y
    monthRef.current = m
    dayRef.current = d
    setYear(y)
    setMonth(m)
    setDay(d)
  }, [value])

  function emit() {
    const y = yearRef.current
    const m = monthRef.current
    const d = dayRef.current
    if (y.length === 4 && m.length === 2 && d.length === 2) {
      // 실제로 존재하는 날짜인지 확인 (예: 2월 30일 차단)
      const date = new Date(`${y}-${m}-${d}`)
      const valid =
        !isNaN(date.getTime()) &&
        date.getFullYear() === Number(y) &&
        date.getMonth() + 1 === Number(m) &&
        date.getDate() === Number(d)
      onChange(valid ? `${y}-${m}-${d}` : '')
    } else {
      onChange('')
    }
  }

  /** 숫자만 남기고 최대 길이 자름 */
  function digits(v: string, max: number) {
    return v.replace(/\D/g, '').slice(0, max)
  }

  /** 칸이 꽉 찼을 때 숫자 키 입력 자체를 차단 */
  function blockIfFull(
    e: React.KeyboardEvent<HTMLInputElement>,
    current: string,
    max: number,
  ) {
    if (/^\d$/.test(e.key) && current.length >= max) {
      e.preventDefault()
    }
  }

  function handleYear(e: React.ChangeEvent<HTMLInputElement>) {
    const v = digits(e.target.value, 4)
    yearRef.current = v
    setYear(v)
    emit()
    if (v.length === 4) monthInputRef.current?.focus()
  }

  function handleMonth(e: React.ChangeEvent<HTMLInputElement>) {
    const v = digits(e.target.value, 2)
    monthRef.current = v
    setMonth(v)
    emit()
    if (v.length === 2) dayInputRef.current?.focus()
  }

  function handleDay(e: React.ChangeEvent<HTMLInputElement>) {
    const v = digits(e.target.value, 2)
    dayRef.current = v
    setDay(v)
    emit()
  }

  return (
    <div className={`${styles.wrapper} ${hasError ? styles.wrapperError : ''} ${disabled ? styles.wrapperDisabled : ''}`}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="YYYY"
        value={year}
        maxLength={4}
        onChange={handleYear}
        onKeyDown={e => blockIfFull(e, year, 4)}
        className={`${styles.input} ${styles.yearInput}`}
        aria-label="년도"
        disabled={disabled}
      />
      <span className={styles.sep}>.</span>
      <input
        ref={monthInputRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={month}
        maxLength={2}
        onChange={handleMonth}
        onKeyDown={e => blockIfFull(e, month, 2)}
        className={`${styles.input} ${styles.partInput}`}
        aria-label="월"
        disabled={disabled}
      />
      <span className={styles.sep}>.</span>
      <input
        ref={dayInputRef}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={day}
        maxLength={2}
        onChange={handleDay}
        onKeyDown={e => blockIfFull(e, day, 2)}
        className={`${styles.input} ${styles.partInput}`}
        aria-label="일"
        disabled={disabled}
      />
    </div>
  )
}
