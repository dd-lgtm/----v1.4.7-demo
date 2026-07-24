import React, { useState, useRef, useEffect, useCallback } from 'react'

type InputBoxVariant = 'Add' | 'adding' | 'risk-collapsed' | 'risk-expanded'

interface RiskLevel {
  label: string
  color: string
  arrowColor?: string
  bgColor?: string
  hoverColor?: string
  iconType?: 'alert-fill' | 'alert-line'
}

// 与批注组件一致的风险图标 SVG 路径
const ALERT_FILL_PATH = 'M8.57727 2.0002L14.9281 13.0002C15.1123 13.3191 15.003 13.7268 14.6841 13.9109C14.5828 13.9694 14.4678 14.0002 14.3508 14.0002H1.64909C1.2809 14.0002 0.982422 13.7017 0.982422 13.3335C0.982422 13.2165 1.01323 13.1015 1.07174 13.0002L7.4226 2.0002C7.60667 1.68133 8.0144 1.57208 8.33327 1.75618C8.4346 1.81469 8.5188 1.89885 8.57727 2.0002ZM7.33327 10.6669V12.0002H8.6666V10.6669H7.33327ZM7.33327 6.0002V9.33355H8.6666V6.0002H7.33327Z'
const ALERT_LINE_PATH = 'M8.57727 2.0002L14.9281 13.0002C15.1123 13.3191 15.003 13.7268 14.6841 13.9109C14.5828 13.9694 14.4678 14.0002 14.3508 14.0002H1.64909C1.2809 14.0002 0.982422 13.7017 0.982422 13.3335C0.982422 13.2165 1.01323 13.1015 1.07174 13.0002L7.4226 2.0002C7.60667 1.68133 8.0144 1.57208 8.33327 1.75618C8.4346 1.81469 8.5188 1.89885 8.57727 2.0002ZM2.80379 12.6669H13.1961L7.99994 3.66686L2.80379 12.6669ZM7.33327 10.6669H8.6666V12.0002H7.33327V10.6669ZM7.33327 6.0002H8.6666V9.33355H7.33327V6.0002Z'
const CIRCLE_INFO_PATH = 'M8 14.6666C4.3181 14.6666 1.33334 11.6818 1.33334 7.99992C1.33334 4.31802 4.3181 1.33325 8 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8 14.6666ZM8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 7.99992C13.3333 5.0544 10.9455 2.66659 8 2.66659C5.05448 2.66659 2.66667 5.0544 2.66667 7.99992C2.66667 10.9455 5.05448 13.3333 8 13.3333ZM7.33334 9.99992H8.66667V11.3333H7.33334V9.99992ZM7.33334 4.66659H8.66667V8.66658H7.33334V4.66659Z'

const renderRiskIcon = (iconType: RiskLevel['iconType'], color: string) => {
  const path = iconType === 'alert-fill' ? ALERT_FILL_PATH
    : iconType === 'alert-line' ? ALERT_LINE_PATH
    : CIRCLE_INFO_PATH
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill={color} />
    </svg>
  )
}

interface InputBoxProps {
  variant?: InputBoxVariant
  onSubmit?: (text: string) => void
  onCancel?: () => void
  initialText?: string
  noBorder?: boolean
  noShadow?: boolean
  /** 风险等级选项列表，仅 risk-* 变体使用 */
  riskLevels?: RiskLevel[]
  /** 当前选中的风险等级索引，仅 risk-* 变体使用 */
  selectedRiskIndex?: number
  /** 切换风险等级回调 */
  onRiskSelect?: (index: number) => void
  /** 切换展开/折叠回调 */
  onToggleRisk?: () => void
}

/**
 * Internal input core: textarea + send button (reused by all variants)
 */
