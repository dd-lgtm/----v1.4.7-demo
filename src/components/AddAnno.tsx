import React, { useState, useRef, useEffect, useCallback } from 'react'

type AddAnnoVariant = 'Add' | 'adding'

interface AddAnnoProps {
  variant?: AddAnnoVariant
  onSubmit?: (text: string) => void
  onCancel?: () => void
  initialText?: string
}

const AddAnno: React.FC<AddAnnoProps> = ({ variant = 'Add', onSubmit, onCancel, initialText = '' }) => {
  const isAdding = variant === 'adding'
  const [text, setText] = useState(initialText)
  const [focused, setFocused] = useState(isAdding || !!initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isAdding])

  const handleSend = useCallback(() => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim())
      setText('')
    }
  }, [text, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Cancel on click outside
  const handleBlur = useCallback(() => {
    // Use a short delay so click on send button registers first
    blurTimerRef.current = setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        if (text.trim()) {
          handleSend()
        } else {
          onCancel?.()
        }
      }
    }, 150)
  }, [text, handleSend, onCancel])

  const handleFocus = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    setFocused(true)
  }, [])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  const sendEnabled = text.trim().length > 0

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '8px 12px',
        gap: '8px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '8px',
        boxShadow: '0px 1px 11.2px 0px rgba(0, 0, 0, 0.15)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
            {(isAdding || focused) ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="正在写.."
                style={{
                  fontSize: '12px',
                  lineHeight: '24px',
                  color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif",
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  width: '100%',
                  height: '24px',
                  padding: 0,
                }}
              />
            ) : (
              <span
                onClick={() => setFocused(true)}
                style={{
                  fontSize: '12px',
                  lineHeight: '1.5em',
                  color: '#999999',
                  fontFamily: "'PingFang SC', sans-serif",
                  cursor: 'pointer',
                }}
              >
                添加批注
              </span>
            )}
          </div>
        </div>
        {/* Send button */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onMouseDown={(e) => e.preventDefault()} // prevent textarea blur
          onClick={handleSend}
          style={{ cursor: sendEnabled ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <rect width="24" height="24" rx="12" fill={sendEnabled ? '#2A6DE7' : '#BFBFBF'} />
          <g clipPath="url(#chatClip)">
            <path d="M6.85715 12.5712H10.2857V11.4284H6.85715V6.19734C6.85715 6.03954 6.98507 5.91162 7.14286 5.91162C7.191 5.91162 7.23837 5.92379 7.28055 5.94699L17.8305 11.7495C17.9688 11.8255 18.0193 11.9992 17.9432 12.1375C17.9171 12.185 17.878 12.2241 17.8305 12.2502L7.28055 18.0527C7.14229 18.1287 6.96856 18.0783 6.89251 17.94C6.86931 17.8978 6.85715 17.8505 6.85715 17.8023V12.5712Z" fill="white" />
          </g>
          <defs>
            <clipPath id="chatClip">
              <rect width="13.7143" height="13.7143" fill="white" transform="translate(5.14285 5.14282)" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  )
}

export default AddAnno
