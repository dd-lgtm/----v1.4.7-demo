import React, { useState, useRef, useEffect } from 'react'

type AddAnnoVariant = 'Add' | 'adding'

interface AddAnnoProps {
  variant?: AddAnnoVariant
  onSubmit?: (text: string) => void
}

const AddAnno: React.FC<AddAnnoProps> = ({ variant = 'Add', onSubmit }) => {
  const isAdding = variant === 'adding'
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(isAdding)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isAdding])

  const handleSend = () => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim())
      setText('')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '8px 12px',
        gap: '8px',
        width: '100%',
        height: '40px',
        backgroundColor: '#FFFFFF',
        border: (isAdding || focused) ? '1px solid #2A6DE7' : '1px solid #E5E5E5',
        borderRadius: '8px',
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
                onFocus={() => setFocused(true)}
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
          onClick={handleSend}
          style={{ cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <rect width="24" height="24" rx="12" fill={text.trim() ? '#2A6DE7' : '#BFBFBF'} />
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
