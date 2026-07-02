import React, { useState, useEffect } from 'react'
import Department from './Department'
import AddAnno from './AddAnno'

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
          <span style={{ fontSize: '13px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
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
          <span style={{ fontSize: '13px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
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
        backgroundColor: '#F4F8FF',
        borderRadius: '8px',
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
        <AddAnno
          variant="adding"
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
        <div
          onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
          style={{
            fontSize: '14px',
            lineHeight: '1.5em',
            color: '#333333',
            fontFamily: "'PingFang SC', sans-serif",
            cursor: 'text',
          }}
        >
          {content || '该图片用于印刷物料，需确保分辨率达300dpi，已联系设计师处理，预计明日更新。'}
        </div>
      )}
    </div>
  )
}

export default Status
