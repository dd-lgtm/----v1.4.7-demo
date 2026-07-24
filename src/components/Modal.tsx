import React, { useEffect, useCallback } from 'react'

/* ─── Shared inline-style constants ─── */
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
}

const containerBase: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
}

const btnBase: React.CSSProperties = {
  padding: '4px 15px',
  borderRadius: 4,
  fontSize: 14,
  fontFamily: "'PingFang SC', sans-serif",
  fontWeight: 400,
  cursor: 'pointer',
  transition: 'filter 0.15s ease, transform 0.1s ease',
}

/* ─── Types ─── */
export interface ModalAction {
  label: string
  onClick: () => void
  /** 'default' = outlined, 'primary' = blue bg, 'danger' = red bg */
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}

interface ConfirmModalProps {
  variant?: 'confirm'
  visible: boolean
  onClose: () => void
  title: string
  description?: string
  actions?: ModalAction[]
  width?: number
}

interface FormModalProps {
  variant: 'form'
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children?: React.ReactNode
  actions?: ModalAction[]
  width?: number
}

export type ModalProps = ConfirmModalProps | FormModalProps

/* ─── Helpers ─── */
const hoverBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.filter = 'brightness(0.92)'
}
const activeBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.filter = 'brightness(0.85)'
  e.currentTarget.style.transform = 'scale(0.97)'
}
const resetBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.filter = 'none'
  e.currentTarget.style.transform = 'none'
}

function actionStyle(action: ModalAction): React.CSSProperties {
  if (action.variant === 'danger') {
    return {
      ...btnBase,
      backgroundColor: '#FA4D56',
      color: '#FFFFFF',
      border: 'none',
      opacity: action.disabled ? 0.5 : 1,
      cursor: action.disabled ? 'not-allowed' : 'pointer',
    }
  }
  if (action.variant === 'primary') {
    return {
      ...btnBase,
      backgroundColor: action.disabled ? '#BFBFBF' : '#2A6DE7',
      color: '#FFFFFF',
      border: 'none',
      cursor: action.disabled ? 'not-allowed' : 'pointer',
    }
  }
  return {
    ...btnBase,
    backgroundColor: '#FFFFFF',
    color: '#333333',
    border: '1px solid #CCCCCC',
  }
}

/* ─── Close icon (shared) ─── */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="#333333" />
  </svg>
)

/* ─── Warning icon (confirm variant) ─── */
const WarningIcon = () => (
  <img src="/icons/error-warning-fill.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
)

/* ─── Component ─── */
const Modal: React.FC<ModalProps> = (props) => {
  const { visible, onClose, actions = [] } = props
  const width = props.width ?? (props.variant === 'form' ? 600 : 400)

  /* Close on Escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [visible, handleKey])

  if (!visible) return null

  /* ── Render actions bar ── */
  const renderActions = () => {
    if (actions.length === 0) return null
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
        {actions.map((a) => (
          <button
            key={a.label}
            style={actionStyle(a)}
            disabled={a.disabled}
            onClick={a.onClick}
            onMouseEnter={hoverBtn}
            onMouseLeave={resetBtn}
            onMouseDown={activeBtn}
            onMouseUp={resetBtn}
          >{a.label}</button>
        ))}
      </div>
    )
  }

  /* ── Confirm variant (Figma 1408-2688) ── */
  if (props.variant !== 'form') {
    const { title, description } = props
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          style={{ ...containerBase, width, padding: 24, gap: 24 }}
        >
          {/* Title area with icon */}
          <div style={{ display: 'flex', gap: 12 }}>
            <WarningIcon />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: description ? 12 : 0 }}>
              <span style={{
                fontSize: 16, fontWeight: 600, color: '#333333',
                fontFamily: "'PingFang SC', sans-serif", lineHeight: '22px',
              }}>{title}</span>
              {description && (
                <span style={{
                  fontSize: 14, fontWeight: 400, color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif", lineHeight: '20px',
                }}>{description}</span>
              )}
            </div>
          </div>
          {/* Actions */}
          {renderActions()}
        </div>
      </div>
    )
  }

  /* ── Form variant (Figma 1404-1657) ── */
  const { title, subtitle, children } = props
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ ...containerBase, width, gap: 36 }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px',
          gap: 4,
          borderBottom: '1px solid #E5E5E5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: 18, fontWeight: 600, color: '#333333',
              fontFamily: "'PingFang SC', sans-serif",
            }}>{title}</span>
            <div
              onClick={onClose}
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', width: 24, height: 24, borderRadius: 4,
              }}
            ><CloseIcon /></div>
          </div>
          {subtitle && (
            <span style={{
              fontSize: 14, color: '#999999',
              fontFamily: "'PingFang SC', sans-serif", fontWeight: 400,
            }}>{subtitle}</span>
          )}
        </div>

        {/* Body */}
        {children && (
          <div style={{ padding: '0px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {children}
          </div>
        )}

        {/* Footer */}
        {actions.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 10, padding: '12px 24px', borderTop: '1px solid #E5E5E5',
          }}>
            {actions.map((a) => (
              <button
                key={a.label}
                style={actionStyle(a)}
                disabled={a.disabled}
                onClick={a.onClick}
                onMouseEnter={hoverBtn}
                onMouseLeave={resetBtn}
                onMouseDown={activeBtn}
                onMouseUp={resetBtn}
              >{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
