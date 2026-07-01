import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

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
                  lineHeight: '1.5em',
                  color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif",
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  width: '100%',
                  minHeight: '36px',
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
        <div
          onClick={handleSend}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            width: '24px',
            height: '24px',
            backgroundColor: text.trim() ? '#2A6DE7' : '#BFBFBF',
            borderRadius: '12px',
            padding: '5.14px',
            gap: '8.57px',
            cursor: text.trim() ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          <Send size={13.71} color="#FFFFFF" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

export default AddAnno
