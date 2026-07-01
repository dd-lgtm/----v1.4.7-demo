import React from 'react'
import { ArrowLeft } from 'lucide-react'
import Tag from './Tag'
import Button from './Button'

type TopBarVariant =
  | '人工审核中-创建人'
  | '人工审核中-审核人'
  | '审核人审核完之后'
  | '人工审核完成'
  | 'AI审核中'
  | 'AI审核完成'

interface TopBarProps {
  variant?: TopBarVariant
  title?: string
  docId?: string
  version?: string
  author?: string
  category?: string
  product?: string
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
  variant = '人工审核中-创建人',
  title = '新药 ABC-100 患者宣教手册',
  docId = 'DOC-2026-0518-001',
  version = 'v3',
  author = '段威丞',
  category = 'Internal use',
  product = 'XXX',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '8px 16px',
        gap: '10px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left: Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowLeft size={24} color="#333333" />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', width: '395px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                {title}
              </span>
              {/* Status Tag based on variant */}
              {variant === '人工审核中-创建人' || variant === '人工审核中-审核人' || variant === '审核人审核完之后' ? (
                <Tag variant="人工审核中" />
              ) : null}
              {variant === 'AI审核中' && <Tag variant="AI审核中" />}
              {variant === 'AI审核完成' && <Tag variant="AI审核完成" />}
              {variant === '人工审核完成' && <Tag variant="待补充" />}
            </div>
            <DocumentInfo docId={docId} version={version} author={author} category={category} product={product} />
          </div>
        </div>

        {/* Right: Audit progress tags (only for 人工审核中-创建人) */}
        {variant === '人工审核中-创建人' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag variant="waiting" label="Branding-段威丞-待审核" bordered />
            <Tag variant="返回修改" label="MA-王医学-退回修改" bordered />
            <Tag variant="待补充" label="MA-王医学-待补充" bordered />
            <Tag variant="审核通过" label="MA-段威丞-审核通过" bordered />
          </div>
        )}

        {/* Right: Action buttons */}
        {variant === '人工审核中-审核人' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', height: '28px' }}>
            <Button variant="danger">返回修改</Button>
            <Button variant="secondary">待补充</Button>
            <Button variant="secondary">无需审核</Button>
            <Button variant="primary">审核通过</Button>
          </div>
        )}

        {variant === '审核人审核完之后' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', height: '28px' }}>
            <Button variant="disabled">审核通过</Button>
          </div>
        )}

        {variant === 'AI审核完成' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', height: '28px' }}>
            <Button variant="secondary">重新上传</Button>
            <Button variant="primary">提交审核</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopBar
