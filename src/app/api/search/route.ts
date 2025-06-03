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
      const memoryResponse = await fetch(`https://api.memory.lol/v1/tw/${cleanUsername}`, {
        headers,
      })

      console.log('Memory.lol response status:', memoryResponse.status)

      if (memoryResponse.ok) {
        const memoryData: MemoryLolResponse = await memoryResponse.json()
        console.log('Memory.lol data:', memoryData)
        
        if (memoryData.accounts && memoryData.accounts.length > 0) {
          const account = memoryData.accounts[0]
          const screenNames = account.screen_names
          
          // Get all historical names except the current one
          const allNames = Object.keys(screenNames)
          const historicalNames = allNames.filter(name => name.toLowerCase() !== cleanUsername.toLowerCase())
          
          // Format dates
          const dates: Record<string, string[]> = {}
          Object.entries(screenNames).forEach(([name, nameDates]) => {
            if (nameDates && nameDates.length > 0) {
              dates[name] = nameDates
            }
          })

          // Get enhanced user data
          let enhancedUserData: any = {}
          try {
            const userResponse = await fetch(`${request.url.split('/api/')[0]}/api/twitter-user?username=${cleanUsername}`)
            if (userResponse.ok) {
              enhancedUserData = await userResponse.json()
            }
          } catch (error) {
            console.log('Failed to get enhanced user data for Memory.lol result:', error)
          }

          const user: TwitterUser = {
            id: account.id_str,
            username: cleanUsername,
            name: enhancedUserData.name || cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
            profile_image_url: enhancedUserData.profile_image_url || `https://unavatar.io/twitter/${cleanUsername}`,
            bio: enhancedUserData.bio,
            followers_count: enhancedUserData.followers_count,
            following_count: enhancedUserData.following_count,
            tweet_count: enhancedUserData.tweet_count,
            verified: enhancedUserData.verified,
          }

          const result: SearchResult = {
            user,
            historicalNames,
            dates,
          }

          console.log('Returning Memory.lol result:', result)
          memoryWorked = true
          return NextResponse.json(result)
        }
      }
    } catch (memoryError) {
      console.log('Memory.lol API failed:', memoryError)
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
                    id: fetchedUserData.id || '000000000', // Use ID from fetched data if available
                    username: cleanUsername,
                    name: fetchedUserData.name || formatUsername(cleanUsername), // Use name from fetched data
                    profile_image_url: fetchedUserData.profile_image_url || `https://unavatar.io/twitter/${cleanUsername}`,
                    bio: fetchedUserData.bio,
                    followers_count: fetchedUserData.followers_count,
                    following_count: fetchedUserData.following_count,
                    tweet_count: fetchedUserData.tweet_count,
                    verified: fetchedUserData.verified,
                };
                console.log('Enhanced user created from /api/twitter-user:', enhancedUser);
            } else {
                console.log('Twitter user API failed, using basic fallback for current user.');
                enhancedUser = {
                    id: '000000000',
                    username: cleanUsername,
                    name: formatUsername(cleanUsername), // Use helper for formatting
                    profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
                    // Other fields remain null/undefined
                };
            }
        } catch (error) {
            console.log('Failed to get enhanced user data:', error);
            enhancedUser = {
                id: '000000000',
                username: cleanUsername,
                name: formatUsername(cleanUsername), // Use helper for formatting
                profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
                 // Other fields remain null/undefined
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