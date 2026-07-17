import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Tag from './Tag'

interface TopBarProps {
  title?: string
  docId?: string
  version?: string
  author?: string
  category?: string
  product?: string
  status?: 'AI审核中' | '人工审核中' | 'AI审核完成' | '待补充' | '返回修改' | '审核通过' | '无需审核'
}

const DocumentInfo: React.FC<{
  docId: string
  version: string
  author: string
  category: string
  product: string
}> = ({ docId, version, author, category, product }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: '#666666' }}>{docId}</span>
        <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#666666' }} />
        <span style={{ fontSize: '12px', color: '#666666' }}>{version}</span>
        <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#666666' }} />
        <span style={{ fontSize: '12px', color: '#666666' }}>{author}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: '#666666' }}>类别:</span>
        <span style={{ fontSize: '12px', color: '#666666' }}>{category}</span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: '#666666' }}>产品:</span>
        <span style={{ fontSize: '12px', color: '#666666' }}>{product}</span>
      </div>
    </div>
  </div>
)

const TopBar: React.FC<TopBarProps> = ({
  title = '新药 ABC-100 患者宣教手册',
  docId = 'DOC-2026-0518-001',
  version = 'v3',
  author = '段威丞',
  category = 'Internal use',
  product = 'XXX',
  status = '人工审核中',
}) => {
  const navigate = useNavigate()
  const [showProgress, setShowProgress] = useState(false)
  const isAIReviewing = status === 'AI审核中'
  const isManualReviewing = status === '人工审核中'

  const progressItems = [
    { dept: 'RA', name: '某某', status: '待审核',   dotColor: '#BFBFBF' },
    { dept: 'MA', name: '某某', status: '审核通过', dotColor: '#23A123' },
    { dept: 'MA', name: '某某', status: '待补充',   dotColor: '#FFBB00' },
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
      {/* Back Area: arrow + title section + audit progress tags */}
      <div style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'center', gap: '25px' }}>
        {/* Title and Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowLeft size={24} color="#333333" style={{ cursor: 'pointer' }} onClick={() => navigate('/workbench')} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', width: '395px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                {title}
              </span>
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowProgress(true)}
                onMouseLeave={() => setShowProgress(false)}
              >
                <Tag variant={status} />
                {showProgress && isManualReviewing && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    padding: '4px',
                    gap: '4px',
                    backgroundColor: '#FFFFFF',
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
                          fontSize: '12px', color: '#333333',
                          fontFamily: "'PingFang SC', sans-serif",
                          fontWeight: 400,
                          whiteSpace: 'nowrap',
                        }}>{item.dept}-{item.name}-{item.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DocumentInfo docId={docId} version={version} author={author} category={category} product={product} />
          </div>
        </div>

      </div>
    </div>
  )
}

export default TopBar