const InputBoxCore: React.FC<{
  onSubmit?: (text: string) => void
  onCancel?: () => void
  initialText?: string
  autoFocus?: boolean
  noShadow?: boolean
  noBorder?: boolean
  /** 外部容器 ref，用于 blur 判断边界（risk 变体需要） */
  externalContainerRef?: React.RefObject<HTMLDivElement | null>
}> = ({ onSubmit, onCancel, initialText = '', autoFocus = false, noShadow = false, noBorder = false, externalContainerRef }) => {
  const [text, setText] = useState(initialText)
  const [focused, setFocused] = useState(autoFocus || !!initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Auto-resize textarea: fit content, max 5 lines (5 × 24px = 120px)
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = useCallback(() => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim())
      setText('')
    }
  }, [text, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Cancel on click outside
  const handleBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      // Use external container ref if provided (for risk variants), otherwise use internal ref
      const boundary = externalContainerRef?.current ?? containerRef.current
      if (boundary && !boundary.contains(document.activeElement)) {
        if (text.trim()) {
          handleSend()
        } else {
          onCancel?.()
        }
      }
    }, 150)
  }, [text, handleSend, onCancel, externalContainerRef])

  const handleFocus = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    setFocused(true)
  }, [])

  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 800)
  }, [])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  const sendEnabled = text.trim().length > 0

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '8px',
        gap: '8px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: noBorder ? 'none' : '1px solid #E5E5E5',
        borderRadius: '8px',
        boxShadow: !noShadow ? '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)' : 'none',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
            {(autoFocus || focused) ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onScroll={handleScroll}
                placeholder=""
                rows={1}
                className={`scrollbar-hidden${isScrolling ? ' scrolling' : ''}`}
                style={{
                  fontSize: '14px',
                  lineHeight: '24px',
                  color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif",
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  width: '100%',
                  minHeight: '24px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: 0,
                }}
              />
            ) : (
              <span
                onClick={() => setFocused(true)}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5em',
                  color: '#999999',
                  fontFamily: "'PingFang SC', sans-serif",
                  cursor: 'pointer',
                }}
              >
                添加批注
              </span>
            )}
          </div>
        </div>
        {/* Send button */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          style={{ cursor: sendEnabled ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <rect width="20" height="20" rx="10" fill={sendEnabled ? '#2A6DE7' : '#BFBFBF'} />
          <g clipPath="url(#chatClip)">
            <path d="M5.71429 10.476H8.57143V9.52381H5.71429V5.16429C5.71429 5.03279 5.82086 4.92619 5.95238 4.92619C5.99253 4.92619 6.03197 4.93631 6.06714 4.95564L14.8587 9.79136C14.9739 9.85464 15.0161 10.0005 14.9527 10.1157C14.931 10.1553 14.8984 10.1879 14.8587 10.2096L6.06714 15.0454C5.95179 15.1087 5.80607 15.0666 5.74279 14.9513C5.72346 14.9161 5.71429 14.8767 5.71429 14.8365V10.476Z" fill="white" />
          </g>
          <defs>
            <clipPath id="chatClip">
              <rect width="11.4286" height="11.4286" fill="white" transform="translate(4.28571 4.28571)" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  )
}

/**
 * InputBox component
 * - 'Add': collapsed state with placeholder text
 * - 'adding': expanded input state (always focused)
 * - 'risk-collapsed': risk level selector + InputBoxCore, collapsed dropdown
 * - 'risk-expanded': risk level selector + dropdown options + InputBoxCore
 */
const InputBox: React.FC<InputBoxProps> = ({
  variant = 'Add',
  onSubmit,
  onCancel,
  initialText = '',
  noBorder = false,
  noShadow = false,
  riskLevels = [],
  selectedRiskIndex = 0,
  onRiskSelect,
  onToggleRisk,
}) => {
  const isAdding = variant === 'adding'
  const isRiskCollapsed = variant === 'risk-collapsed'
  const isRiskExpanded = variant === 'risk-expanded'
  const isRisk = isRiskCollapsed || isRiskExpanded

  // Ref for risk variant outer container (must be declared before early return)
  const riskContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredRiskIdx, setHoveredRiskIdx] = useState<number | null>(null)

  // For 'Add' and 'adding' variants, use InputBoxCore directly
  if (!isRisk) {
    if (isAdding) {
      return <InputBoxCore onSubmit={onSubmit} onCancel={onCancel} initialText={initialText} autoFocus noShadow={noShadow} noBorder={noBorder} />
    }
    // 'Add' variant: show collapsed placeholder
    return <InputBoxCore onSubmit={onSubmit} onCancel={onCancel} initialText={initialText} noShadow={noShadow} noBorder={noBorder} />
  }

  // Risk variants: wrapper with header + dropdown + nested InputBoxCore
  const currentRisk = riskLevels[selectedRiskIndex]

  return (
    <div
      ref={riskContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isRiskCollapsed ? 'flex-end' : 'flex-start',
        alignItems: 'stretch',
        gap: '0px',
        width: '100%',
        backgroundColor: currentRisk?.bgColor ?? '#FFFFFF',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    >
      {/* Risk header bar */}
      {currentRisk && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleRisk}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Risk icon */}
            {renderRiskIcon(currentRisk.iconType, currentRisk.color)}
            <span
              style={{
                fontSize: '12px',
                lineHeight: '1.5em',
                color: currentRisk.color,
                fontFamily: "'PingFang SC', sans-serif",
              }}
            >
              {currentRisk.label}
            </span>
          </div>
          {/* Arrow toggle */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isRiskExpanded ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M7.21911 7.99993L10.5189 11.2998L9.57611 12.2426L5.33344 7.99993L9.57611 3.75732L10.5189 4.70013L7.21911 7.99993Z" fill={currentRisk?.arrowColor ?? '#FFB3B8'} />
          </svg>
        </div>
      )}

      {/* Risk dropdown options (expanded only, exclude currently selected) */}
      {isRiskExpanded && riskLevels.length > 0 && (
        <>
          {riskLevels.map((level, idx) => {
            // Skip the currently selected risk level
            if (idx === selectedRiskIndex) return null
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  backgroundColor: hoveredRiskIdx === idx ? (currentRisk?.hoverColor ?? '#f0f0f0') : 'transparent',
                  borderRadius: '0px',
                }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHoveredRiskIdx(idx)}
                onMouseLeave={() => setHoveredRiskIdx(null)}
                onClick={() => onRiskSelect?.(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderRiskIcon(level.iconType, level.color)}
                  <span
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.5em',
                      color: level.color,
                      fontFamily: "'PingFang SC', sans-serif",
                    }}
                  >
                    {level.label}
                  </span>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Reuse InputBoxCore as the inner input area */}
      <InputBoxCore
        onSubmit={onSubmit}
        onCancel={onCancel}
        initialText={initialText}
        autoFocus
        noShadow={noShadow}
        noBorder={noBorder}
        externalContainerRef={riskContainerRef}
      />
    </div>
  )
}

export default InputBox
