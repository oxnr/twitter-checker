'use client'

import { useState, useEffect, useCallback } from 'react'
import SearchBox from '@/components/SearchBox'
import ResultsDisplay from '@/components/ResultsDisplay'
import type { SearchResult } from '@/types'

export default function Home() {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleSearch = useCallback(async (username: string) => {
    if (!username.trim()) return

    console.log('Frontend: Starting search for:', username)
    setLoading(true)
    setError(null)
    
    try {
      const cleanUsername = username.replace('@', '').trim()
      const url = `/api/search?username=${encodeURIComponent(cleanUsername)}`
      console.log('Frontend: Making request to:', url)
      
      const response = await fetch(url)
      console.log('Frontend: Response status:', response.status)
      console.log('Frontend: Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorData = null
        try {
          const text = await response.text()
          console.log('Frontend: Raw error response:', text)
          errorData = text ? JSON.parse(text) : null
        } catch (parseError) {
          console.error('Frontend: Error parsing response:', parseError)
        }
        
        console.error('Frontend: Parsed error data:', errorData)
        
        if (errorData?.message) {
          throw new Error(errorData.message)
        } else if (errorData?.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error(`Search failed (${response.status}). Try: elonmusk, libsoftiktok, OSINT_Ukraine, or jack`)
        }
      }
      
      const data = await response.json()
      console.log('Frontend: Success response:', data)
      setResults(data)
    } catch (err) {
      console.error('Frontend: Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize theme on component mount
  useEffect(() => {
    const html = document.documentElement
    // Check for stored theme preference or use system preference
    const storedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const theme = storedTheme || (prefersDark ? 'dark' : 'light')
    html.dataset.theme = theme
    setIsDarkMode(theme === 'dark')
  }, [])

  // Handle URL search parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      handleSearch(searchParam)
      // Clear the URL parameter after triggering search
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [handleSearch])

  return (
    <>
      {/* Logo and Title at top */}
      <header className="site-header">
        <div className="logo">
          <svg viewBox="0 0 32 32" className="logo-icon">
            <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 16c0-2 2-4 4-4s4 2 4 4-2 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M16 12c2 0 4 2 4 4s-2 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
            <circle cx="20" cy="16" r="1" fill="currentColor"/>
          </svg>
        </div>
        <h1 className="site-title">
          PastSelf
        </h1>
        <p className="site-subtitle">discover who they used to be</p>
      </header>

      <main className="main-content">
        {/* Large search window */}
        <div className="search-container-wrapper">
          <SearchBox onSearch={handleSearch} loading={loading} />
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Results card */}
        {results && (
          <div className="results-card">
            <div className="card-header">
              <span>overview</span>
              <span className="badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                </svg>
                <span>{results.historicalNames.length}</span>
              </span>
            </div>
            
            <div className="card-content">
              <ResultsDisplay results={results} />
            </div>
          </div>
        )}
      </main>

      {/* Theme toggle */}
      <button 
        className="theme-toggle"
        onClick={() => {
          const html = document.documentElement
          const currentTheme = html.dataset.theme || 'light'
          const newTheme = currentTheme === 'light' ? 'dark' : 'light'
          html.dataset.theme = newTheme
          localStorage.setItem('theme', newTheme)
          setIsDarkMode(newTheme === 'dark')
        }}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          // Sun icon for dark mode (switch to light)
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,1,69.66,58.34l16,16a8,8,0,0,1-11.32,11.32Zm0,116.68-16-16a8,8,0,0,1,11.32-11.32l16,16a8,8,0,0,1-11.32,11.32ZM192,72a8,8,0,0,1,5.66-2.34l16-16a8,8,0,0,1,11.32,11.32l-16,16A8,8,0,0,1,192,72Zm5.66,114.34a8,8,0,0,1-11.32,11.32l-16-16a8,8,0,0,1,11.32-11.32ZM48,128a8,8,0,0,1-8-8H16a8,8,0,0,1,0-16H40A8,8,0,0,1,48,128Zm80,80a8,8,0,0,1-8,8V240a8,8,0,0,1,0,16V216A8,8,0,0,1,128,208Zm112-88a8,8,0,0,1-8,8H208a8,8,0,0,1,0-16h24A8,8,0,0,1,240,120Z"/>
          </svg>
        ) : (
          // Moon icon for light mode (switch to dark)
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"/>
          </svg>
        )}
      </button>
    </>
  )
}