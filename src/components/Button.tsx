import React from 'react'

type ButtonVariant = 'blue' | 'full' | 'black' | 'line' | 'icon-font' | 'font' | 'primary' | 'secondary' | 'danger' | 'disabled'

interface ButtonProps {
  variant?: ButtonVariant
  children: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
}

interface VariantStyle {
  backgroundColor?: string
  color: string
  border?: string
  padding?: string
  cursor?: string
  opacity?: number
}

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  blue: {
    backgroundColor: '#2A6DE7',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 15px',
  },
  full: {
    backgroundColor: '#2A6DE7',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 15px',
  },
  black: {
    backgroundColor: 'transparent',
    color: '#333333',
    border: '1px solid #CCCCCC',
    padding: '4px 15px',
  },
  line: {
    backgroundColor: 'transparent',
    color: '#333333',
    border: '1px solid #CCCCCC',
    padding: '4px 15px',
  },
  'icon-font': {
    backgroundColor: 'transparent',
    color: '#2A6DE7',
    border: 'none',
    padding: '0',
  },
  font: {
    backgroundColor: 'transparent',
    color: '#2A6DE7',
    border: 'none',
    padding: '0',
  },
  // Backward-compatible aliases
  primary: {
    backgroundColor: '#2A6DE7',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 15px',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#333333',
    border: '1px solid #CCCCCC',
    padding: '4px 15px',
  },
  danger: {
    backgroundColor: '#DA1E28',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 15px',
  },
  disabled: {
    backgroundColor: '#87B0FB',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 15px',
    cursor: 'not-allowed',
    opacity: 0.9,
  },
}

const Button: React.FC<ButtonProps> = ({ variant = 'secondary', children, icon, onClick }) => {
  const style = variantStyles[variant]

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding ?? '4px 15px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: "'PingFang SC', sans-serif",
        fontWeight: 400,
        lineHeight: '20px',
        cursor: style.cursor ?? 'pointer',
        whiteSpace: 'nowrap',
        gap: '2px',
        backgroundColor: style.backgroundColor,
        color: style.color,
        border: style.border ?? 'none',
        opacity: style.opacity,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center', width: 16, height: 16 }}>{icon}</span>}
      {children}
    </button>
  )
}

export default Button
