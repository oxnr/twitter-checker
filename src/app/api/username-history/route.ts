import { NextRequest, NextResponse } from 'next/server'

interface LolArchiverResponse {
  success: boolean
  data?: {
    username_history?: Array<{
      username: string
      start_date: string
      end_date?: string
    }>
    display_name_history?: Array<{
      display_name: string
      start_date: string
      end_date?: string
    }>
  }
  error?: string
}

interface MemoryLolResponse {
  accounts: Array<{
    id: number
    id_str: string
    screen_names: Record<string, string[]>
  }>
}

interface HistoryResult {
  source: string
  usernames: Array<{
    username: string
    start_date: string
    end_date?: string
    is_current: boolean
  }>
  success: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const userId = searchParams.get('id')

  console.log('=== USERNAME HISTORY API START ===')
  console.log('Username:', username)
  console.log('User ID:', userId)

  if (!username && !userId) {
    return NextResponse.json({ error: 'Username or ID is required' }, { status: 400 })
  }

  const cleanUsername = username?.replace('@', '').trim()
  const results: HistoryResult[] = []

  // Strategy 1: Try LolArchiver API (2011-2023, comprehensive)
  const lolArchiverKey = process.env.LOLARCHIVER_API_KEY
  if (lolArchiverKey && cleanUsername) {
    try {
      console.log('🔍 Trying LolArchiver API...')
      const lolResponse = await fetch('https://lolarchiver.com/twitter_history_lookup', {
        method: 'POST',
        headers: {
          'apikey': lolArchiverKey,
          'handle': cleanUsername,
          ...(userId && { 'id': userId }),
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (lolResponse.ok) {
        const lolData: LolArchiverResponse = await lolResponse.json()
        console.log('✅ LolArchiver response:', lolData)
        
        if (lolData.success && lolData.data?.username_history) {
          const usernames = lolData.data.username_history.map(entry => ({
            username: entry.username,
            start_date: entry.start_date,
            end_date: entry.end_date,
            is_current: !entry.end_date || entry.end_date === 'current'
          }))

          results.push({
            source: 'lolarchiver',
            usernames,
            success: true
          })
          
          // If we got good data from LolArchiver, return it
          if (usernames.length > 1) {
            console.log('✅ LolArchiver provided comprehensive data, returning early')
            return NextResponse.json({
              sources: results,
              historical_names: usernames.filter(u => !u.is_current).map(u => u.username),
              current_username: usernames.find(u => u.is_current)?.username || cleanUsername,
              total_sources: 1
            })
          }
        }
      } else {
        console.log(`❌ LolArchiver failed with status: ${lolResponse.status}`)
        if (lolResponse.status === 401) {
          console.log('🔑 Invalid LolArchiver API key')
        } else if (lolResponse.status === 416) {
          console.log('💳 LolArchiver credits exhausted')
        }
      }
    } catch (error) {
      console.log('❌ LolArchiver error:', error)
      results.push({
        source: 'lolarchiver',
        usernames: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    console.log('⏭️  Skipping LolArchiver (no API key or username)')
  }

  // Strategy 2: Try Memory.lol API (free, limited coverage)
  if (cleanUsername) {
    try {
      console.log('🔍 Trying Memory.lol API...')
      const memoryResponse = await fetch(`https://api.memory.lol/v1/tw/${cleanUsername}`, {
        headers: {
          'User-Agent': 'Twitter-History-App/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000)
      })

      if (memoryResponse.ok) {
        const memoryData: MemoryLolResponse = await memoryResponse.json()
        console.log('✅ Memory.lol response:', memoryData)
        
        if (memoryData.accounts && memoryData.accounts.length > 0) {
          const account = memoryData.accounts[0]
          const screenNames = account.screen_names
          
          const usernames = Object.entries(screenNames).map(([username, dates]) => ({
            username,
            start_date: dates[0],
            end_date: dates[1] === '2025-02-25' ? undefined : dates[1], // Current if end date is far future
            is_current: username.toLowerCase() === cleanUsername.toLowerCase()
          }))

          results.push({
            source: 'memory.lol',
            usernames,
            success: true
          })
        } else {
          results.push({
            source: 'memory.lol',
            usernames: [],
            success: false,
            error: 'No data found in Memory.lol database'
          })
        }
      } else {
        console.log(`❌ Memory.lol failed with status: ${memoryResponse.status}`)
      }
    } catch (error) {
      console.log('❌ Memory.lol error:', error)
      results.push({
        source: 'memory.lol',
        usernames: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Strategy 3: Mugetsu Bot Integration (via Telegram Bot API)
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const mugetsuChatId = process.env.MUGETSU_CHAT_ID // Your chat ID with Mugetsu bot
  
  if (telegramBotToken && mugetsuChatId && cleanUsername) {
    try {
      console.log('🔍 Trying Mugetsu Bot via Telegram...')
      
      // Send command to Mugetsu bot
      const sendMessage = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: mugetsuChatId,
          text: `/twitter_reuse ${cleanUsername}`,
          parse_mode: 'Markdown'
        }),
        signal: AbortSignal.timeout(5000)
      })

      if (sendMessage.ok) {
        console.log('✅ Sent command to Mugetsu bot, waiting for response...')
        
        // Note: In a real implementation, you'd need to:
        // 1. Set up a webhook to receive Mugetsu's response
        // 2. Parse the response for username history
        // 3. Store the result in a temporary cache
        // For now, we'll add a placeholder
        
        results.push({
          source: 'mugetsu',
          usernames: [],
          success: false,
          error: 'Mugetsu integration requires webhook setup for response parsing'
        })
      }
    } catch (error) {
      console.log('❌ Mugetsu Bot error:', error)
      results.push({
        source: 'mugetsu',
        usernames: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    console.log('⏭️  Skipping Mugetsu Bot (missing Telegram credentials)')
  }

  // Strategy 4: Wayback Machine fallback (if no other sources worked)
  const successfulSources = results.filter(r => r.success && r.usernames.length > 1)
  if (successfulSources.length === 0 && cleanUsername) {
    try {
      console.log('🔍 Trying Wayback Machine as last resort...')
      
      // Check if Twitter profile snapshots exist
      const waybackResponse = await fetch(
        `https://web.archive.org/cdx/search/cdx?url=twitter.com/${cleanUsername}&output=json&limit=10`,
        {
          signal: AbortSignal.timeout(8000)
        }
      )

      if (waybackResponse.ok) {
        const waybackData = await waybackResponse.json()
        console.log('📸 Wayback Machine snapshots found:', waybackData.length - 1) // First row is headers
        
        if (waybackData.length > 1) {
          // We found snapshots, but extracting username changes requires scraping HTML
          // This is a complex process that would need separate implementation
          results.push({
            source: 'wayback',
            usernames: [],
            success: false,
            error: `Found ${waybackData.length - 1} archived snapshots, but username extraction requires HTML parsing`
          })
        } else {
          results.push({
            source: 'wayback',
            usernames: [],
            success: false,
            error: 'No archived snapshots found'
          })
        }
      }
    } catch (error) {
      console.log('❌ Wayback Machine error:', error)
      results.push({
        source: 'wayback',
        usernames: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    console.log('⏭️  Skipping Wayback Machine (other sources provided data)')
  }

  // Combine and deduplicate results
  const allUsernames: Array<{
    username: string
    start_date: string
    end_date?: string
    is_current: boolean
    sources: string[]
  }> = []

  results.forEach(result => {
    if (result.success) {
      result.usernames.forEach(username => {
        const existing = allUsernames.find(u => u.username.toLowerCase() === username.username.toLowerCase())
        if (existing) {
          existing.sources.push(result.source)
          // Keep the most complete date information
          if (!existing.start_date && username.start_date) {
            existing.start_date = username.start_date
          }
          if (!existing.end_date && username.end_date) {
            existing.end_date = username.end_date
          }
        } else {
          allUsernames.push({
            ...username,
            sources: [result.source]
          })
        }
      })
    }
  })

  // Sort by start date
  allUsernames.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const historical_names = allUsernames.filter(u => !u.is_current).map(u => u.username)
  const current_username = allUsernames.find(u => u.is_current)?.username || cleanUsername

  console.log(`✅ Found ${historical_names.length} historical usernames from ${results.filter(r => r.success).length} sources`)

  return NextResponse.json({
    sources: results,
    historical_names,
    current_username,
    usernames: allUsernames,
    total_sources: results.filter(r => r.success).length
  })
}