import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import TopBar from './TopBar'
import Annotation from './Annotation'
import VersionCard from './VersionCard'
import AddAnno from './AddAnno'
import { resolveCardPositions, type CardRect } from '../utils/collisionResolver'

// ─── Data Model ───────────────────────────────────────────
interface AnnotationData {
  id: string
  type: 'AI' | 'manual'
  page: number
  rect: { x: number; y: number; width: number; height: number }
  department?: 'RA' | 'MA' | 'Branding' | 'Legal'
  userName?: string
  time: string
  content?: string
  issueTitle?: string
  issueContent?: string
  suggestionTitle?: string
  suggestionContent?: string
}

interface PendingSelection {
  page: number
  startX: number
  startY: number
  endX: number
  endY: number
}

// ─── Constants ────────────────────────────────────────────
const PAGE_WIDTH = 680
const PAGE_HEIGHT = 900
const PAGE_GAP = 24
const COLUMN_PADDING_TOP = 32
const PDF_TOOLBAR_HEIGHT = 50

// ─── Fallback card heights (used before DOM measurement) ────
function estimateCardHeight(anno: AnnotationData): number {
  return anno.type === 'AI' ? 150 : 90
}
const ADD_ANNO_HEIGHT = 42

// ─── Mock PDF Pages ───────────────────────────────────────
interface ContentBlock {
  type: 'title' | 'text' | 'image' | 'paragraph'
  y: number
  height: number
  width?: number
}

const mockPages: ContentBlock[][] = [
  [
    { type: 'title', y: 48, height: 28, width: 320 },
    { type: 'text', y: 96, height: 14, width: 580 },
    { type: 'text', y: 118, height: 14, width: 540 },
    { type: 'text', y: 140, height: 14, width: 560 },
    { type: 'text', y: 162, height: 14, width: 480 },
    { type: 'paragraph', y: 196, height: 14, width: 580 },
    { type: 'text', y: 218, height: 14, width: 560 },
    { type: 'text', y: 240, height: 14, width: 520 },
    { type: 'text', y: 262, height: 14, width: 580 },
    { type: 'image', y: 300, height: 200, width: 400 },
    { type: 'text', y: 530, height: 14, width: 580 },
    { type: 'text', y: 552, height: 14, width: 540 },
    { type: 'text', y: 574, height: 14, width: 500 },
    { type: 'paragraph', y: 610, height: 14, width: 580 },
    { type: 'text', y: 632, height: 14, width: 560 },
    { type: 'text', y: 654, height: 14, width: 520 },
    { type: 'text', y: 676, height: 14, width: 480 },
  ],
  [
    { type: 'title', y: 48, height: 28, width: 280 },
    { type: 'text', y: 96, height: 14, width: 560 },
    { type: 'text', y: 118, height: 14, width: 580 },
    { type: 'text', y: 140, height: 14, width: 520 },
    { type: 'text', y: 162, height: 14, width: 540 },
    { type: 'text', y: 184, height: 14, width: 480 },
    { type: 'image', y: 220, height: 180, width: 500 },
    { type: 'text', y: 430, height: 14, width: 580 },
    { type: 'text', y: 452, height: 14, width: 540 },
    { type: 'text', y: 474, height: 14, width: 560 },
    { type: 'paragraph', y: 510, height: 14, width: 580 },
    { type: 'text', y: 532, height: 14, width: 520 },
    { type: 'text', y: 554, height: 14, width: 560 },
  ],
  [
    { type: 'title', y: 48, height: 28, width: 360 },
    { type: 'text', y: 96, height: 14, width: 540 },
    { type: 'text', y: 118, height: 14, width: 580 },
    { type: 'text', y: 140, height: 14, width: 500 },
    { type: 'paragraph', y: 176, height: 14, width: 580 },
    { type: 'text', y: 198, height: 14, width: 560 },
    { type: 'text', y: 220, height: 14, width: 540 },
    { type: 'text', y: 242, height: 14, width: 580 },
    { type: 'image', y: 280, height: 220, width: 450 },
    { type: 'text', y: 530, height: 14, width: 580 },
    { type: 'text', y: 552, height: 14, width: 520 },
  ],
]

