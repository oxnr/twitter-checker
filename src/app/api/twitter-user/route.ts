import { NextRequest, NextResponse } from 'next/server'

// Helper function to format usernames (e.g., "john_doe_123" -> "John Doe 123")
function formatUsername(username: string): string {
  if (!username) return '';
  return username
    .split(/[_.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  console.log('=== TWITTER USER API START ===')
  console.log('Username:', username)

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const cleanUsername = username.replace('@', '').trim()

  // Try TwitterAPI.io first (most reliable)
  const apiKey = process.env.TWITTER_API_IO_KEY
  if (apiKey) {
    try {
      console.log(`Attempting to fetch data for ${cleanUsername} from TwitterAPI.io`)
      const response = await fetch(`https://api.twitterapi.io/twitter/user/info?userName=${cleanUsername}`, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('TwitterAPI.io response:', data)
        
        if (data && data.status === 'success' && data.data) {
          const user = data.data
          const userData = {
            id: user.id,
            username: cleanUsername,
            name: user.name || formatUsername(cleanUsername),
            profile_image_url: user.profilePicture?.replace('_normal', '_400x400') || `https://unavatar.io/twitter/${cleanUsername}`,
            bio: user.description || null,
            followers_count: user.followers || null,
            following_count: user.following || null,
            tweet_count: user.statusesCount || null,
            verified: user.isVerified || user.isBlueVerified || false,
          }
          console.log('Returning TwitterAPI.io data:', userData)
          return NextResponse.json(userData)
        }
      } else {
        console.log('TwitterAPI.io request failed with status:', response.status)
      }
    } catch (error: any) {
      console.log('TwitterAPI.io error:', error.message)
    }
  }

  // Fallback to unavatar check for basic user existence
  try {
    console.log(`Falling back to unavatar check for ${cleanUsername}`)
    const avatarResponse = await fetch(`https://unavatar.io/twitter/${cleanUsername}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    if (avatarResponse.ok) {
      console.log(`User ${cleanUsername} confirmed to exist via unavatar.io`)
      const userData = {
        id: '000000000', // Default ID for fallback
        username: cleanUsername,
        name: formatUsername(cleanUsername),
        profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
        bio: null,
        followers_count: null,
        following_count: null,
        tweet_count: null,
        verified: false,
      }
      console.log('Returning fallback data:', userData)
      return NextResponse.json(userData)
    } else {
      console.log(`User ${cleanUsername} not found via unavatar.io (status: ${avatarResponse.status})`)
      return NextResponse.json({ error: `User ${cleanUsername} not found` }, { status: 404 })
    }
  } catch (error: any) {
    console.log(`Error during unavatar.io check for ${cleanUsername}:`, error.message)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}