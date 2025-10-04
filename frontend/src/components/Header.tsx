import React from 'react'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
  title: string
  subtitle?: string
}

export function Header({ onMenuToggle, title, subtitle }: HeaderProps) {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--color-gray-200)',
      padding: 'var(--spacing-lg) var(--spacing-xl)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <button
        onClick={onMenuToggle}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          color: 'var(--color-gray-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-gray-100)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none'
        }}
      >
        <Menu size={24} />
      </button>
      
      <div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-gray-900)',
          margin: 0
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--color-gray-600)',
            margin: '4px 0 0 0'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