// ─── Initial Annotations ──────────────────────────────────
const initialAnnotations: AnnotationData[] = [
  {
    id: 'ai-1',
    type: 'AI',
    page: 0,
    rect: { x: 40, y: 300, width: 400, height: 200 },
    department: 'Branding',
    time: '06-24 14:32',
    issueTitle: '问题说明',
    issueContent: '此处图片分辨率偏低，当前尺寸为72dpi。',
    suggestionTitle: 'AI修改建议',
    suggestionContent: '建议更换为高清图片，建议调整至300dpi以上。',
  },
  {
    id: 'manual-1',
    type: 'manual',
    page: 0,
    rect: { x: 40, y: 530, width: 540, height: 56 },
    department: 'Legal',
    userName: '段威丞',
    time: '06-24 14:32',
    content: '此处图片分辨率偏低，建议更换为高清图片，当前尺寸为72dpi，建议调整至300dpi以上。',
  },
  {
    id: 'ai-2',
    type: 'AI',
    page: 1,
    rect: { x: 40, y: 220, width: 500, height: 180 },
    department: 'Branding',
    time: '06-24 14:32',
    issueTitle: '问题说明',
    issueContent: '此处图片尺寸与版面不匹配，建议调整比例。',
    suggestionTitle: 'AI修改建议',
    suggestionContent: '建议将图片宽度调整为页面宽度的70%。',
  },
]

// ─── Helper: page top offset ─────────────────────────────
function getPageTop(pageIndex: number): number {
  return pageIndex * (PAGE_HEIGHT + PAGE_GAP)
}

// ─── Mock PDF Page Renderer ──────────────────────────────
const MockPage: React.FC<{ blocks: ContentBlock[]; pageIndex: number }> = ({ blocks, pageIndex }) => (
  <div
    style={{
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      backgroundColor: '#FFFFFF',
      position: 'relative',
      flexShrink: 0,
      boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
      margin: '0 auto',
    }}
  >
    {blocks.map((block, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 50,
          top: block.y,
          width: block.width || 580,
          height: block.height,
          backgroundColor: block.type === 'image' ? '#E8E8E8' : block.type === 'title' ? '#D0D0D0' : '#E0E0E0',
          borderRadius: block.type === 'image' ? 4 : 2,
        }}
      />
    ))}
    <span
      style={{
        position: 'absolute',
        bottom: 20,
        right: 30,
        fontSize: 11,
        color: '#BBBBBB',
        fontFamily: "'PingFang SC', sans-serif",
      }}
    >
      {pageIndex + 1} / {mockPages.length}
    </span>
  </div>
)

