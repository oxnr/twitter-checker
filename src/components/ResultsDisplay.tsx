'use client'

import { useState, useEffect } from 'react'
import type { SearchResult } from '@/types'

interface ResultsDisplayProps {
  results: SearchResult
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const { user, historicalNames, dates } = results
  const [enhancedUser, setEnhancedUser] = useState<any>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const handleUserClick = (username: string) => {
    if (username) {
      // Trigger a new search for this user
      window.location.href = `/?search=${encodeURIComponent(username)}`
    }
  }

  const linkifyHandles = (text: string) => {
    // Match @username patterns but avoid email addresses
    // Negative lookbehind to avoid matching email addresses like user@domain.com
    return text.replace(/(?<![a-zA-Z0-9])@([a-zA-Z0-9_]{1,15})(?![a-zA-Z0-9_.])/g, (match, username) => {
      return `<button class="bio-handle-link" onclick="window.location.href='/?search=${encodeURIComponent(username)}'">@${username}</button>`
    })
  }

  // Load enhanced user data in background
  useEffect(() => {
    const loadEnhancedUserData = async () => {
      if (!user.bio && !user.followers_count) { // Check if we need enhanced data
        try {
          const response = await fetch(`/api/twitter-user?username=${user.username}`)
          if (response.ok) {
            const data = await response.json()
            setEnhancedUser(data)
          }
        } catch (error) {
          console.log('Failed to load enhanced user data:', error)
        }
      }
    }
    loadEnhancedUserData()
  }, [user.username, user.bio, user.followers_count])

  const displayUser = enhancedUser || user

  const VerificationBadge = ({ verified, isBlueVerified }: { verified?: boolean, isBlueVerified?: boolean }) => {
    if (verified) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" className="verification-badge verified">
          <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
        </svg>
      )
    }
    if (isBlueVerified) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" className="verification-badge blue-verified">
          <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
        </svg>
      )
    }
    return null
  }

  return (
    <div className="enhanced-results-container">
      {/* User Profile Header with Cover Image */}
      <div className="profile-header">
        {/* Cover Image - Prominent display above everything */}
        {displayUser.coverPicture && (
          <div className="cover-image-banner" style={{ backgroundImage: `url(${displayUser.coverPicture})` }} />
        )}
        
        <div className="profile-info">
          <div className="profile-left">
            {displayUser.profile_image_url && (
              <img
                src={displayUser.profile_image_url}
                alt={displayUser.name}
                className="profile-avatar"
              />
            )}
          </div>
          <div className="profile-right">
            <div className="profile-name-section">
              {/* Name with Verification Badge */}
              <div className="name-and-badge">
                <h2 className="profile-name">{displayUser.name}</h2>
                <VerificationBadge verified={displayUser.verified} isBlueVerified={displayUser.isBlueVerified} />
                {displayUser.protected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" className="protected-badge">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                )}
              </div>
              
              {/* Username and ID */}
              <div className="username-and-id">
                <span className="profile-username">@{displayUser.username}</span>
                <span className="profile-id">ID: {displayUser.id}</span>
              </div>
              
              {/* Bio with clickable handles */}
              {displayUser.bio && (
                <p 
                  className="profile-bio" 
                  dangerouslySetInnerHTML={{ __html: linkifyHandles(displayUser.bio) }}
                />
              )}
              
              {/* Enhanced Metadata Section */}
              <div className="profile-metadata-enhanced">
                {displayUser.location && (
                  <div className="metadata-item-enhanced">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="metadata-icon">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="metadata-text">{displayUser.location}</span>
                  </div>
                )}
                
                {displayUser.url && (
                  <div className="metadata-item-enhanced">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="metadata-icon">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.01 7 1.6 9.42 1.6 12.1s2.41 5.1 5.3 5.1h4v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9.1-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.89 0 5.3-2.42 5.3-5.1S19.99 7 17.1 7z"/>
                    </svg>
                    <a href={displayUser.url} target="_blank" rel="noopener noreferrer" className="metadata-link">
                      {displayUser.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}
                
                {displayUser.created_at && (
                  <div className="metadata-item-enhanced">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="metadata-icon">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <span className="metadata-text">Joined {formatJoinDate(displayUser.created_at)}</span>
                  </div>
                )}
              </div>

              <div className="profile-stats">
                <div className="stat-display">
                  <span className="stat-number">{displayUser.followers_count ? formatNumber(displayUser.followers_count) : '0'}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-display">
                  <span className="stat-number">{displayUser.following_count ? formatNumber(displayUser.following_count) : '0'}</span>
                  <span className="stat-label">Following</span>
                </div>
                <div className="stat-display">
                  <span className="stat-number">{displayUser.tweet_count ? formatNumber(displayUser.tweet_count) : '0'}</span>
                  <span className="stat-label">Tweets</span>
                </div>
                {displayUser.favouritesCount && (
                  <div className="stat-display">
                    <span className="stat-number">{formatNumber(displayUser.favouritesCount)}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                )}
                {displayUser.mediaCount && (
                  <div className="stat-display">
                    <span className="stat-number">{formatNumber(displayUser.mediaCount)}</span>
                    <span className="stat-label">Media</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Content - Only showing username history to save API credits */}
      <div className="tab-content">
        <div className="overview-content">
          <div className="historical-names-section">
            <h3>Username History</h3>
            {historicalNames.length === 0 ? (
              <div className="empty-state">
                <p>No historical usernames found for @{user.username}</p>
                <small>This account either has no name changes or isn&apos;t tracked yet</small>
              </div>
            ) : (
              <div className="historical-names-list">
                <div className="current-username">
                  <img src={user.profile_image_url} alt={user.name} className="mini-avatar" />
                  <span className="username">@{user.username}</span>
                  <span className="status current">Current</span>
                </div>
                {historicalNames.map((name, index) => (
                  <div key={index} className="historical-username">
                    <div className="historical-number">{historicalNames.length - index}</div>
                    <span className="username">@{name}</span>
                    <span className="date">
                      {dates[name] ? formatDate(dates[name][0]) : 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}