import React from 'react'

type TagVariant =
  | '人工审核中'
  | 'AI审核中'
  | 'AI审核完成'
  | 'AI审核失败'
  | '待补充'
  | '返回修改'
  | '退回修改'
  | '审核通过'
  | '无需审核'
  | 'waiting'

interface TagProps {
  variant: TagVariant
  label?: string
  bordered?: boolean
  dot?: boolean
}

interface TagStyle {
  background: string
  color: string
  border?: string
}

const variantStyles: Record<TagVariant, TagStyle> = {
  '人工审核中': {
    background: '#F4F8FF',
    color: '#2A6DE7',
  },
  'AI审核中': {
    background: '#F4F8FF',
    color: '#2A6DE7',
  },
  'AI审核完成': {
    background: '#F6F2FF',
    color: '#A56EFF',
  },
  'AI审核失败': {
    background: '#FFF1F1',
    color: '#FA4D56',
  },
  '待补充': {
    background: '#FEF6DF',
    color: '#d69d00',
  },
  '返回修改': {
    background: '#FFF1F1',
    color: '#FA4D56',
  },
  '退回修改': {
    background: '#FFF1F1',
    color: '#FA4D56',
  },
  '审核通过': {
    background: '#F5FFF5',
    color: '#23A123',
  },
  '无需审核': {
    background: '#F5FFF5',
    color: '#23A123',
  },
  'waiting': {
    background: '#FAFAFA',
    color: '#666666',
  },
}

const Tag: React.FC<TagProps> = ({ variant, label, bordered = false, dot = false }) => {
  const style = variantStyles[variant]
  const displayText = label || (variant === '返回修改' ? '退回修改' : variant)

  return (
    <span
      style={{
        position: dot ? 'relative' : undefined,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2px 4px',
        gap: '0px',
        borderRadius: '2px',
        backgroundColor: style.background,
        color: style.color,
        fontSize: '12px',
        fontFamily: "'PingFang SC', sans-serif",
        fontWeight: 400,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        border: bordered ? `1px solid ${style.color}` : 'none',
        cursor: variant === '人工审核中' ? 'pointer' : undefined,
      }}
    >
      {variant === 'AI审核失败' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z" fill="currentColor"/>
        </svg>
      )}
      {displayText}
      {variant === '人工审核中' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path d="M8 10.6666L4 6.66663H12L8 10.6666Z" fill={style.color} />
        </svg>
      )}
      {dot && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            right: '-2px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#FA4D56',
            border: '0.5px solid #FFFFFF',
          }}
        />
      )}
    </span>
  )
}

export default Tag
