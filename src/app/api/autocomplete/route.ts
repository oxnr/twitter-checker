import { NextRequest, NextResponse } from 'next/server'

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
          suggestions.push({
            username: query,
            name: query.charAt(0).toUpperCase() + query.slice(1),
            profile_image_url: `https://unavatar.io/twitter/${query}`,
          })
        }
      }
    } catch (error) {
      console.log('Memory.lol autocomplete failed:', error)
    }

    // Only suggest the exact query - no generic variations
    const variations = [
      query, // exact match only
    ]

    // Try to find actual existing accounts
    const validationPromises = variations.slice(0, 5).map(async (variation) => {
      try {
        // Quick check if this username likely exists
        const avatarResponse = await fetch(`https://unavatar.io/twitter/${variation}`, {
          method: 'HEAD',
        })
        
        if (avatarResponse.ok) {
          // Get enhanced user data with real display name
          let enhancedData = null
          try {
            const baseUrl = request.url.split('/api/')[0]
            const userApiUrl = `${baseUrl}/api/twitter-user?username=${variation}`
            const userResponse = await fetch(userApiUrl)
            if (userResponse.ok) {
              enhancedData = await userResponse.json()
            }
          } catch (error) {
            console.log('Failed to get enhanced autocomplete data:', error)
          }

          return {
            username: variation,
            name: enhancedData?.name || variation.charAt(0).toUpperCase() + variation.slice(1),
            profile_image_url: enhancedData?.profile_image_url || `https://unavatar.io/twitter/${variation}`,
          }
        }
      } catch (error) {
        // Skip invalid usernames
      }
      return null
    })

    try {
      const validationResults = await Promise.allSettled(validationPromises)
      
      validationResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          // Avoid duplicates
          if (!suggestions.some(s => s.username === result.value!.username)) {
            suggestions.push(result.value)
          }
        }
      })
    } catch (error) {
      console.log('Validation failed:', error)
    }

    // Always ensure the exact query is included as first suggestion with enhanced data
    if (!suggestions.some(s => s.username === query)) {
      // Get enhanced user data for the main suggestion
      let enhancedData = null
      try {
        const baseUrl = request.url.split('/api/')[0]
        const userApiUrl = `${baseUrl}/api/twitter-user?username=${query}`
        const userResponse = await fetch(userApiUrl)
        if (userResponse.ok) {
          enhancedData = await userResponse.json()
        }
      } catch (error) {
        console.log('Failed to get enhanced data for main suggestion:', error)
      }

      suggestions.unshift({
        username: query,
        name: enhancedData?.name || query.charAt(0).toUpperCase() + query.slice(1),
        profile_image_url: enhancedData?.profile_image_url || `https://unavatar.io/twitter/${query}`,
      })
    }

    console.log('Final autocomplete suggestions:', suggestions)
    return NextResponse.json({ suggestions: suggestions.slice(0, 4) })

  } catch (error) {
    console.error('Autocomplete error:', error)
    
    // Simple fallback
    const fallbackSuggestions = [{
      username: query,
      name: query.charAt(0).toUpperCase() + query.slice(1),
      profile_image_url: `https://unavatar.io/twitter/${query}`,
    }]
    
    return NextResponse.json({ suggestions: fallbackSuggestions })
  }
}