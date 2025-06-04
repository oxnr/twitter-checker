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
            verified: user.isVerified || false,
            isBlueVerified: user.isBlueVerified || false,
            verifiedType: user.verifiedType || null,
            created_at: user.createdAt || null,
            location: user.location || null,
            url: user.url || null,
            protected: user.protected || false,
            favouritesCount: user.favouritesCount || null,
            mediaCount: user.mediaCount || null,
            canDm: user.canDm || false,
            coverPicture: user.coverPicture || null,
          }
          console.log('Returning TwitterAPI.io data:', userData)
          return NextResponse.json(userData)
        }
      } else {
        const errorText = await response.text()
        console.log('TwitterAPI.io request failed with status:', response.status)
        console.log('TwitterAPI.io error response:', errorText)
        
        // Check if it's a credit issue
        if (response.status === 402 || errorText.includes('Credits is not enough')) {
          console.log('⚠️  TwitterAPI.io Credits Issue Detected')
          console.log('💳 Please check your TwitterAPI.io dashboard: https://twitterapi.io/dashboard')
          console.log('🔑 API Key being used:', apiKey?.substring(0, 8) + '...')
        }
      }
    } catch (error: any) {
      console.log('TwitterAPI.io error:', error.message)
    }
  }

  // Enhanced fallback: Try multiple sources for better user data
  try {
    console.log(`Falling back to enhanced data collection for ${cleanUsername}`)
    
    // Check user existence via unavatar
    const avatarResponse = await fetch(`https://unavatar.io/twitter/${cleanUsername}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    if (avatarResponse.ok) {
      console.log(`User ${cleanUsername} confirmed to exist via unavatar.io`)
      
      // Try to get additional metadata from unavatar JSON endpoint
      let enhancedName = formatUsername(cleanUsername)
      try {
        const avatarJsonResponse = await fetch(`https://unavatar.io/twitter/${cleanUsername}?json`, {
          signal: AbortSignal.timeout(3000)
        })
        
        if (avatarJsonResponse.ok) {
          const avatarData = await avatarJsonResponse.json()
          console.log('Unavatar JSON response:', avatarData)
          
          // Some services provide display names in the JSON response
          if (avatarData.name && avatarData.name !== cleanUsername) {
            enhancedName = avatarData.name
          }
        }
      } catch (jsonError) {
        console.log('Failed to get JSON data from unavatar:', jsonError)
      }
      
      // Try to get basic info from nitter (alternative Twitter frontend)
      try {
        const nitterResponse = await fetch(`https://nitter.net/${cleanUsername}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(5000)
        })
        
        if (nitterResponse.ok) {
          const nitterHtml = await nitterResponse.text()
          
          // Try to extract display name from nitter HTML
          const displayNameMatch = nitterHtml.match(/<title>([^@]+).*<\/title>/)
          if (displayNameMatch && displayNameMatch[1] && displayNameMatch[1].trim() !== cleanUsername) {
            enhancedName = displayNameMatch[1].trim()
            console.log(`Found display name from nitter: ${enhancedName}`)
          }
          
          // Try to extract follower counts from nitter
          const followerMatch = nitterHtml.match(/(\d+(?:,\d+)*)\s*Followers/i)
          const followingMatch = nitterHtml.match(/(\d+(?:,\d+)*)\s*Following/i)
          
          let followersCount = null
          let followingCount = null
          
          if (followerMatch) {
            followersCount = parseInt(followerMatch[1].replace(/,/g, ''))
            console.log(`Found followers count from nitter: ${followersCount}`)
          }
          
          if (followingMatch) {
            followingCount = parseInt(followingMatch[1].replace(/,/g, ''))
            console.log(`Found following count from nitter: ${followingCount}`)
          }
          
          const userData = {
            id: '000000000', // Default ID for fallback
            username: cleanUsername,
            name: enhancedName,
            profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
            bio: null,
            followers_count: followersCount,
            following_count: followingCount,
            tweet_count: null,
            verified: false,
          }
          console.log('Returning enhanced fallback data:', userData)
          return NextResponse.json(userData)
        }
      } catch (nitterError) {
        console.log('Nitter fallback failed:', nitterError)
      }
      
      // Basic fallback if enhanced methods fail
      const userData = {
        id: '000000000', // Default ID for fallback
        username: cleanUsername,
        name: enhancedName,
        profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
        bio: null,
        followers_count: null,
        following_count: null,
        tweet_count: null,
        verified: false,
      }
      console.log('Returning basic fallback data:', userData)
      return NextResponse.json(userData)
    } else {
      console.log(`User ${cleanUsername} not found via unavatar.io (status: ${avatarResponse.status})`)
      return NextResponse.json({ error: `User ${cleanUsername} not found` }, { status: 404 })
    }
  } catch (error: any) {
    console.log(`Error during enhanced fallback for ${cleanUsername}:`, error.message)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}