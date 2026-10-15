export type UserRole = 'student' | 'faculty' | 'staff'
export type ReplyStyle = 'academic' | 'balanced' | 'casual'
export type SceneMode = 'auto' | 'daily' | 'orientation' | 'exam' | 'graduation'

export interface UserProfile {
  name: string
  className?: string
  role: UserRole
  interests?: string
  customBio?: string
  replyStyle: ReplyStyle
  sceneMode: SceneMode
  createdAt: string
}

const KEY = 'shexiaohui_user_profile'

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearUserProfile(): void {
  localStorage.removeItem(KEY)
}
