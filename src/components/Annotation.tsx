import React, { useState, useRef, useEffect } from 'react'
import { Check, X, Pencil, MoreHorizontal, ChevronDown, ChevronLeft } from 'lucide-react'
import Department from './Department'
import Status from './Status'
import InputBox from './InputBox'

type AnnotationVariant =
  | 'manual'
  | 'manual-hovered'
  | 'manual-action'
  | 'AI'
  | 'AI-hovered'
  | 'AI-accept'
  | 'AI-refuse'
  | 'AI-addComment'

type RiskLevel = 'high' | 'medium' | 'low'

const riskConfig: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  high:   { bg: '#FFF1F1', color: '#FA4D56', label: '高风险' },
  medium: { bg: '#FEF6DF', color: '#FFBB00', label: '中风险' },
  low:    { bg: '#FAFAFA', color: '#BFBFBF', label: '低风险' },
}

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
  risk?: RiskLevel  // kept for API compatibility
  interactive?: boolean
  readOnly?: boolean
  id?: string
  isActive?: boolean
  onActivate?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string, text: string) => void
}

/** Tooltip气泡组件 */
const Tooltip: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 20,
    }}
  >
    <div
      style={{
        padding: '4px 8px',
        backgroundColor: 'rgba(51, 51, 51, 0.9)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
        {label}
      </span>
    </div>
    {/* Arrow */}
    <img src="/icons/tooltip-arrow.svg" alt="" style={{ width: 10, height: 8 }} />
  </div>
)

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
        boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.15)',
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
            position: 'relative',
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
          {hoveredBtn === 'check' && <Tooltip label="接受" />}
          <Check size={14} color="#333333" />
        </div>
        {/* Close */}
        <div
          onClick={(e) => handleClick(e, 'refuse')}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            position: 'relative',
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
          {hoveredBtn === 'close' && <Tooltip label="拒绝" />}
          <X size={14} color="#333333" />
        </div>
        {/* Edit */}
        <div
          onClick={(e) => handleClick(e, 'edit')}
          onMouseEnter={() => setHoveredBtn('edit')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px',
            borderRadius: '2px',
            backgroundColor: hoveredBtn === 'edit' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {hoveredBtn === 'edit' && <Tooltip label="修改" />}
          <Pencil size={12} color="#333333" />
        </div>
      </div>
    </div>
  )
}

/** 人工批注操作下拉菜单 */
const ManualDropdown: React.FC<{
  onDelete: () => void
  onEdit: () => void
  onClose: () => void
}> = ({ onDelete, onEdit, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [hoveredItem, setHoveredItem] = useState<'delete' | 'edit' | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        right: '8px',
        top: '32px',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 0',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
        borderRadius: '4px',
        zIndex: 20,
      }}
    >
      <div
        onClick={onDelete}
        onMouseEnter={() => setHoveredItem('delete')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          display: 'flex',
          padding: '2px 8px',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          backgroundColor: hoveredItem === 'delete' ? '#F0F0F0' : 'transparent',
          transition: 'background-color 0.15s',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: '1.5em', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>删除</span>
      </div>
      <div
        onClick={onEdit}
        onMouseEnter={() => setHoveredItem('edit')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          display: 'flex',
          padding: '2px 8px',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          backgroundColor: hoveredItem === 'edit' ? '#F0F0F0' : 'transparent',
          transition: 'background-color 0.15s',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: '1.5em', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>修改</span>
      </div>
    </div>
  )
}

const ManualHeader: React.FC<{
  department: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName: string
  time: string
  showMore: boolean
  onMoreClick: (e: React.MouseEvent) => void
}> = ({ department, userName, time, showMore, onMoreClick }) => (
  <div style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'flex-end', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Department variant={department} />
      <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
        {userName}
      </span>
    </div>
    <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
    {showMore && (
      <div
        onClick={onMoreClick}
        style={{
          marginLeft: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={16} color="#999999" />
      </div>
    )}
  </div>
)

const AIHeader: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Department variant="AI" />
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
      <span
        style={{ fontSize: '14px', lineHeight: '1.5em', color: '#333333' }}
      >
        {issueContent}
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', lineHeight: '1.4em', color: '#999999' }}>{suggestionTitle}</span>
      <span
        style={{ fontSize: '14px', lineHeight: '1.5em', color: '#333333' }}
      >
        {suggestionContent}
      </span>
    </div>
  </div>
)

/** 风险等级指示条 */
const RiskBar: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const config = riskConfig[level]
  return (
    <div style={{
      display: 'flex',
      alignSelf: 'stretch',
      padding: '2px 12px',
      alignItems: 'center',
      gap: '4px',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 14.6666C4.3181 14.6666 1.33334 11.6818 1.33334 7.99992C1.33334 4.31802 4.3181 1.33325 8 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8 14.6666ZM8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 7.99992C13.3333 5.0544 10.9455 2.66659 8 2.66659C5.05448 2.66659 2.66667 5.0544 2.66667 7.99992C2.66667 10.9455 5.05448 13.3333 8 13.3333ZM7.33334 9.99992H8.66667V11.3333H7.33334V9.99992ZM7.33334 4.66659H8.66667V8.66658H7.33334V4.66659Z" fill="#999999"/>
      </svg>
      <span style={{ fontSize: '12px', color: '#999999', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
        {config.label}
      </span>
    </div>
  )
}

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
  risk = 'high',
  interactive = false,
  readOnly = false,
  id = '',
  isActive = false,
  onActivate,
  onDelete,
  onEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [aiAction, setAiAction] = useState<'accept' | 'refuse' | 'addComment' | 'editing' | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [manualEditing, setManualEditing] = useState(false)
  const [statusEditing, setStatusEditing] = useState(false)
  const [refuseFolded, setRefuseFolded] = useState(true) // 拒绝后默认折叠

  const isManual = variant.startsWith('manual')
  const isAI = variant.startsWith('AI')
  const riskStyle = risk ? riskConfig[risk] : null

  // Effective variant: aiAction overrides the base variant for AI annotations
  const effectiveVariant = (interactive && !readOnly && isAI && aiAction && aiAction !== 'editing')
    ? (`AI-${aiAction}` as AnnotationVariant)
    : variant

  const getBackground = () => {
    if (manualEditing) return '#FFFFFF'
    if (interactive && isHovered && !isActive) {
      // AI hover: #F5F5F5, 人工 hover: #F0F0F0
      return isAI ? '#F5F5F5' : '#F0F0F0'
    }
    return '#FFFFFF'
  }

  const getBoxShadow = () => {
    if (interactive && isActive) return '0px 1px 8.6px 0px rgba(0, 0, 0, 0.15)'
    return 'none'
  }

  const handleClick = () => {
    if (showDropdown || manualEditing) return
    if (!interactive || !onActivate) return
    onActivate(isActive ? '' : id)
  }

  const handleAIAction = (action: 'accept' | 'refuse' | 'edit') => {
    if (action === 'edit') {
      if (aiAction === 'addComment') {
        // When already has a comment, enter editing within Status component
        setStatusEditing(true)
      } else {
        setAiAction((prev) => prev === 'editing' ? null : 'editing')
      }
    } else if (action === 'refuse') {
      setAiAction((prev) => {
        if (prev === 'refuse') return null
        setRefuseFolded(true) // 进入拒绝时默认折叠
        return 'refuse'
      })
    } else if (action === 'accept') {
      // 接受后直接删除卡片
      onDelete?.(id)
    }
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDropdown(prev => !prev)
  }

  const handleDropdownDelete = () => {
    setShowDropdown(false)
    onDelete?.(id)
  }

  const handleDropdownEdit = () => {
    setShowDropdown(false)
    setManualEditing(true)
  }

  const handleEditSubmit = (text: string) => {
    setManualEditing(false)
    onEdit?.(id, text)
  }

  const handleEditCancel = () => {
    setManualEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: riskStyle?.bg ?? 'transparent',
      borderRadius: '8px',
      width: '100%',
    }}>
      {risk && <RiskBar level={risk} />}
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
        onMouseLeave={() => {
          interactive && setIsHovered(false)
          if (showDropdown) setShowDropdown(false)
        }}
        onClick={handleClick}
      >
      {/* AI Action Buttons - show on hover for AI annotations, hide after accept/refuse */}
      {interactive && !readOnly && isAI && isHovered && aiAction !== 'accept' && aiAction !== 'refuse' && (
        <AIActionBar onAction={handleAIAction} />
      )}

      {/* Header */}
      {isManual && (
        <ManualHeader
          department={department}
          userName={userName}
          time={time}
          showMore={interactive && !readOnly && isHovered}
          onMoreClick={handleMoreClick}
        />
      )}
      {isAI && (
        <div style={{ display: 'flex', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
          <AIHeader time={time} />
          {/* 拒绝状态下显示折叠/展开按钮 */}
          {aiAction === 'refuse' && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                setRefuseFolded(prev => !prev)
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F0F0F0' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 16,
                height: 16,
                cursor: 'pointer',
                flexShrink: 0,
                borderRadius: 2,
                transition: 'background-color 0.15s',
              }}
            >
              {refuseFolded
                ? <ChevronDown size={16} color="#999999" />
                : <ChevronLeft size={16} color="#999999" />
              }
            </div>
          )}
        </div>
      )}

      {/* Dropdown menu for manual annotations */}
      {showDropdown && (
        <ManualDropdown
          onDelete={handleDropdownDelete}
          onEdit={handleDropdownEdit}
          onClose={() => setShowDropdown(false)}
        />
      )}

      {/* Content */}
      {isManual && !manualEditing && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            if (!readOnly) setManualEditing(true)
          }}
          style={{
            fontSize: '14px',
            lineHeight: '1.5em',
            color: '#333333',
            fontFamily: "'PingFang SC', sans-serif",
            cursor: readOnly ? 'default' : 'text',
          }}
        >
          {content}
        </div>
      )}

      {/* Manual editing mode: show InputBox with pre-filled text */}
      {isManual && manualEditing && (
        <InputBox
          variant="adding"
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          initialText={content}
          noShadow
        />
      )}

      {isAI && aiAction !== 'refuse' && (
        <AIContentArea
          issueTitle={issueTitle}
          issueContent={issueContent}
          suggestionTitle={suggestionTitle}
          suggestionContent={suggestionContent}
        />
      )}
      {/* 拒绝且展开时显示内容 */}
      {isAI && aiAction === 'refuse' && !refuseFolded && (
        <AIContentArea
          issueTitle={issueTitle}
          issueContent={issueContent}
          suggestionTitle={suggestionTitle}
          suggestionContent={suggestionContent}
        />
      )}

      {/* Editing state: show InputBox input inside the card */}
      {interactive && !readOnly && isAI && aiAction === 'editing' && (
        <InputBox
          variant="adding"
          noShadow
          onSubmit={(text) => {
            setCommentText(text)
            setAiAction('addComment')
          }}
          onCancel={() => setAiAction(commentText ? 'addComment' : null)}
          initialText={commentText || undefined}
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
        <Status
          variant="addComment"
          department="RA"
          userName={userName}
          time={time}
          content={commentText}
          isEditing={statusEditing}
          onEdit={(text) => {
            setCommentText(text)
            setStatusEditing(false)
          }}
          onEditCancel={() => setStatusEditing(false)}
        />
      )}
    </div>
    </div>
  )
}

export default Annotation
