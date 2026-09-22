export type Species = 'dog' | 'cat'
export type Gender = 'male' | 'female'

export interface PetFormData {
  name: string
  photo: string | null       // base64 또는 blob URL
  gender: Gender
  species: Species
  personality: string        // 최대 20자, 특이사항으로 카드에 노출
  birthday: string           // YYYY-MM-DD
  birthdayUnknown: boolean   // 탄생일 모름 여부
  firstMetDate: string       // YYYY-MM-DD
  firstMetDateUnknown: boolean // 처음 만난 날 기억 안남 여부
  guardianBirthday: string   // YYYY-MM-DD (보호자 생년월일)
}

export interface PetIDCard extends PetFormData {
  issueNumber: string        // 발급번호
  sequenceNumber: number     // 가입 순번
}

export interface FeedPost {
  id: string
  cardType: 'id' | 'profile'
  imageDataUrl: string   // JPEG base64
  petName: string
  species: Species
  publishedAt: number    // Date.now()
  likes: number          // 좋아요 수
  commentsEnabled: boolean
}

export interface Comment {
  id: string
  postId: string
  author: string         // 닉네임
  content: string
  imageUrl?: string      // 첨부 사진 (JPEG base64, 선택)
  createdAt: number      // Date.now()
}

// 발급번호 생성 규칙 (우선순위):
//   1. 탄생일 (birthdayUnknown = false)
//   2. 처음 만난 날 (firstMetDateUnknown = false)
//   3. 보호자 생년월일
//   4. 랜덤 6자리 (위 셋 모두 없을 때)
// 뒤에 성별코드(M/F) + 종코드(D/C) + 가입순번(3자리) 붙임
// 예: 240315-FD001
