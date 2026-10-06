import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import heic2any from 'heic2any'
import { Device } from '@apps-in-toss/web-framework'
import { PetFormData, Gender, Species } from '../types/pet'
import { generateIssueNumber, getNextSequence } from '../utils/generateIssueNumber'
import { usePet } from '../context/PetContext'
import { DateInput } from '../components/DateInput'
import { CropModal } from '../components/CropModal'
import styles from './InputForm.module.css'

const initialForm: PetFormData = {
  name: '',
  photo: null,
  gender: 'male',
  species: 'dog',
  personality: '',
  birthday: '',
  birthdayUnknown: false,
  firstMetDate: '',
  firstMetDateUnknown: false,
  guardianBirthday: '',
}

export function InputForm() {
  const navigate = useNavigate()
  const { setCard } = usePet()
  const [form, setForm] = useState<PetFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PetFormData, string>>>({})
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange<K extends keyof PetFormData>(key: K, value: PetFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function handleUnknownToggle(field: 'birthdayUnknown' | 'firstMetDateUnknown') {
    const dateField = field === 'birthdayUnknown' ? 'birthday' : 'firstMetDate'
    const next = !form[field]
    setForm(prev => ({ ...prev, [field]: next }))
    setErrors(prev => ({ ...prev, [dateField]: undefined }))
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

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
        setPhotoError('사진 변환에 실패했습니다. JPG/PNG 파일을 사용해주세요.')
        setTimeout(() => setPhotoError(null), 3500)
        return
      }
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) setPendingPhoto(dataUrl)
    }
    reader.readAsDataURL(blob)
  }

  function handleCropComplete(croppedDataUrl: string) {
    handleChange('photo', croppedDataUrl)
    setPendingPhoto(null)
  }

  function handleCropCancel() {
    setPendingPhoto(null)
  }

  async function handleSelectPhoto() {
    if (Device.getAlbumItems.isSupported()) {
      const items = await Device.getAlbumItems({ types: ['PHOTO'], maxCount: 1 })
      if (items.length > 0) setPendingPhoto(items[0].dataUri)
    } else {
      fileInputRef.current?.click()
    }
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요'
    if (!form.birthdayUnknown && !form.birthday) newErrors.birthday = '탄생일을 입력해주세요'
    if (!form.firstMetDateUnknown && !form.firstMetDate) newErrors.firstMetDate = '처음 만난 날을 입력해주세요'
    if (!form.guardianBirthday) newErrors.guardianBirthday = '보호자 생년월일을 입력해주세요'
    if (form.personality.length > 20) newErrors.personality = '20자 이내로 입력해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const sequence = getNextSequence()
    const issueNumber = generateIssueNumber(
      form.birthday,
      form.birthdayUnknown,
      form.firstMetDate,
      form.firstMetDateUnknown,
      form.guardianBirthday,
      form.gender,
      form.species,
      sequence,
    )
    setCard({ ...form, issueNumber, sequenceNumber: sequence })
    navigate('/card')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>우리집 강아지/고양이 귀여워</h1>
        <p className={styles.subtitle}>소중한 가족의 신분증을 만들어보세요</p>
        <Link to="/feed" className={styles.feedLink}>🐾 피드 보기</Link>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 사진 업로드 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle}>사진</label>
          <div
            className={styles.photoUpload}
            onClick={handleSelectPhoto}
          >
            {form.photo ? (
              <img src={form.photo} alt="반려동물 사진" className={styles.photoPreview} />
            ) : (
              <div className={styles.photoEmpty}>
                <span className={styles.photoIcon}>📷</span>
                <span>사진 추가</span>
              </div>
            )}
          </div>
          {form.photo && (
            <button
              type="button"
              className={styles.retakeBtn}
              onClick={handleSelectPhoto}
            >
              사진 다시 선택
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </section>

        {/* 종 선택 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle}>종류</label>
          <div className={styles.toggleGroup}>
            {(['dog', 'cat'] as Species[]).map(s => (
              <button
                key={s}
                type="button"
                className={`${styles.toggleBtn} ${form.species === s ? styles.active : ''}`}
                onClick={() => handleChange('species', s)}
              >
                {s === 'dog' ? '🐶 강아지' : '🐱 고양이'}
              </button>
            ))}
          </div>
        </section>

        {/* 성별 선택 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle}>성별</label>
          <div className={styles.toggleGroup}>
            {(['male', 'female'] as Gender[]).map(g => (
              <button
                key={g}
                type="button"
                className={`${styles.toggleBtn} ${form.gender === g ? styles.active : ''}`}
                onClick={() => handleChange('gender', g)}
              >
                {g === 'male' ? '수컷' : '암컷'}
              </button>
            ))}
          </div>
        </section>

        {/* 이름 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle} htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="반려동물 이름"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
          />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </section>

        {/* 성격 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle} htmlFor="personality">
            성격
            <span className={styles.hint}> · 신분증 특이사항에 표시돼요 (20자 이내)</span>
          </label>
          <input
            id="personality"
            type="text"
            className={`${styles.input} ${errors.personality ? styles.inputError : ''}`}
            placeholder="예: 활발하고 애교 많음"
            maxLength={20}
            value={form.personality}
            onChange={e => handleChange('personality', e.target.value)}
          />
          <p className={styles.charCount}>{form.personality.length}/20</p>
          {errors.personality && <p className={styles.error}>{errors.personality}</p>}
        </section>

        {/* 탄생일 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.sectionTitle}>탄생일</label>
            <label className={styles.unknownLabel}>
              <input
                type="checkbox"
                className={styles.unknownCheckbox}
                checked={form.birthdayUnknown}
                onChange={() => handleUnknownToggle('birthdayUnknown')}
              />
              모름
            </label>
          </div>
          <DateInput
            value={form.birthday}
            onChange={v => handleChange('birthday', v)}
            hasError={!!errors.birthday}
            disabled={form.birthdayUnknown}
          />
          {errors.birthday && <p className={styles.error}>{errors.birthday}</p>}
        </section>

        {/* 처음 만난 날 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.sectionTitle}>처음 만난 날</label>
            <label className={styles.unknownLabel}>
              <input
                type="checkbox"
                className={styles.unknownCheckbox}
                checked={form.firstMetDateUnknown}
                onChange={() => handleUnknownToggle('firstMetDateUnknown')}
              />
              기억 안남
            </label>
          </div>
          <DateInput
            value={form.firstMetDate}
            onChange={v => handleChange('firstMetDate', v)}
            hasError={!!errors.firstMetDate}
            disabled={form.firstMetDateUnknown}
          />
          {errors.firstMetDate && <p className={styles.error}>{errors.firstMetDate}</p>}
        </section>

        {/* 보호자 생년월일 */}
        <section className={styles.section}>
          <label className={styles.sectionTitle}>보호자 생년월일</label>
          <DateInput
            value={form.guardianBirthday}
            onChange={v => handleChange('guardianBirthday', v)}
            hasError={!!errors.guardianBirthday}
          />
          {errors.guardianBirthday && <p className={styles.error}>{errors.guardianBirthday}</p>}
        </section>

        <button type="submit" className={styles.submitBtn}>
          신분증 만들기
        </button>
      </form>

      {photoError && (
        <div className={styles.errorToast}>{photoError}</div>
      )}

      {pendingPhoto && (
        <CropModal
          imageSrc={pendingPhoto}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
