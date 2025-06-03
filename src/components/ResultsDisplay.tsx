'use client'

import type { SearchResult } from '@/types'

interface ResultsDisplayProps {
  results: SearchResult
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const { user, historicalNames, dates } = results

  return (
    <div className="results-table-container">
      {/* User profile section */}
      <div className="user-profile-section">
        <div className="user-info-row">
          <div className="user-basic-info">
            {user.profile_image_url && (
              <img
                src={user.profile_image_url}
                alt={user.name}
                style={{ width: '80px', height: '80px' }}
                className="rounded-full border border-gray-300 flex-shrink-0"
              />
            )}
            <div className="user-details">
              <h3 className="user-display-name">{user.name}</h3>
              <p className="user-handle">@{user.username}</p>
              <p className="user-id" style={{ fontSize: '0.75rem', color: 'color-mix(in hsl, canvasText, transparent 50%)', fontFamily: 'monospace' }}>
                ID: {user.id}
              </p>
              {(user.followers_count !== undefined && user.followers_count !== null) || 
               (user.following_count !== undefined && user.following_count !== null) || 
               (user.tweet_count !== undefined && user.tweet_count !== null) ? (
                <div className="user-stats">
                  {user.followers_count !== undefined && user.followers_count !== null && <span>{user.followers_count.toLocaleString()} followers</span>}
                  {user.following_count !== undefined && user.following_count !== null && <span>{user.following_count.toLocaleString()} following</span>}
                  {user.tweet_count !== undefined && user.tweet_count !== null && <span>{user.tweet_count.toLocaleString()} tweets</span>}
                </div>
              ) : null}
              {user.bio && (
                <div className="user-bio">
                  <p>{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical names table */}
      <div className="table-header">
        <div className="table-row">
          <div className="table-cell header-cell">handle</div>
          <div className="table-cell header-cell">date</div>
          <div className="table-cell header-cell">current</div>
        </div>
      </div>
      
      <div className="table-body">
        {historicalNames.length === 0 ? (
          <div className="table-row empty-row">
            <div className="table-cell" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: 'color-mix(in hsl, canvasText, transparent 50%)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                no historical names found for @{user.username}
              </div>
              <div style={{ color: 'color-mix(in hsl, canvasText, transparent 70%)', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                this account either has no name changes or isn&apos;t tracked yet
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Current username */}
            <div className="table-row current-row">
              <div className="table-cell">
                <div className="handle-cell">
                  {user.profile_image_url && (
                    <img
                      src={user.profile_image_url}
                      alt={user.name}
                      style={{ width: '120px !important', height: '120px !important', minWidth: '120px', minHeight: '120px' }}
                      className="rounded-full border border-gray-300 flex-shrink-0"
                    />
                  )}
                  <span className="handle-text">@{user.username}</span>
                </div>
              </div>
              <div className="table-cell date-cell">current</div>
              <div className="table-cell current-cell">
                <div className="status-badge current">✓</div>
              </div>
            </div>
            
            {/* Historical usernames */}
            {historicalNames.map((name, index) => (
              <div key={index} className="table-row">
                <div className="table-cell">
                  <div className="handle-cell">
                    <div className="handle-number">{historicalNames.length - index}</div>
                    <span className="handle-text">@{name}</span>
                  </div>
                </div>
                <div className="table-cell date-cell">
                  {dates[name] ? 
                    new Date(dates[name][0]).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: '2-digit'
                    }) : 
                    'unknown'
                  }
                </div>
                <div className="table-cell current-cell">
                  <div className="status-badge past">-</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}