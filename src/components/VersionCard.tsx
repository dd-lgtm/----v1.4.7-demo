import React from 'react'
import Department from './Department'
import Tag from './Tag'

type VersionCardVariant = 'old' | 'current'

interface VersionCardProps {
  variant?: VersionCardVariant
  version?: string
  department?: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName?: string
  time?: string
  tagVariant?: '人工审核中' | 'AI审核中' | 'AI审核完成' | '待补充' | '返回修改' | '审核通过' | '无需审核' | 'waiting'
  tagLabel?: string
}

const VersionCard: React.FC<VersionCardProps> = ({
  variant = 'old',
  version = 'V1',
  department = 'RA',
  userName = '段威丞 ',
  time = '2026-05-19 15:20',
  tagVariant = '返回修改',
  tagLabel,
}) => {
  const isCurrent = variant === 'current'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        width: '100%',
        height: '96px',
        backgroundColor: '#FFFFFF',
        border: isCurrent ? '2px solid #2A6DE7' : '1px solid #E5E5E5',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {isCurrent ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                {version}
              </span>
            </div>
            <span style={{ fontSize: '14px', color: '#999999', fontFamily: "'PingFang SC', sans-serif" }}>
              Current
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
            {version}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Department variant={department} />
            <span style={{ fontSize: '14px', color: '#666666', fontFamily: "'PingFang SC', sans-serif" }}>
              {userName}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#BFBFBF' }}>{time}</span>
        </div>
      </div>

      {/* Right tag */}
      <Tag variant={tagVariant} label={tagLabel} />
    </div>
  )
}

export default VersionCard
