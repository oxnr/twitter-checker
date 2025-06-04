import { NextRequest, NextResponse } from 'next/server'
import type { SearchResult, TwitterUser } from '@/types'

interface MemoryLolResponse {
  accounts: Array<{
    id: number
    id_str: string
    screen_names: Record<string, string[]>
  }>
}

export async function GET(request: NextRequest) {
  console.log('=== SEARCH API START ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  console.log('Raw username from params:', username)
  console.log('All search params:', Object.fromEntries(searchParams.entries()))

  if (!username || username.trim() === '') {
    console.log('ERROR: No username provided')
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const cleanUsername = username.replace('@', '').trim()
  console.log('Clean username:', cleanUsername)

  try {
    // Try to fetch from Memory.lol API (no authentication needed)
    const headers: Record<string, string> = {
      'User-Agent': 'Twitter-History-App/1.0',
      'Accept': 'application/json',
    }
    
    let memoryWorked = false
    
    try {
      // Use new multi-source username history API
      const baseUrl = request.url.split('/api/')[0]
      const historyResponse = await fetch(`${baseUrl}/api/username-history?username=${cleanUsername}`)
      
      console.log('Username history API response status:', historyResponse.status)

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        console.log('Username history data:', historyData)
        
        if (historyData.historical_names && historyData.historical_names.length > 0) {
          // Get enhanced user data
          let enhancedUserData: any = {}
          try {
            const userResponse = await fetch(`${baseUrl}/api/twitter-user?username=${cleanUsername}`)
            if (userResponse.ok) {
              enhancedUserData = await userResponse.json()
            }
          } catch (error) {
            console.log('Failed to get enhanced user data:', error)
          }

          // Create dates object from usernames data
          const dates: Record<string, string[]> = {}
          if (historyData.usernames) {
            historyData.usernames.forEach((entry: any) => {
              dates[entry.username] = [entry.start_date, entry.end_date || '2025-02-25']
            })
          }

          const user: TwitterUser = {
            id: enhancedUserData.id || '000000000',
            username: cleanUsername,
            name: enhancedUserData.name || cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
            profile_image_url: enhancedUserData.profile_image_url || `https://unavatar.io/twitter/${cleanUsername}`,
            bio: enhancedUserData.bio || undefined,
            followers_count: enhancedUserData.followers_count || undefined,
            following_count: enhancedUserData.following_count || undefined,
            tweet_count: enhancedUserData.tweet_count || undefined,
            verified: enhancedUserData.verified || false,
            isBlueVerified: enhancedUserData.isBlueVerified || false,
            verifiedType: enhancedUserData.verifiedType || undefined,
            created_at: enhancedUserData.created_at || undefined,
            location: enhancedUserData.location || undefined,
            url: enhancedUserData.url || undefined,
            protected: enhancedUserData.protected || false,
            favouritesCount: enhancedUserData.favouritesCount || undefined,
            mediaCount: enhancedUserData.mediaCount || undefined,
            canDm: enhancedUserData.canDm || false,
            coverPicture: enhancedUserData.coverPicture || null,
          }

          const result: SearchResult = {
            user,
            historicalNames: historyData.historical_names,
            dates,
          }

          console.log('Returning multi-source username history result:', result)
          memoryWorked = true
          return NextResponse.json(result)
        } else {
          console.log('No historical usernames found from any source')
        }
      }
    } catch (historyError) {
      console.log('Username history API failed:', historyError)
    }

    // If Memory.lol worked, we would have returned. If not, proceed to fetch current user details only.
    // console.log('Memory.lol did not provide usable data or failed.')
    // Removed the hardcoded testData block

    // If memory.lol didn't provide data, we just get the current user's info
    // and return empty historical data.
    if (!memoryWorked) {
        console.log('Memory.lol did not provide usable data. Fetching current user info only.');
        
        let enhancedUser: TwitterUser;
        try {
            const baseUrl = request.url.split('/api/')[0];
            const userApiUrl = `${baseUrl}/api/twitter-user?username=${cleanUsername}`;
            console.log('Making internal API call to:', userApiUrl);
            
            const userResponse = await fetch(userApiUrl);
            console.log('Twitter user API response status:', userResponse.status);
            
            if (userResponse.ok) {
                const fetchedUserData = await userResponse.json();
                console.log('Twitter user API response data:', fetchedUserData);
                
                enhancedUser = {
                    id: fetchedUserData.id || '000000000',
                    username: cleanUsername,
                    name: fetchedUserData.name || formatUsername(cleanUsername),
                    profile_image_url: fetchedUserData.profile_image_url || `https://unavatar.io/twitter/${cleanUsername}`,
                    bio: fetchedUserData.bio || undefined,
                    followers_count: fetchedUserData.followers_count || undefined,
                    following_count: fetchedUserData.following_count || undefined,
                    tweet_count: fetchedUserData.tweet_count || undefined,
                    verified: fetchedUserData.verified || false,
                    isBlueVerified: fetchedUserData.isBlueVerified || false,
                    verifiedType: fetchedUserData.verifiedType || undefined,
                    created_at: fetchedUserData.created_at || undefined,
                    location: fetchedUserData.location || undefined,
                    url: fetchedUserData.url || undefined,
                    protected: fetchedUserData.protected || false,
                    favouritesCount: fetchedUserData.favouritesCount || undefined,
                    mediaCount: fetchedUserData.mediaCount || undefined,
                    canDm: fetchedUserData.canDm || false,
                    coverPicture: fetchedUserData.coverPicture || null,
                };
                console.log('Enhanced user created from /api/twitter-user:', enhancedUser);
            } else {
                console.log('Twitter user API failed, using basic fallback for current user.');
                enhancedUser = {
                    id: '000000000',
                    username: cleanUsername,
                    name: formatUsername(cleanUsername),
                    profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
                    bio: undefined,
                    followers_count: undefined,
                    following_count: undefined,
                    tweet_count: undefined,
                    verified: false,
                    isBlueVerified: false,
                    verifiedType: undefined,
                    created_at: undefined,
                    location: undefined,
                    url: undefined,
                    protected: false,
                    favouritesCount: undefined,
                    mediaCount: undefined,
                    canDm: false,
                    coverPicture: undefined,
                };
            }
        } catch (error) {
            console.log('Failed to get enhanced user data:', error);
            enhancedUser = {
                id: '000000000',
                username: cleanUsername,
                name: formatUsername(cleanUsername),
                profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
                bio: undefined,
                followers_count: undefined,
                following_count: undefined,
                tweet_count: undefined,
                verified: false,
                isBlueVerified: false,
                verifiedType: undefined,
                created_at: undefined,
                location: undefined,
                url: undefined,
                protected: false,
                favouritesCount: undefined,
                mediaCount: undefined,
                canDm: false,
                coverPicture: undefined,
            };
        }

        const result: SearchResult = {
            user: enhancedUser,
            historicalNames: [], // No historical names if memory.lol failed
            dates: {},
        };

        console.log('Returning current user data with no historical names:', result);
        return NextResponse.json(result);
    }
    // The case where memoryWorked is true is handled within the memory.lol try block by returning directly.
    // This part should ideally not be reached if memoryWorked is true.
    // Adding a safeguard or clarifying logic if memoryWorked is true and somehow we reach here.
    // However, the current structure with `return NextResponse.json(result)` inside memory.lol block handles it.

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search for user' },
      { status: 500 }
    )
  }
}

// Helper function (ensure it's available or define it if not already in scope)
// For now, assuming formatUsername might be needed if not using fetchedUserData.name directly.
function formatUsername(username: string): string {
  if (!username) return '';
  return username
    .split(/[_.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}