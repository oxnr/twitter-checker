import { NextRequest, NextResponse } from 'next/server'

// Helper function to format usernames properly
function formatUsername(username: string): string {
  if (!username) return '';
  return username
    .split(/[_.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to get real display name from TwitterAPI.io directly (faster for autocomplete)
async function getRealDisplayName(username: string): Promise<string> {
  const apiKey = process.env.TWITTER_API_IO_KEY
  
  if (!apiKey) {
    console.log('No TwitterAPI.io key available for autocomplete')
    return formatUsername(username)
  }

  try {
    console.log(`Fetching real display name for ${username} from TwitterAPI.io`)
    const response = await fetch(`https://api.twitterapi.io/twitter/user/info?userName=${username}`, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(2000) // Quick timeout for autocomplete
    })

    if (response.ok) {
      const data = await response.json()
      if (data && data.status === 'success' && data.data && data.data.name) {
        console.log(`Found real name for ${username}: ${data.data.name}`)
        return data.data.name
      }
    } else {
      console.log(`TwitterAPI.io failed for ${username} with status:`, response.status)
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
    
    // Strategy 1: Try to get real display name directly from TwitterAPI.io
    console.log('Attempting to fetch real display name for autocomplete...')
    const realDisplayName = await getRealDisplayName(query)
    
    // If we got a real name that's different from formatted username, use it
    const formattedName = formatUsername(query)
    const displayName = (realDisplayName !== formattedName) ? realDisplayName : formattedName
    
    // Always provide a suggestion for responsive autocomplete
    suggestions.push({
      username: query,
      name: displayName,
      profile_image_url: `https://unavatar.io/twitter/${query}`,
    })

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