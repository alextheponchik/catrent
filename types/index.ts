export type Role = 'owner' | 'renter'
export type RentalStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: Role
  full_name: string
  phone?: string
  avatar_url?: string
}

export interface Cat {
  id: string
  owner_id: string
  name: string
  breed: string
  age_months: number
  feeding_requirements: string
  price_per_day: number
  is_available: boolean
  photo_url?: string
  created_at: string
  profiles?: Profile
}

export interface RentalRequest {
  id: string
  cat_id: string
  renter_id: string
  status: RentalStatus
  requested_date: string
  message?: string
  cats?: Cat
  profiles?: Profile
}

export interface Message {
  id: string
  rental_request_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: { full_name: string }
}
