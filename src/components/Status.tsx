import React, { useState, useEffect, useRef } from 'react'
import Department from './Department'
import InputBox from './InputBox'

type StatusVariant = 'accept' | 'refuse' | 'addComment'

interface StatusProps {
  variant: StatusVariant
  department?: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName?: string
  time?: string
  content?: string
  isEditing?: boolean
  onEdit?: (text: string) => void
  onEditCancel?: () => void
  textExpanded?: boolean
}

/** Status 内联可展开文本：默认4行截断，超出显示"...更多" */
const StatusExpandableText: React.FC<{ text: string; bgColor?: string; externalExpanded?: boolean }> = ({ text, bgColor = '#f4f8ff', externalExpanded }) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // 外部折叠控制：当卡片失焦时自动收起
  useEffect(() => {
    if (externalExpanded === false) setIsExpanded(false)
  }, [externalExpanded])

  useEffect(() => {
    if (textRef.current) {
      const el = textRef.current
      const prevClamp = el.style.getPropertyValue('-webkit-line-clamp')
      el.style.setProperty('-webkit-line-clamp', 'unset')
      el.style.overflow = 'hidden'
      const fullHeight = el.scrollHeight
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21
      el.style.setProperty('-webkit-line-clamp', prevClamp || '')
      el.style.overflow = ''
      setIsOverflowing(fullHeight > lineHeight * 4 + 2)
    }
  }, [text])

  useEffect(() => {
    if (textRef.current) {
      if (isExpanded) {
        textRef.current.style.removeProperty('-webkit-line-clamp')
        textRef.current.style.overflow = 'auto'
      } else {
        textRef.current.style.setProperty('-webkit-line-clamp', '4')
        textRef.current.style.overflow = 'hidden'
      }
    }
  }, [isExpanded])

  const LINE_HEIGHT = 21
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={textRef}
        className="annotation-scroll"
        style={{
          fontSize: '14px', lineHeight: '1.5em', color: '#333333',
          fontFamily: "'PingFang SC', sans-serif",
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitBoxOrient: 'vertical',
          maxHeight: isExpanded ? LINE_HEIGHT * 20 : undefined,
          paddingRight: isExpanded && isOverflowing ? 10 : undefined,
          cursor: 'text',
        }}
      >
        {text}
      </div>
      {!isExpanded && isOverflowing && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          height: LINE_HEIGHT, paddingLeft: 30, paddingRight: 2,
          background: `linear-gradient(to right, rgba(255,255,255,0) 0%, ${bgColor}d6 41%, ${bgColor} 100%)`,
          pointerEvents: 'none',
        }}>
          <span
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true) }}
            style={{
              fontSize: '14px', lineHeight: '1.5em', color: '#2A6DE7',
              fontFamily: "'PingFang SC', sans-serif", cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            ...更多
          </span>
        </div>
      )}
    </div>
  )
}

const Status: React.FC<StatusProps> = ({
  variant,
  department = 'RA',
  userName = '段威丞',
  time = '06-24 14:32',
  content = '',
  isEditing: externalEditing,
  onEdit,
  onEditCancel,
  textExpanded,
}) => {
  const [isEditing, setIsEditing] = useState(false)

  // Sync external editing trigger
  useEffect(() => {
    if (externalEditing) setIsEditing(true)
  }, [externalEditing])
  if (variant === 'accept') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          padding: '4px 12px',
          gap: '12px',
          backgroundColor: '#F5FFF5',
          borderRadius: '4px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '4px',
              height: '14px',
              backgroundColor: '#3EC23E',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
            已接受批注
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <Department variant={department} />
          <span style={{ fontSize: '12px', color: '#999999' }}>{userName}</span>
          <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
        </div>
      </div>
    )
  }

  if (variant === 'refuse') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          padding: '4px 12px',
          gap: '12px',
          backgroundColor: '#FFF1F1',
          borderRadius: '4px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '4px',
              height: '14px',
              backgroundColor: '#FA4D56',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
            已拒绝批注
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <Department variant={department} />
          <span style={{ fontSize: '12px', color: '#999999' }}>{userName}</span>
          <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
        </div>
      </div>
    )
  }

  // addComment
  return (
    <div
      onClick={(e) => { if (isEditing) e.stopPropagation() }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 8px',
        gap: '4px',
        backgroundColor: '#f4f8ff',
        borderRadius: '4px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Department variant={department} />
          <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
            {userName}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
      </div>
      {isEditing ? (
        <InputBox
          variant="adding"
          noShadow
          initialText={content || '该图片用于印刷物料，需确保分辨率达300dpi，已联系设计师处理，预计明日更新。'}
          onSubmit={(text) => {
            setIsEditing(false)
            onEdit?.(text)
          }}
          onCancel={() => {
            setIsEditing(false)
            onEditCancel?.()
          }}
        />
      ) : (
        <div onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}>
          <StatusExpandableText
            text={content || '该图片用于印刷物料，需确保分辨率达300dpi，已联系设计师处理，预计明日更新。'}
            externalExpanded={textExpanded}
          />
        </div>
      )}
    </div>
  )
}

export default Status