// ═══════════════════════════════════════════════════════════
const ViewDocument: React.FC = () => {
  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<'批注' | '历史版本'>('批注')
  const [activeSubTab, setActiveSubTab] = useState<'全部' | 'AI' | '人工'>('全部')

  // ── Annotations ──
  const [annotations, setAnnotations] = useState<AnnotationData[]>(initialAnnotations)
  const [activeAnnotation, setActiveAnnotation] = useState<string>('')

  // ── Pending selection (box-select to add) ──
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)
  const [isAddingAnno, setIsAddingAnno] = useState(false)

  // ── Refs ──
  const sharedScrollRef = useRef<HTMLDivElement>(null)
  const pdfColumnRef = useRef<HTMLDivElement>(null)
  const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const annoCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const mainContentRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ page: number; x: number; y: number } | null>(null)

  // ── Scroll position tracker (for nav button state) ──
  const [scrollTop, setScrollTop] = useState(0)

  // ── Card height tracking (actual DOM measurements) ──
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({})
  const cardHeightsRef = useRef<Record<string, number>>({})
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  // ── Dashed line coords (one per visible annotation) ──
  const [dashedLines, setDashedLines] = useState<Record<string, {
    x1: number; y1: number; x2: number; y2: number
  }>>({})

  // ── PDF column height for annotation alignment ──
  const [pdfColumnHeight, setPdfColumnHeight] = useState(0)
  const stickyTabsRef = useRef<HTMLDivElement>(null)
  const [tabsHeight, setTabsHeight] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (pdfColumnRef.current) {
        setPdfColumnHeight(pdfColumnRef.current.offsetHeight)
      }
      if (stickyTabsRef.current) {
        setTabsHeight(stickyTabsRef.current.offsetHeight)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (pdfColumnRef.current) ro.observe(pdfColumnRef.current)
    if (stickyTabsRef.current) ro.observe(stickyTabsRef.current)
    return () => ro.disconnect()
  }, [])

  // ── ResizeObserver: track actual card heights for collision resolution ──
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      let changed = false
      entries.forEach(entry => {
        const el = entry.target as HTMLElement
        const id = el.dataset.cardId
        if (!id) return
        const h = el.offsetHeight
        if (cardHeightsRef.current[id] !== h) {
          cardHeightsRef.current = { ...cardHeightsRef.current, [id]: h }
          changed = true
        }
      })
      if (changed) {
        setCardHeights({ ...cardHeightsRef.current })
      }
    })

    // Observe all card wrapper elements
    Object.values(annoCardRefs.current).forEach(el => {
      if (el) ro.observe(el)
    })

    return () => ro.disconnect()
  }, [annotations, isAddingAnno])

  // (updateDashedLines defined after filteredAnnotations)

  // ── Mouse selection handlers ──
  const handlePdfMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const pdfEl = pdfColumnRef.current
    if (!pdfEl) return

    const pdfRect = pdfEl.getBoundingClientRect()
    // getBoundingClientRect already includes scroll offset, no need to add scrollTop
    const rawX = e.clientX - pdfRect.left
    const rawY = e.clientY - pdfRect.top

    // Pages are centered within the column, calculate page left offset
    const pageLeftOffset = (pdfRect.width - PAGE_WIDTH) / 2
    const clickX = rawX - pageLeftOffset
    // Subtract column padding-top so clickY is relative to first page start
    const clickY = rawY - COLUMN_PADDING_TOP

    const pageIndex = Math.floor(clickY / (PAGE_HEIGHT + PAGE_GAP))
    if (pageIndex < 0 || pageIndex >= mockPages.length) return

    const pageRelativeY = clickY - getPageTop(pageIndex)
    if (pageRelativeY < 0 || pageRelativeY > PAGE_HEIGHT) return
    if (clickX < 0 || clickX > PAGE_WIDTH) return

    isDraggingRef.current = true
    dragStartRef.current = { page: pageIndex, x: clickX, y: pageRelativeY }

    setIsAddingAnno(false)
    setPendingSelection(null)
    setActiveAnnotation('')
  }, [])

  const handlePdfMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return
    const pdfEl = pdfColumnRef.current
    if (!pdfEl) return

    const pdfRect = pdfEl.getBoundingClientRect()
    const pageLeftOffset = (pdfRect.width - PAGE_WIDTH) / 2
    const currentX = e.clientX - pdfRect.left - pageLeftOffset
    const currentY = e.clientY - pdfRect.top - COLUMN_PADDING_TOP

    const { page, x, y } = dragStartRef.current
    const pageRelY = currentY - getPageTop(page)

    setPendingSelection({
      page,
      startX: Math.min(x, currentX),
      startY: Math.min(y, pageRelY),
      endX: Math.max(x, currentX),
      endY: Math.max(y, pageRelY),
    })
  }, [])

  const handlePdfMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    if (pendingSelection) {
      const w = pendingSelection.endX - pendingSelection.startX
      const h = pendingSelection.endY - pendingSelection.startY
      if (w > 10 && h > 10) {
        setIsAddingAnno(true)
        // Keep pendingSelection for visual display
      } else {
        setPendingSelection(null)
      }
    }
    dragStartRef.current = null
  }, [pendingSelection])

  // ── Add annotation from selection ──
  const handleAddAnnotation = useCallback((text: string) => {
    if (!pendingSelection) return
    const newAnno: AnnotationData = {
      id: `manual-${Date.now()}`,
      type: 'manual',
      page: pendingSelection.page,
      rect: {
        x: pendingSelection.startX,
        y: pendingSelection.startY,
        width: pendingSelection.endX - pendingSelection.startX,
        height: pendingSelection.endY - pendingSelection.startY,
      },
      department: 'Legal',
      userName: '段威丞',
      time: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '-') +
        ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      content: text,
    }
    setAnnotations(prev => [...prev, newAnno])
    setPendingSelection(null)
    setIsAddingAnno(false)
    setActiveAnnotation(newAnno.id)
  }, [pendingSelection])

  const handleCancelAdd = useCallback(() => {
    setPendingSelection(null)
    setIsAddingAnno(false)
  }, [])

  // ── Delete annotation ──
  const handleDeleteAnnotation = useCallback((annoId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annoId))
    if (activeAnnotation === annoId) setActiveAnnotation('')
  }, [activeAnnotation])

  // ── Edit annotation content ──
  const handleEditAnnotation = useCallback((annoId: string, text: string) => {
    setAnnotations(prev => prev.map(a => a.id === annoId ? { ...a, content: text } : a))
  }, [])

  // ── Filter annotations by sub-tab ──
  const filteredAnnotations = useMemo(() => annotations.filter(a => {
    if (activeSubTab === 'AI') return a.type === 'AI'
    if (activeSubTab === '人工') return a.type === 'manual'
    return true
  }), [annotations, activeSubTab])

  // ── Update all dashed lines (one per visible annotation) ──
  const updateDashedLines = useCallback(() => {
    const container = sharedScrollRef.current
    if (!container) { setDashedLines({}); return }

    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const lines: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {}

    filteredAnnotations.forEach(anno => {
      const hlEl = highlightRefs.current[anno.id]
      const cardEl = annoCardRefs.current[anno.id]
      if (!hlEl || !cardEl) return

      const hlRect = hlEl.getBoundingClientRect()
      const cardRect = cardEl.getBoundingClientRect()

      // Only draw if both elements are at least partially visible
      if (hlRect.bottom < containerRect.top || hlRect.top > containerRect.bottom) return
      if (cardRect.bottom < containerRect.top || cardRect.top > containerRect.bottom) return

      lines[anno.id] = {
        x1: hlRect.right - containerRect.left,
        y1: hlRect.top + hlRect.height / 2 - containerRect.top + scrollTop,
        x2: cardRect.left - containerRect.left,
        y2: cardRect.top + cardRect.height / 2 - containerRect.top + scrollTop,
      }
    })

    setDashedLines(lines)
  }, [filteredAnnotations])

  useEffect(() => {
    updateDashedLines()
  }, [updateDashedLines, pdfColumnHeight, activeAnnotation, cardHeights])

  useEffect(() => {
    const handler = () => updateDashedLines()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [updateDashedLines])

  // ── Collision resolution: compute non-overlapping card positions using actual heights ──
  const resolvedCardTops = useMemo(() => {
    const cards: CardRect[] = []

    // Annotation cards: compute natural top position
    // PDF column abs origin is at toolbarHeight below wrapper; cards container abs origin is at tabsHeight below wrapper
    // So card top in cards-container space = highlight center + PDF_TOOLBAR_HEIGHT - tabsHeight - padding_offset
    filteredAnnotations.forEach(anno => {
      const hlCenterY = getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP + PDF_TOOLBAR_HEIGHT - tabsHeight
      const height = cardHeights[anno.id] ?? estimateCardHeight(anno)
      cards.push({ id: anno.id, top: hlCenterY - height / 2 - 12, height })
    })

    // AddAnno card — positioned to align with selection rect center in PDF column
    if (isAddingAnno && pendingSelection) {
      const selCenterY = getPageTop(pendingSelection.page)
        + (pendingSelection.startY + pendingSelection.endY) / 2
        + COLUMN_PADDING_TOP + PDF_TOOLBAR_HEIGHT - tabsHeight
      const height = cardHeights['__addAnno__'] ?? ADD_ANNO_HEIGHT
      cards.push({ id: '__addAnno__', top: selCenterY - height / 2 - 12, height })
    }

    // Resolve collisions using the layout engine
    return resolveCardPositions(cards)
  }, [filteredAnnotations, tabsHeight, isAddingAnno, pendingSelection, cardHeights])

  // ── Annotation activate handler ──
  const handleActivateAnnotation = useCallback((id: string) => {
    setActiveAnnotation(prev => prev === id ? '' : id)
    const anno = annotations.find(a => a.id === id)
    if (anno && sharedScrollRef.current) {
      const targetTop = getPageTop(anno.page) + anno.rect.y - 100
      sharedScrollRef.current.scrollTo({ top: targetTop, behavior: 'smooth' })
    }
  }, [annotations])

  // ── Sorted annotations for navigation ──
  const sortedAnnotations = useMemo(() =>
    [...filteredAnnotations].sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page
      return a.rect.y - b.rect.y
    }),
  [filteredAnnotations])

  // ── Previous / Next annotation navigation ──
  const { prevAnno, nextAnno } = useMemo(() => {
    if (sortedAnnotations.length === 0) return { prevAnno: null, nextAnno: null }

    if (activeAnnotation) {
      const idx = sortedAnnotations.findIndex(a => a.id === activeAnnotation)
      if (idx === -1) return { prevAnno: null, nextAnno: null }
      const prevIdx = (idx - 1 + sortedAnnotations.length) % sortedAnnotations.length
      const nextIdx = (idx + 1) % sortedAnnotations.length
      return {
        prevAnno: sortedAnnotations[prevIdx],
        nextAnno: sortedAnnotations[nextIdx],
      }
    }

    // No active annotation — use scroll position
    const container = sharedScrollRef.current
    if (!container) return { prevAnno: sortedAnnotations[sortedAnnotations.length - 1], nextAnno: sortedAnnotations[0] }

    const viewportCenter = container.scrollTop + container.clientHeight / 2

    let nextIdx = sortedAnnotations.findIndex(anno => {
      const annoCenterY = getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP
      return annoCenterY >= viewportCenter
    })

    if (nextIdx === -1) nextIdx = 0
    if (nextIdx === 0 && sortedAnnotations.length > 0) {
      const firstCenterY = getPageTop(sortedAnnotations[0].page) + sortedAnnotations[0].rect.y + sortedAnnotations[0].rect.height / 2 + COLUMN_PADDING_TOP
      if (firstCenterY >= container.scrollTop) {
        nextIdx = 1 % sortedAnnotations.length
      }
    }

    const prevIdx = (nextIdx - 1 + sortedAnnotations.length) % sortedAnnotations.length
    return {
      prevAnno: sortedAnnotations[prevIdx],
      nextAnno: sortedAnnotations[nextIdx],
    }
  }, [sortedAnnotations, activeAnnotation, scrollTop])

  const navigateToAnnotation = useCallback((anno: AnnotationData) => {
    if (!sharedScrollRef.current) return
    const container = sharedScrollRef.current
    const annoCenterY = getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP
    const targetScroll = annoCenterY - container.clientHeight / 2
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
    setActiveAnnotation(anno.id)
  }, [])

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* TopBar */}
      <TopBar variant="人工审核中-创建人" />

      {/* Main content wrapper (relative for SVG overlay) */}
      <div ref={mainContentRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* ─── Thumbnail sidebar (fixed) ─── */}
        <div
          style={{
            display: 'flex',
            padding: '16px 12px',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E5E5',
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '13px', width: '61px' }}>
            {mockPages.map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  if (sharedScrollRef.current) {
                    sharedScrollRef.current.scrollTo({ top: getPageTop(i), behavior: 'smooth' })
                  }
                }}
                style={{
                  width: '61px',
                  height: '76px',
                  backgroundColor: '#D9D9D9',
                  borderRadius: '2px',
                  flexShrink: 0,
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ─── Center column: Shared scroll (toolbar inside as sticky) ─── */}
        <div
          ref={sharedScrollRef}
          onScroll={(e) => {
            updateDashedLines()
            setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)
          }}
          onMouseMove={handlePdfMouseMove}
          onMouseUp={handlePdfMouseUp}
          style={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
          }}
        >
          {/* PDF area wrapper: toolbar + PDF pages (side by side with cards column) */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, alignSelf: 'flex-start' }}>
            {/* PDF Toolbar (sticky at top) */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E5E5',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>−</span>
              <span style={{ fontSize: 13, color: '#333' }}>100%</span>
              <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>+</span>
              <div style={{ width: 1, height: 20, backgroundColor: '#E5E5E5' }} />
              <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>上一页</span>
              <span style={{ fontSize: 13, color: '#333' }}>1 / {mockPages.length}</span>
              <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>下一页</span>

              {/* Spacer to push nav buttons to the right */}
              <div style={{ flex: 1 }} />

              {/* ── Annotation Navigation Buttons ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 上一条批注 */}
                <div
                  onClick={() => prevAnno ? navigateToAnnotation(prevAnno) : undefined}
                  onMouseEnter={e => { if (prevAnno) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F5F5F5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 4px',
                    gap: 4,
                    cursor: prevAnno ? 'pointer' : 'default',
                    borderRadius: 4,
                    transition: 'background-color 0.15s',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M11.39 9.45313L9.70902 11.3438H14.6667V12.6771H9.70902L11.39 14.5677L10.3939 15.4531L7.33337 12.0104L10.3939 8.56771L11.39 9.45313Z" fill={prevAnno ? '#333333' : '#BFBFBF'} />
                    <path d="M14 2C14.3682 2 14.6667 2.29848 14.6667 2.66667V7.33333H13.3334V3.33333H2.66671V12.2565L3.84184 11.3333H6.00004V12.6667H4.30277L1.33337 15V2.66667C1.33337 2.29848 1.63185 2 2.00004 2H14Z" fill={prevAnno ? '#333333' : '#BFBFBF'} />
                  </svg>
                  <span style={{ fontSize: 12, color: prevAnno ? '#333333' : '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>上一条批注</span>
                </div>

                {/* 下一条批注 */}
                <div
                  onClick={() => nextAnno ? navigateToAnnotation(nextAnno) : undefined}
                  onMouseEnter={e => { if (nextAnno) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F5F5F5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 4px',
                    gap: 4,
                    cursor: nextAnno ? 'pointer' : 'default',
                    borderRadius: 4,
                    transition: 'background-color 0.15s',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M14.6667 12.0104L11.6062 15.4531L10.6101 14.5677L12.2911 12.6771H7.33337V11.3438H12.2911L10.6101 9.45313L11.6062 8.56771L14.6667 12.0104Z" fill={nextAnno ? '#333333' : '#BFBFBF'} />
                    <path d="M14 2C14.3682 2 14.6667 2.29848 14.6667 2.66667V7.33333H13.3334V3.33333H2.66671V12.2565L3.84184 11.3333H6.00004V12.6667H4.30277L1.33337 15V2.66667C1.33337 2.29848 1.63185 2 2.00004 2H14Z" fill={nextAnno ? '#333333' : '#BFBFBF'} />
                  </svg>
                  <span style={{ fontSize: 12, color: nextAnno ? '#333333' : '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>下一条批注</span>
                </div>
              </div>
            </div>

            {/* ── PDF pages column ── */}
            <div
              ref={pdfColumnRef}
              onMouseDown={handlePdfMouseDown}
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: `${COLUMN_PADDING_TOP}px 40px 60px`,
                gap: `${PAGE_GAP}px`,
                backgroundColor: '#F5F5F5',
                minWidth: 0,
                userSelect: 'none',
              }}
            >
              {/* Pages */}
              {mockPages.map((blocks, i) => (
                <MockPage key={i} blocks={blocks} pageIndex={i} />
              ))}

              {/* Highlight rectangles */}
              {annotations.map(anno => {
                const pageTop = getPageTop(anno.page)
                const isActive = activeAnnotation === anno.id
                const color = anno.type === 'AI' ? 'rgba(42,109,231,0.15)' : 'rgba(69,191,101,0.15)'
                const activeColor = anno.type === 'AI' ? 'rgba(42,109,231,0.35)' : 'rgba(69,191,101,0.35)'
                return (
                  <div
                    key={`hl-${anno.id}`}
                    ref={el => { highlightRefs.current[anno.id] = el }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleActivateAnnotation(anno.id)
                    }}
                    style={{
                      position: 'absolute',
                      left: `calc(50% - ${PAGE_WIDTH / 2}px + ${anno.rect.x}px)`,
                      top: `${pageTop + anno.rect.y + COLUMN_PADDING_TOP}px`,
                      width: anno.rect.width,
                      height: anno.rect.height,
                      backgroundColor: isActive ? activeColor : color,
                      border: isActive
                        ? `2px solid ${anno.type === 'AI' ? '#2A6DE7' : '#45BF65'}`
                        : '1px solid transparent',
                      borderRadius: 2,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 5,
                      transition: 'background-color 0.2s, border 0.2s',
                    }}
                  />
                )
              })}

              {/* Pending selection rectangle */}
              {pendingSelection && (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(50% - ${PAGE_WIDTH / 2}px + ${pendingSelection.startX}px)`,
                    top: `${getPageTop(pendingSelection.page) + pendingSelection.startY + COLUMN_PADDING_TOP}px`,
                    width: pendingSelection.endX - pendingSelection.startX,
                    height: pendingSelection.endY - pendingSelection.startY,
                    backgroundColor: 'rgba(42,109,231,0.12)',
                    border: '2px dashed #2A6DE7',
                    borderRadius: 2,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          </div>

            {/* ── Annotation cards column (inside same scroll) ── */}
            <div
              style={{
                width: '397px',
                flexShrink: 0,
                alignSelf: 'flex-start',
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid #E5E5E5',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Tabs (sticky at top of annotation column) */}
              <div ref={stickyTabsRef} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 15 }}>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px 0', gap: '10px', borderBottom: activeTab === '批注' ? '1px solid #E5E5E5' : 'none' }}>
                  <div style={{ display: 'flex', padding: '2px', gap: '2px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                    <div
                      onClick={() => setActiveTab('批注')}
                      style={{
                        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '8px 0', borderRadius: '6px',
                        backgroundColor: activeTab === '批注' ? '#FFFFFF' : 'transparent',
                        boxShadow: activeTab === '批注' ? '0px 2px 4px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: activeTab === '批注' ? 600 : 400, color: activeTab === '批注' ? '#333' : '#666', fontFamily: "'PingFang SC', sans-serif" }}>批注</span>
                    </div>
                    <div
                      onClick={() => setActiveTab('历史版本')}
                      style={{
                        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '8px 0', borderRadius: '6px',
                        backgroundColor: activeTab === '历史版本' ? '#FFFFFF' : 'transparent',
                        boxShadow: activeTab === '历史版本' ? '0px 2px 4px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: activeTab === '历史版本' ? 600 : 400, color: activeTab === '历史版本' ? '#333' : '#666', fontFamily: "'PingFang SC', sans-serif" }}>历史版本</span>
                    </div>
                  </div>

                  {activeTab === '批注' && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {(['全部', 'AI', '人工'] as const).map(tab => (
                        <div
                          key={tab}
                          onClick={() => setActiveSubTab(tab)}
                          style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            padding: '14px 16px',
                            borderBottom: activeSubTab === tab ? '2px solid #2A6DE7' : '2px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: activeSubTab === tab ? 600 : 400, color: activeSubTab === tab ? '#2A6DE7' : '#333', textAlign: 'center', fontFamily: "'PingFang SC', sans-serif" }}>{tab}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Annotation cards - absolutely positioned to align with highlights */}
              <div
                ref={cardsContainerRef}
                onClick={() => setActiveAnnotation('')}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  height: pdfColumnHeight > 0 ? pdfColumnHeight : undefined,
                  padding: '12px 8px',
                }}
              >
                {activeTab === '批注' ? (
                  <>
                    {isAddingAnno && pendingSelection && (() => {
                      const addAnnoTop = resolvedCardTops['__addAnno__'] ?? (
                        getPageTop(pendingSelection.page)
                        + (pendingSelection.startY + pendingSelection.endY) / 2
                        + COLUMN_PADDING_TOP + PDF_TOOLBAR_HEIGHT - tabsHeight - 12
                        - (cardHeights['__addAnno__'] ?? ADD_ANNO_HEIGHT) / 2
                      )
                      return (
                        <div
                          data-card-id="__addAnno__"
                          ref={el => { annoCardRefs.current['__addAnno__'] = el }}
                          onClick={(e) => e.stopPropagation()} style={{
                          position: 'absolute',
                          top: addAnnoTop,
                          left: 8,
                          right: 8,
                          zIndex: 10,
                        }}>
                          <AddAnno
                            variant="adding"
                            onSubmit={handleAddAnnotation}
                            onCancel={handleCancelAdd}
                          />
                        </div>
                      )
                    })()}
                    {filteredAnnotations.map(anno => {
                      const cardTop = resolvedCardTops[anno.id] ?? (
                        getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2
                        + COLUMN_PADDING_TOP + PDF_TOOLBAR_HEIGHT - tabsHeight - 12
                        - (cardHeights[anno.id] ?? estimateCardHeight(anno)) / 2
                      )
                      return (
                        <div
                          key={anno.id}
                          data-card-id={anno.id}
                          ref={el => { annoCardRefs.current[anno.id] = el }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: cardTop,
                            left: 8,
                            right: 8,
                            zIndex: activeAnnotation === anno.id ? 6 : 1,
                          }}
                        >
                          <Annotation
                            variant={anno.type === 'AI' ? 'AI' : 'manual'}
                            department={anno.department as any}
                            userName={anno.userName}
                            time={anno.time}
                            content={anno.content}
                            issueTitle={anno.issueTitle}
                            issueContent={anno.issueContent}
                            suggestionTitle={anno.suggestionTitle}
                            suggestionContent={anno.suggestionContent}
                            interactive
                            id={anno.id}
                            isActive={activeAnnotation === anno.id}
                            onActivate={handleActivateAnnotation}
                            onDelete={handleDeleteAnnotation}
                            onEdit={handleEditAnnotation}
                          />
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <VersionCard variant="current" version="V3" department="Branding" userName="段威丞" time="2026-05-19 15:20" tagVariant="人工审核中" />
                    <VersionCard variant="old" version="V2" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="待补充" />
                    <VersionCard variant="old" version="V1" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="返回修改" />
                  </div>
                )}
              </div>
            </div>

            {/* ─── SVG Dashed Lines Overlay (all visible annotations) ─── */}
            {Object.keys(dashedLines).length > 0 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 8,
                }}
              >
                {filteredAnnotations.map(anno => {
                  const line = dashedLines[anno.id]
                  if (!line) return null
                  const isActive = activeAnnotation === anno.id
                  const color = anno.type === 'AI' ? '#2A6DE7' : '#45BF65'
                  // 两段式折线：水平→转折→卡片
                  // 转折点：距卡片左侧80px，Y轴与高亮区中心对齐
                  const turnX = line.x2 - 80
                  const points = `${line.x1},${line.y1} ${turnX},${line.y1} ${line.x2},${line.y2}`
                  return (
                    <polyline
                      key={`dash-${anno.id}`}
                      points={points}
                      fill="none"
                      stroke={color}
                      strokeWidth={isActive ? 2 : 1.5}
                      strokeDasharray={isActive ? "none" : "6 4"}
                      opacity={isActive ? 1 : 0.6}
                    />
                  )
                })}
              </svg>
            )}
          </div>
      </div>
    </div>
  )
}

export default ViewDocument
