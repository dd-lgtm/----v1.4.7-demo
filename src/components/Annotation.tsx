import React, { useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'
import Department from './Department'
import Status from './Status'
import AddAnno from './AddAnno'

type AnnotationVariant =
  | 'manual'
  | 'manual-hovered'
  | 'manual-action'
  | 'AI'
  | 'AI-accept'
  | 'AI-refuse'
  | 'AI-addComment'

interface AnnotationProps {
  variant?: AnnotationVariant
  department?: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName?: string
  time?: string
  content?: string
  issueTitle?: string
  issueContent?: string
  suggestionTitle?: string
  suggestionContent?: string
  interactive?: boolean
  id?: string
  isActive?: boolean
  onActivate?: (id: string) => void
}

/** AI批注右上角操作按钮组 */
const AIActionBar: React.FC<{ onAction: (action: 'accept' | 'refuse' | 'edit') => void }> = ({ onAction }) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const handleClick = (e: React.MouseEvent, action: 'accept' | 'refuse' | 'edit') => {
    e.stopPropagation()
    onAction(action)
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: '12px',
        top: '8px',
        display: 'flex',
        padding: '2px 4px',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 1px 4px rgba(0,0,0,0.15)',
        borderRadius: '2px',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Check */}
        <div
          onClick={(e) => handleClick(e, 'accept')}
          onMouseEnter={() => setHoveredBtn('check')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 16,
            height: 16,
            borderRadius: '2px',
            backgroundColor: hoveredBtn === 'check' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <Check size={14} color="#333333" />
        </div>
        {/* Close */}
        <div
          onClick={(e) => handleClick(e, 'refuse')}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 16,
            height: 16,
            borderRadius: '2px',
            backgroundColor: hoveredBtn === 'close' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <X size={14} color="#333333" />
        </div>
        {/* Edit */}
        <div
          onClick={(e) => handleClick(e, 'edit')}
          onMouseEnter={() => setHoveredBtn('edit')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px',
            borderRadius: '2px',
            backgroundColor: hoveredBtn === 'edit' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <Pencil size={12} color="#333333" />
        </div>
      </div>
    </div>
  )
}

const ManualHeader: React.FC<{
  department: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName: string
  time: string
}> = ({ department, userName, time }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Department variant={department} />
      <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
        {userName}
      </span>
    </div>
    <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
  </div>
)

const AIHeader: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Department variant="Branding" />
      <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
        AI 批注
      </span>
    </div>
    <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
  </div>
)

const AIContentArea: React.FC<{
  issueTitle: string
  issueContent: string
  suggestionTitle: string
  suggestionContent: string
}> = ({ issueTitle, issueContent, suggestionTitle, suggestionContent }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', lineHeight: '1.4em', color: '#999999' }}>{issueTitle}</span>
      <span style={{ fontSize: '12px', lineHeight: '1.5em', color: '#333333' }}>{issueContent}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', lineHeight: '1.4em', color: '#999999' }}>{suggestionTitle}</span>
      <span style={{ fontSize: '12px', lineHeight: '1.5em', color: '#333333' }}>{suggestionContent}</span>
    </div>
  </div>
)

const Annotation: React.FC<AnnotationProps> = ({
  variant = 'manual',
  department = 'Legal',
  userName = '段威丞',
  time = '06-24 14:32',
  content = '此处图片分辨率偏低，建议更换为高清图片，当前尺寸为72dpi，建议调整至300dpi以上。',
  issueTitle = '问题说明',
  issueContent = '此处图片分辨率偏低，当前尺寸为72dpi。',
  suggestionTitle = 'AI修改建议',
  suggestionContent = '建议更换为高清图片，建议调整至300dpi以上。',
  interactive = false,
  id = '',
  isActive = false,
  onActivate,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [aiAction, setAiAction] = useState<'accept' | 'refuse' | 'addComment' | 'editing' | null>(null)
  const [commentText, setCommentText] = useState('')

  const isManual = variant.startsWith('manual')
  const isAI = variant.startsWith('AI')

  // Effective variant: aiAction overrides the base variant for AI annotations
  // 'editing' is a transient state, not a variant — handled separately
  const effectiveVariant = (interactive && isAI && aiAction && aiAction !== 'editing')
    ? (`AI-${aiAction}` as AnnotationVariant)
    : variant

  const getBackground = () => {
    if (interactive && isHovered && !isActive) return '#F0F0F0'
    return '#FFFFFF'
  }

  const getBoxShadow = () => {
    if (interactive && isActive) return '0px 1px 8.6px rgba(0, 0, 0, 0.15)'
    return 'none'
  }

  const handleClick = () => {
    if (!interactive || !onActivate) return
    onActivate(isActive ? '' : id)
  }

  const handleAIAction = (action: 'accept' | 'refuse' | 'edit') => {
    if (action === 'edit') {
      setAiAction((prev) => prev === 'editing' ? null : 'editing')
    } else {
      setAiAction((prev) => prev === action ? null : action)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        gap: '8px',
        backgroundColor: getBackground(),
        border: '1px solid #E5E5E5',
        borderRadius: '8px',
        width: '100%',
        position: 'relative',
        boxShadow: getBoxShadow(),
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={handleClick}
    >
      {/* AI Action Buttons - show on hover for AI annotations */}
      {interactive && isAI && isHovered && <AIActionBar onAction={handleAIAction} />}

      {/* Header */}
      {isManual && (
        <ManualHeader department={department} userName={userName} time={time} />
      )}
      {isAI && (
        <AIHeader time={time} />
      )}

      {/* Content */}
      {isManual && (
        <div
          style={{
            fontSize: '14px',
            lineHeight: '1.5em',
            color: '#333333',
            fontFamily: "'PingFang SC', sans-serif",
          }}
        >
          {content}
        </div>
      )}
      {isAI && (
        <AIContentArea
          issueTitle={issueTitle}
          issueContent={issueContent}
          suggestionTitle={suggestionTitle}
          suggestionContent={suggestionContent}
        />
      )}

      {/* Editing state: show AddAnno input inside the card */}
      {interactive && isAI && aiAction === 'editing' && (
        <AddAnno
          variant="adding"
          onSubmit={(text) => {
            setCommentText(text)
            setAiAction('addComment')
          }}
        />
      )}

      {/* Status for AI variants */}
      {effectiveVariant === 'AI-accept' && (
        <Status variant="accept" department="Branding" userName={userName} time="06-24 15:05" />
      )}
      {effectiveVariant === 'AI-refuse' && (
        <Status variant="refuse" department="MA" userName={userName} time="06-24 15:05" />
      )}
      {effectiveVariant === 'AI-addComment' && (
        <Status variant="addComment" department="RA" userName={userName} time={time} content={commentText} />
      )}
    </div>
  )
}

export default Annotation
