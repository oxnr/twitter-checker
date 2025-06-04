export interface TwitterUser {
  id: string
  username: string
  name: string
  profile_image_url?: string
  bio?: string
  followers_count?: number
  following_count?: number
  tweet_count?: number
  verified?: boolean
  isBlueVerified?: boolean
  verifiedType?: string | null
  created_at?: string
  location?: string
  url?: string
  protected?: boolean
  favouritesCount?: number
  mediaCount?: number
  canDm?: boolean
  coverPicture?: string
}

export interface SearchResult {
  user: TwitterUser
  historicalNames: string[]
  dates: Record<string, string[]>
}

export interface AutocompleteUser {
  username: string
  name: string
  profile_image_url?: string
}

export interface AutocompleteResponse {
  suggestions: AutocompleteUser[]
}