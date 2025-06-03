'use client'

import { useState, useRef } from 'react'

interface SearchBoxProps {
  onSearch: (username: string) => void
  loading: boolean
}

export default function SearchBox({ onSearch, loading }: SearchBoxProps) {
  const [input, setInput] = useState('@')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanInput = input.replace('@', '').trim()
    if (cleanInput) {
      onSearch(cleanInput)
      setShowSuggestions(false)
    }
  }

  const fetchSuggestions = async (cleanValue: string) => {
    try {
      const url = `/api/autocomplete?q=${encodeURIComponent(cleanValue)}`
      console.log('Autocomplete: Making request to:', url, 'for value:', cleanValue)
      
      const response = await fetch(url)
      console.log('Autocomplete: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Autocomplete: Response data:', data)
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } else {
        console.error('Autocomplete: Error response:', response.status)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Autocomplete: Request failed:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (value: string) => {
    // Always ensure the value starts with @
    let processedValue = value
    if (!processedValue.startsWith('@')) {
      processedValue = '@' + processedValue
    }
    
    // Prevent deleting the @ symbol
    if (processedValue === '') {
      processedValue = '@'
    }
    
    setInput(processedValue)
    
    // Remove @ for API calls
    const cleanValue = processedValue.replace('@', '').trim()
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    if (cleanValue.length > 1) { // Only start searching after 2+ characters
      // Debounce API calls - wait 500ms after user stops typing
      debounceTimerRef.current = setTimeout(() => {
        console.log('Debounced search triggered for:', cleanValue)
        fetchSuggestions(cleanValue)
      }, 500)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    setInput('@' + suggestion.username)
    setShowSuggestions(false)
    onSearch(suggestion.username)
  }


  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="search-container">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="@"
          className="search-input"
          disabled={loading}
        />
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="autocomplete-item"
            >
              {suggestion.profile_image_url && (
                <img
                  src={suggestion.profile_image_url}
                  alt={suggestion.name}
                  className="autocomplete-thumbnail"
                />
              )}
              <div className="autocomplete-content">
                <div className="autocomplete-username">@{suggestion.username}</div>
                <div className="autocomplete-name">{suggestion.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}