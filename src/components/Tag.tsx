import React from 'react'

type TagVariant =
  | '人工审核中'
  | 'AI审核中'
  | 'AI审核完成'
  | '待补充'
  | '返回修改'
  | '审核通过'
  | '无需审核'
  | 'waiting'

interface TagProps {
  variant: TagVariant
  label?: string
  bordered?: boolean
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
    background: '#4382F8',
    color: '#FFFFFF',
  },
  '待补充': {
    background: '#FEF6DF',
    color: '#D69D00',
  },
  '返回修改': {
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

const Tag: React.FC<TagProps> = ({ variant, label, bordered = false }) => {
  const style = variantStyles[variant]
  const displayText = label || variant

  return (
    <span
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: style.background,
        color: style.color,
        fontSize: '12px',
        fontFamily: "'PingFang SC', sans-serif",
        fontWeight: 400,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        border: bordered ? `1px solid ${style.color}` : 'none',
      }}
    >
      {displayText}
    </span>
  )
}

export default Tag
