import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Tag from './Tag'

interface TopBarProps {
  title?: string
  docId?: string
  version?: string
  author?: string
  category?: string
  product?: string
  status?: 'AI审核中' | '人工审核中' | 'AI审核完成' | '待补充' | '返回修改' | '退回修改' | '审核通过' | '无需审核'
  reviewResult?: '审核通过' | '返回修改' | '待补充' | '无需审核'
}

const TopBar: React.FC<TopBarProps> = ({
  title = '新药 ABC-100 患者宣教手册',
  docId = 'DOC-2026-0518-001',
  version = 'v3',
  author = '段威丞',
  category = 'Internal use',
  product = 'XXX',
  status = '人工审核中',
  reviewResult,
}) => {
  const navigate = useNavigate()
  const [showProgress, setShowProgress] = useState(false)
  const isManualReviewing = status === '人工审核中'

  const progressItems = [
    { dept: 'RA', name: '某某', status: '待审核',   dotColor: '#BFBFBF' },
    { dept: 'MA', name: '某某', status: '审核通过', dotColor: '#23A123' },
    { dept: 'MA', name: '某某', status: '待补充',   dotColor: '#d69d00' },
    { dept: 'MA', name: '某某', status: '退回修改', dotColor: '#FA4D56' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '8px 24px 8px 16px',
        gap: '10px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        boxSizing: 'border-box',
      }}
    >
      {/* Back Area: arrow + title section + audit result tag */}
      <div style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: arrow + title section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '723.5px', flexShrink: 0 }}>
          {/* Back arrow */}
          <div
            onClick={() => navigate('/workbench')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F0F0F0' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z" fill="#333333"/>
            </svg>
          </div>

          {/* Title Section */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
            {/* Row 1: title + version tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                {title}
              </span>
              {version && (
                <span
                  style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: '#F4F8FF',
                    color: '#2A6DE7',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {version}
                </span>
              )}
            </div>

            {/* Row 2: document info items in a single row, gap 24px */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Document Info Row: docId · author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666666' }}>{docId}</span>
                <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#666666' }} />
                <span style={{ fontSize: '12px', color: '#666666' }}>{author}</span>
              </div>

              {/* Category with icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src="/icons/price-tag-3-line.svg" alt="类别" style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: '12px', color: '#666666' }}>类别:</span>
                <span style={{ fontSize: '12px', color: '#666666' }}>{category}</span>
              </div>

              {/* Product with icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src="/icons/capsule-line.svg" alt="产品" style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: '12px', color: '#666666' }}>产品:</span>
                <span style={{ fontSize: '12px', color: '#666666' }}>{product}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Status tag or review result tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {reviewResult ? (
            /* 有审核结果时只显示结果标签 */
            <Tag variant={reviewResult} />
          ) : (
            /* 无审核结果时显示状态标签 + hover进度 */
            <div
              style={{
                position: 'relative',
                borderRadius: '4px',
                overflow: 'visible',
              }}
              onMouseEnter={() => setShowProgress(true)}
              onMouseLeave={() => setShowProgress(false)}
            >
              <Tag variant={status} />
              {showProgress && isManualReviewing && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  padding: '8px 4px',
                  gap: '4px',
                  backgroundColor: 'rgba(51, 51, 51, 0.9)',
                  boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  zIndex: 100,
                }}>
                  {progressItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      flexShrink: 0,
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: item.dotColor, flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '12px', color: '#FFFFFF',
                        fontFamily: "'PingFang SC', sans-serif",
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                      }}>{item.dept}{item.name}-{item.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopBar
