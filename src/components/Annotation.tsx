import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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

const riskConfig: Record<RiskLevel, { bg: string; color: string; label: string; hoverColor: string; arrowColor: string; icon: string }> = {
  high:   { bg: '#FFF1F1', color: '#FA4D56', label: '高风险', hoverColor: '#FFE3E3', arrowColor: '#FFB3B8', icon: '/icons/alert-fill.svg' },
  medium: { bg: '#FEF6DF', color: '#d69d00', label: '中风险', hoverColor: '#ffebb3', arrowColor: '#ffc629', icon: '/icons/alert-line.svg' },
  low:    { bg: '#f4f8ff', color: '#4382f8', label: '低风险', hoverColor: '#dce9ff', arrowColor: '#87b0fb', icon: '' },
}

const RISK_LEVELS: RiskLevel[] = ['high', 'medium', 'low']

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
  onRiskChange?: (id: string, risk: RiskLevel) => void
}

/** Tooltip气泡组件 — 通过 Portal 渲染到 body 最顶层，位于元素上方4px水平居中 */
const Tooltip: React.FC<{ label: string; rect: { left: number; top: number; width: number } }> = ({ label, rect }) =>
  createPortal(
    <div
      style={{
        position: 'fixed',
        left: rect.left + rect.width / 2,
        top: rect.top - 4,
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
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
    </div>,
    document.body
  )

/** 查找触发按钮所在的层叠上下文：最近的带 z-index 定位祖先（卡片wrapper），其父元素即为 Portal 容器 */
const getStackingInfo = (el: HTMLElement): { container: HTMLElement; zIndex: number } | null => {
  let cur: HTMLElement | null = el
  while (cur && cur !== document.body) {
    const style = window.getComputedStyle(cur)
    if (style.position !== 'static' && style.zIndex !== 'auto') {
      return { container: cur.parentElement ?? document.body, zIndex: parseInt(style.zIndex, 10) || 0 }
    }
    cur = cur.parentElement
  }
  return null
}

/** Popconfirm 二次确认气泡 — Portal 到触发按钮同层叠容器，TR定位（右对齐，上方4px），实时跟随且遮挡关系与触发按钮一致 */
const Popconfirm: React.FC<{
  text: string
  anchorEl: HTMLElement
  onConfirm: () => void
  onCancel: () => void
}> = ({ text, anchorEl, onConfirm, onCancel }) => {
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Portal 目标：触发按钮所在卡片的层叠容器，zIndex = 卡片 z-index + 1（遮挡关系与触发按钮一致）
  const stackingInfo = useMemo(() => getStackingInfo(anchorEl), [anchorEl])
  const container = stackingInfo?.container ?? document.body
  const zIndex = (stackingInfo?.zIndex ?? 0) + 1

  // 同步计算初始位置（在浏览器绘制前），避免首帧闪烁
  useLayoutEffect(() => {
    if (popRef.current && anchorEl.isConnected) {
      const r = anchorEl.getBoundingClientRect()
      const cr = container.getBoundingClientRect()
      const pw = popRef.current.offsetWidth
      const ph = popRef.current.offsetHeight
      setPos({
        left: r.left - cr.left + r.width - pw,
        top: r.top - cr.top - ph - 4,
      })
    }
  }, [anchorEl, container])

  // rAF 循环实时跟踪触发按钮位置（布局变化时自动更新；滚动时随容器内容同步移动）
  useEffect(() => {
    let raf: number
    const update = () => {
      if (popRef.current && anchorEl.isConnected) {
        const r = anchorEl.getBoundingClientRect()
        const cr = container.getBoundingClientRect()
        const pw = popRef.current.offsetWidth
        const ph = popRef.current.offsetHeight
        // TR定位：右边缘对齐触发元素右边缘，垂直距离4px
        const left = r.left - cr.left + r.width - pw
        const top = r.top - cr.top - ph - 4
        setPos(prev => (prev && prev.left === left && prev.top === top) ? prev : { left, top })
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [anchorEl, container])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onCancel])

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'absolute',
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? 'visible' : 'hidden',
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 12px',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M10.0001 18.3334C5.39771 18.3334 1.66675 14.6024 1.66675 10C1.66675 5.39765 5.39771 1.66669 10.0001 1.66669C14.6024 1.66669 18.3334 5.39765 18.3334 10C18.3334 14.6024 14.6024 18.3334 10.0001 18.3334ZM9.16675 12.5V14.1667H10.8334V12.5H9.16675ZM9.16675 5.83335V10.8334H10.8334V5.83335H9.16675Z" fill="#FFBB00"/>
          </svg>
          <span style={{ fontSize: '14px', color: '#000000', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
            {text}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onCancel() }}
            style={{
              display: 'flex', padding: '0 7px', justifyContent: 'center', alignItems: 'center',
              height: 28, border: '1px solid #CCCCCC', borderRadius: '4px',
              backgroundColor: 'transparent', cursor: 'pointer',
              fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif",
            }}
          >取消</button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm() }}
            style={{
              display: 'flex', padding: '0 7px', justifyContent: 'center', alignItems: 'center',
              height: 28, border: 'none', borderRadius: '4px',
              backgroundColor: '#2A6DE7', cursor: 'pointer',
              fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif",
            }}
          >确定</button>
        </div>
      </div>
      {/* Arrow — 右对齐，display:flex 消除 inline SVG 基线间隙 */}
      <div style={{ alignSelf: 'flex-end', marginRight: 8, display: 'flex', marginTop: -1 }}>
        <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L0 0H12L6 6Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>,
    container
  )
}

/** AI批注右上角操作按钮组 */
const AIActionBar: React.FC<{
  onAction: (action: 'accept' | 'refuse' | 'edit') => void
  onConfirmRequest: (action: 'accept' | 'refuse', el: HTMLElement) => void
  hideAcceptRefuse?: boolean
}> = ({ onAction, onConfirmRequest, hideAcceptRefuse }) => {
  const [hoveredBtn, setHoveredBtn] = useState<{ key: string; rect: { left: number; top: number; width: number } } | null>(null)

  const handleClick = (e: React.MouseEvent, action: 'accept' | 'refuse' | 'edit') => {
    e.stopPropagation()
    if (action === 'edit') {
      onAction(action)
      return
    }
    // 接受/拒绝需要二次确认，传递按钮元素引用以实时跟随定位
    onConfirmRequest(action, e.currentTarget as HTMLElement)
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: '12px',
        top: '8px',
        display: 'flex',
        padding: '4px 4px',
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
        {!hideAcceptRefuse && (
        <div
          onClick={(e) => handleClick(e, 'accept')}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            const r = el.getBoundingClientRect()
            setHoveredBtn({ key: 'check', rect: { left: r.left, top: r.top, width: r.width } })
          }}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 16,
            height: 16,
            borderRadius: '2px',
            backgroundColor: hoveredBtn?.key === 'check' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {hoveredBtn?.key === 'check' && <Tooltip label="接受" rect={hoveredBtn.rect} />}
          <Check size={14} color="#333333" />
        </div>
        )}
        {/* Close */}
        {!hideAcceptRefuse && (
        <div
          onClick={(e) => handleClick(e, 'refuse')}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            const r = el.getBoundingClientRect()
            setHoveredBtn({ key: 'close', rect: { left: r.left, top: r.top, width: r.width } })
          }}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 16,
            height: 16,
            borderRadius: '2px',
            backgroundColor: hoveredBtn?.key === 'close' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {hoveredBtn?.key === 'close' && <Tooltip label="拒绝" rect={hoveredBtn.rect} />}
          <X size={14} color="#333333" />
        </div>
        )}
        {/* Edit */}
        <div
          onClick={(e) => handleClick(e, 'edit')}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            const r = el.getBoundingClientRect()
            setHoveredBtn({ key: 'edit', rect: { left: r.left, top: r.top, width: r.width } })
          }}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px',
            borderRadius: '2px',
            backgroundColor: hoveredBtn?.key === 'edit' ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {hoveredBtn?.key === 'edit' && <Tooltip label="修改" rect={hoveredBtn.rect} />}
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
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F0F0F0' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
        style={{
          marginLeft: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: 2,
          transition: 'background-color 0.15s',
        }}
      >
        <MoreHorizontal size={16} color="#999999" />
      </div>
    )}
  </div>
)

const AIHeader: React.FC<{ time: string; department: 'RA' | 'MA' | 'Branding' | 'Legal' }> = ({ time, department }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Department variant={department} isAI />
    </div>
    <span style={{ fontSize: '12px', color: '#999999' }}>{time}</span>
  </div>
)

/** 可展开文本：默认最多maxLines行，超出显示"...更多"；展开后最多maxExpandedLines行，超出滚动 */
const ExpandableText: React.FC<{
  text: string
  isExpanded: boolean
  onToggle: (e: React.MouseEvent) => void
  style?: React.CSSProperties
  maxLines?: number
  maxExpandedLines?: number
  bgColor?: string
}> = ({ text, isExpanded, onToggle, style, maxLines = 6, maxExpandedLines = 20, bgColor = '#FFFFFF' }) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    if (textRef.current) {
      const el = textRef.current
      // 临时移除 line-clamp 以测量完整高度
      const prevClamp = el.style.getPropertyValue('-webkit-line-clamp')
      el.style.setProperty('-webkit-line-clamp', 'unset')
      el.style.overflow = 'hidden'
      const fullHeight = el.scrollHeight
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21
      el.style.setProperty('-webkit-line-clamp', prevClamp || '')
      el.style.overflow = ''
      setIsOverflowing(fullHeight > lineHeight * maxLines + 2)
    }
  }, [text, maxLines])

  const LINE_HEIGHT = 21 // 14px * 1.5

  // 手动设置 -webkit-line-clamp（React style prop 不直接支持）及 overflow
  useEffect(() => {
    if (textRef.current) {
      if (isExpanded) {
        textRef.current.style.removeProperty('-webkit-line-clamp')
        textRef.current.style.overflow = 'auto'
      } else {
        textRef.current.style.setProperty('-webkit-line-clamp', String(maxLines))
        textRef.current.style.overflow = 'hidden'
      }
    }
  }, [isExpanded, maxLines])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={textRef}
        style={{
          fontSize: '14px',
          lineHeight: '1.5em',
          color: '#333333',
          fontFamily: "'PingFang SC', sans-serif",
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitBoxOrient: 'vertical',
          maxHeight: isExpanded ? LINE_HEIGHT * maxExpandedLines : undefined,
          paddingRight: isExpanded && isOverflowing ? 10 : undefined,
          ...style,
        }}
        className="annotation-scroll"
      >
        {text}
      </div>
      {!isExpanded && isOverflowing && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            height: LINE_HEIGHT,
            paddingLeft: 30,
            paddingRight: 2,
            background: `linear-gradient(to right, rgba(255,255,255,0) 0%, ${bgColor}d6 41%, ${bgColor} 100%)`,
            pointerEvents: 'none',
          }}
        >
          <span
            onClick={onToggle}
            style={{
              fontSize: '14px',
              lineHeight: '1.5em',
              color: '#2A6DE7',
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
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

const AIContentArea: React.FC<{
  issueTitle: string
  issueContent: string
  suggestionTitle: string
  suggestionContent: string
  isExpanded?: boolean
  onToggle?: (e: React.MouseEvent) => void
  bgColor?: string
}> = ({ issueTitle, issueContent, suggestionTitle, suggestionContent, isExpanded = false, onToggle, bgColor }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', lineHeight: '1.4em', color: '#999999' }}>{issueTitle}</span>
      <ExpandableText
        text={issueContent}
        isExpanded={isExpanded}
        onToggle={onToggle || (() => {})}
        maxLines={2}
        bgColor={bgColor}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', lineHeight: '1.4em', color: '#999999' }}>{suggestionTitle}</span>
      <ExpandableText
        text={suggestionContent}
        isExpanded={isExpanded}
        onToggle={onToggle || (() => {})}
        maxLines={2}
        bgColor={bgColor}
      />
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
  risk = 'high',
  interactive = false,
  readOnly = false,
  id = '',
  isActive = false,
  onActivate,
  onDelete,
  onEdit,
  onRiskChange,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [aiAction, setAiAction] = useState<'accept' | 'refuse' | 'addComment' | 'editing' | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [manualEditing, setManualEditing] = useState(false)
  const [statusEditing, setStatusEditing] = useState(false)
  const [refuseFolded, setRefuseFolded] = useState(true) // 拒绝后默认折叠
  const [riskExpanded, setRiskExpanded] = useState(false)
  const [hoveredRiskOption, setHoveredRiskOption] = useState<RiskLevel | null>(null)
  const [riskArrowHovered, setRiskArrowHovered] = useState(false)
  const [confirming, setConfirming] = useState<{ action: 'accept' | 'refuse'; el: HTMLElement } | null>(null)
  const [textExpanded, setTextExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 卡片失焦时自动折叠文本
  useEffect(() => {
    if (!isActive) setTextExpanded(false)
  }, [isActive])

  // 点击组件外部时折叠文本（处理父容器 stopPropagation 无法触发的场景）
  useEffect(() => {
    if (!textExpanded) return
    const handleDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setTextExpanded(false)
      }
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [textExpanded])

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
      // AI hover: #FAFAFA, 人工 hover: #FAFAFA
      return '#FAFAFA'
    }
    return '#FFFFFF'
  }

  const getBoxShadow = () => {
    if (interactive && isActive) return '0px 1px 8.6px 0px rgba(0, 0, 0, 0.15)'
    return 'none'
  }

  const handleClick = (e: React.MouseEvent) => {
    // 不拦截内部交互元素的点击（按钮、输入框、下拉菜单项等）
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, [role="menuitem"]')) return
    if (showDropdown || manualEditing) return
    setRiskExpanded(false)
    if (!interactive || !onActivate) return
    const next = !isActive
    onActivate(next ? id : '')
    if (next) setTextExpanded(true)
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
      setAiAction('accept')
    }
  }

  const handleConfirmRequest = (action: 'accept' | 'refuse', el: HTMLElement) => {
    setConfirming({ action, el })
  }

  const handlePopConfirm = () => {
    if (confirming) {
      handleAIAction(confirming.action)
      setConfirming(null)
    }
  }

  const handlePopCancel = () => {
    setConfirming(null)
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
    <div ref={rootRef} style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: riskStyle?.bg ?? 'transparent',
      borderRadius: '8px',
      width: '100%',
    }}>
      {/* Risk bar - interactive for manual annotations */}
      {risk && (
        <>
          <div
            style={{
              display: 'flex',
              alignSelf: 'stretch',
              padding: '2px 8px',
              justifyContent: isManual ? 'space-between' : undefined,
              alignItems: 'center',
              gap: '4px',
              cursor: isManual && !readOnly ? 'pointer' : 'default',
            }}
            onMouseDown={(e) => { if (isManual) e.preventDefault() }}
            onClick={() => {
              if (isManual && !readOnly) {
                setRiskExpanded(prev => !prev)
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {riskStyle?.icon ? (
                <img src={riskStyle.icon} alt="" style={{ width: 16, height: 16 }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14.6666C4.3181 14.6666 1.33334 11.6818 1.33334 7.99992C1.33334 4.31802 4.3181 1.33325 8 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8 14.6666ZM8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 7.99992C13.3333 5.0544 10.9455 2.66659 8 2.66659C5.05448 2.66659 2.66667 5.0544 2.66667 7.99992C2.66667 10.9455 5.05448 13.3333 8 13.3333ZM7.33334 9.99992H8.66667V11.3333H7.33334V9.99992ZM7.33334 4.66659H8.66667V8.66658H7.33334V4.66659Z" fill={riskStyle?.color}/>
                </svg>
              )}
              <span style={{ fontSize: '12px', color: riskStyle?.color, fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
                {riskStyle?.label}
              </span>
            </div>
            {isManual && (
              <div
                style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: 16, height: 16, borderRadius: 2,
                  backgroundColor: riskArrowHovered ? (riskStyle?.hoverColor ?? 'transparent') : 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={() => setRiskArrowHovered(true)}
                onMouseLeave={() => setRiskArrowHovered(false)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: riskExpanded ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <path d="M7.21911 7.99993L10.5189 11.2998L9.57611 12.2426L5.33344 7.99993L9.57611 3.75732L10.5189 4.70013L7.21911 7.99993Z" fill={riskStyle?.arrowColor ?? '#BFBFBF'} />
                </svg>
              </div>
            )}
          </div>
          {/* Risk dropdown options for manual annotations */}
          {isManual && riskExpanded && (
            RISK_LEVELS.filter(l => l !== risk).map((level) => {
              const lvlConfig = riskConfig[level]
              return (
                <div
                  key={level}
                  style={{
                    display: 'flex',
                    alignSelf: 'stretch',
                    padding: '2px 8px',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    backgroundColor: hoveredRiskOption === level ? (riskStyle?.hoverColor ?? 'transparent') : 'transparent',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHoveredRiskOption(level)}
                  onMouseLeave={() => setHoveredRiskOption(null)}
                  onClick={() => {
                    setRiskExpanded(false)
                    onRiskChange?.(id, level)
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {lvlConfig.icon ? (
                      <img src={lvlConfig.icon} alt="" style={{ width: 16, height: 16 }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 14.6666C4.3181 14.6666 1.33334 11.6818 1.33334 7.99992C1.33334 4.31802 4.3181 1.33325 8 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8 14.6666ZM8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 7.99992C13.3333 5.0544 10.9455 2.66659 8 2.66659C5.05448 2.66659 2.66667 5.0544 2.66667 7.99992C2.66667 10.9455 5.05448 13.3333 8 13.3333ZM7.33334 9.99992H8.66667V11.3333H7.33334V9.99992ZM7.33334 4.66659H8.66667V8.66658H7.33334V4.66659Z" fill={lvlConfig.color}/>
                      </svg>
                    )}
                    <span style={{ fontSize: '12px', color: lvlConfig.color, fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
                      {lvlConfig.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 8px',
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
          setRiskExpanded(false)
          setHoveredRiskOption(null)
        }}
        onClick={handleClick}
      >
      {/* AI Action Buttons - show on hover for AI annotations, hide accept/refuse after accept/refuse/addComment */}
      {interactive && !readOnly && isAI && isHovered && aiAction !== 'accept' && aiAction !== 'refuse' && (
        <AIActionBar onAction={handleAIAction} onConfirmRequest={handleConfirmRequest} hideAcceptRefuse={aiAction === 'addComment'} />
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
          <AIHeader time={time} department={department as 'RA' | 'MA' | 'Branding' | 'Legal'} />
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
            if (!readOnly && isActive) {
              e.stopPropagation()
              setManualEditing(true)
            }
          }}
        >
          <ExpandableText
            text={content}
            isExpanded={textExpanded}
            onToggle={(e: React.MouseEvent) => { e.stopPropagation(); setTextExpanded(true) }}
            style={{ cursor: readOnly ? 'default' : 'text' }}
            bgColor={getBackground()}
          />
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
          isExpanded={textExpanded}
          onToggle={(e) => { e.stopPropagation(); setTextExpanded(true) }}
          bgColor={getBackground()}
        />
      )}
      {/* 拒绝且展开时显示内容 */}
      {isAI && aiAction === 'refuse' && !refuseFolded && (
        <AIContentArea
          issueTitle={issueTitle}
          issueContent={issueContent}
          suggestionTitle={suggestionTitle}
          suggestionContent={suggestionContent}
          isExpanded={textExpanded}
          onToggle={(e) => { e.stopPropagation(); setTextExpanded(true) }}
          bgColor={getBackground()}
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
          textExpanded={textExpanded}
        />
      )}
    </div>
    {/* Popconfirm 二次确认 — 渲染在 Annotation 层级，不随 AIActionBar 卸载而消失 */}
    {confirming && (
      <Popconfirm
        text={confirming.action === 'refuse' ? '确认拒绝此批注吗？' : '确认接受此批注吗？'}
        anchorEl={confirming.el}
        onConfirm={handlePopConfirm}
        onCancel={handlePopCancel}
      />
    )}
    </div>
  )
}

export default Annotation
