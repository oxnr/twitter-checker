import { NextRequest, NextResponse } from 'next/server'

// Helper function to format usernames properly
function formatUsername(username: string): string {
  if (!username) return '';
  return username
    .split(/[_.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to get real display name from twitter-user API
async function getRealDisplayName(username: string, baseUrl: string): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/api/twitter-user?username=${username}`, {
      signal: AbortSignal.timeout(3000) // Quick timeout for autocomplete
    })
    
    if (response.ok) {
      const userData = await response.json()
      return userData.name || formatUsername(username)
    }
  } catch (error) {
    console.log(`Failed to get real name for ${username}:`, error)
  }
  
  return formatUsername(username)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  console.log('=== AUTOCOMPLETE API START ===')
  console.log('Raw query:', query)

  if (!query || query.length < 1) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    let suggestions: any[] = []
    const baseUrl = request.url.split('/api/')[0] // Get base URL for internal API calls
    
    // Check if user exists via Memory.lol or unavatar
    let userExists = false
    
    // First try Memory.lol search for exact match
    try {
      const memoryResponse = await fetch(`https://api.memory.lol/v1/tw/${query}`, {
        headers: {
          'User-Agent': 'Twitter-History-App/1.0',
          'Accept': 'application/json',
        },
      })
      
      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json()
        console.log('Memory.lol autocomplete response:', memoryData)
        
        if (memoryData.accounts && memoryData.accounts.length > 0) {
          userExists = true
        }
      }
    } catch (error) {
      console.log('Memory.lol autocomplete failed:', error)
    }
    
    // If not found in Memory.lol, check unavatar
    if (!userExists) {
      try {
        const avatarResponse = await fetch(`https://unavatar.io/twitter/${query}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        })
        
        if (avatarResponse.ok) {
          userExists = true
        }
      } catch (error) {
        console.log('Unavatar check failed:', error)
      }
    }

    // If user exists, get the real display name and add suggestion
    if (userExists) {
      const realDisplayName = await getRealDisplayName(query, baseUrl)
      
      suggestions.push({
        username: query,
        name: realDisplayName,
        profile_image_url: `https://unavatar.io/twitter/${query}`,
      })
    } else {
      // Still add suggestion with formatted name for typing experience
      suggestions.push({
        username: query,
        name: formatUsername(query),
        profile_image_url: `https://unavatar.io/twitter/${query}`,
      })
    }

    console.log('Enhanced autocomplete suggestions:', suggestions)
    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Autocomplete error:', error)
    
    // Simple fallback with proper formatting
    const fallbackSuggestions = [{
      username: query,
      name: formatUsername(query),
      profile_image_url: `https://unavatar.io/twitter/${query}`,
    }]
    
    return NextResponse.json({ suggestions: fallbackSuggestions })
  }
}