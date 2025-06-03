export interface TwitterUser {
  id: string
  username: string
  name: string
  profile_image_url?: string
  verified?: boolean
}

export interface HistoricalData {
  accounts: Array<{
    id: number
    'screen-names': Record<string, string[] | null>
  }>
}

export interface SearchResult {
  user: TwitterUser
  historicalNames: string[]
  dates: Record<string, string[]>
}