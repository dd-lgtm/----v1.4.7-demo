import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import TopBar from './TopBar'
import Annotation from './Annotation'
import VersionCard from './VersionCard'
import InputBox from './InputBox'
import Modal from './Modal'
import { resolveCardPositions, type CardRect } from '../utils/collisionResolver'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// PDF worker & file
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PDF_FILE = '/曲拉西利预防肺癌化疗引起的骨髓抑制1例及文献分析_黄豪杰.pdf'
const PDF_PAGE_COUNT = 5
const THUMB_WIDTH = 57

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
  risk?: 'high' | 'medium' | 'low'
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

// ─── Zoom constants ─────────────────────────────────────────
const ZOOM_MIN = 0.25
const ZOOM_STEP = 0.1
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

// ─── Fallback card heights (used before DOM measurement) ────
function estimateCardHeight(anno: AnnotationData): number {
  return anno.type === 'AI' ? 200 : 120
}
const ADD_ANNO_HEIGHT = 42

// ─── Department color map (matches Department.tsx) ──────────
const DEPT_COLORS: Record<string, string> = {
  RA: '#00CEE0',
  MA: '#33B1FF',
  Branding: '#BE95FF',
  Legal: '#FF832C',
}

/** Convert hex color to rgba with given alpha */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── PDF Pages (rendered from real PDF file) ─────────────
// mockPages kept as length array for iteration; actual content from PDF
const mockPages: undefined[] = Array(PDF_PAGE_COUNT).fill(undefined)

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
    issueContent: '图片色彩空间与印刷标准不匹配，当前为RGB模式，在印刷输出时可能出现明显色差偏差，影响品牌视觉一致性。经检测，该图片色域覆盖范围超出CMYK可印刷色域约15%，部分高饱和度颜色在转换后会产生色相偏移。',
    suggestionTitle: 'AI修改建议',
    suggestionContent: '建议将图片色彩空间转换为CMYK模式（FOGRA39标准），并使用ICC配置文件进行软打样预览，以确保印刷色彩准确性。同时对高饱和度区域进行手动色域映射调整，避免关键品牌色出现偏移。',
    risk: 'high',
  },
  {
    id: 'ai-2',
    type: 'AI',
    page: 1,
    rect: { x: 40, y: 220, width: 500, height: 180 },
    department: 'Legal',
    time: '06-24 15:10',
    issueTitle: '问题说明',
    issueContent: '页面底部版权声明字体过小，不符合合规要求。',
    suggestionTitle: 'AI修改建议',
    suggestionContent: '建议将版权声明字号从6pt调整为8pt，确保文字清晰可读。',
    risk: 'medium',
  },
  {
    id: 'ai-3',
    type: 'AI',
    page: 0,
    rect: { x: 40, y: 560, width: 460, height: 160 },
    department: 'RA',
    time: '06-24 15:38',
    issueTitle: '问题说明',
    issueContent: '产品描述中“疗效显著”用词可能涉及广告法合规风险。',
    suggestionTitle: 'AI修改建议',
    suggestionContent: '建议将“疗效显著”修改为“经临床验证”，以符合广告法相关规定。',
    risk: 'low',
  },
]

// ─── Helper: page top offset ─────────────────────────────
function getPageTop(pageIndex: number): number {
  return pageIndex * (PAGE_HEIGHT + PAGE_GAP)
}

// ─── PDF Page Renderer ─────────────────────────────────────
const PdfPage: React.FC<{ pageIndex: number }> = ({ pageIndex }) => (
  <Document file={PDF_FILE} loading={null}>
    <Page
      pageNumber={pageIndex + 1}
      width={PAGE_WIDTH}
      renderTextLayer={false}
      renderAnnotationLayer={false}
      loading={null}
    />
  </Document>
)

const PdfThumbnail: React.FC<{ pageIndex: number }> = ({ pageIndex }) => (
  <Document file={PDF_FILE} loading={null}>
    <Page
      pageNumber={pageIndex + 1}
      width={THUMB_WIDTH}
      renderTextLayer={false}
      renderAnnotationLayer={false}
      loading={null}
    />
  </Document>
)

// ═══════════════════════════════════════════════════════════
const ViewDocument: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const docStatus = (searchParams.get('status') || '人工审核中') as string
  const docSource = (searchParams.get('source') || 'review') as string
  const rowId = (searchParams.get('rowId') || '') as string
  const urlReviewResult = (searchParams.get('reviewResult') || '') as string
  const isAIReviewing = docStatus === 'AI审核中'
  const isAIReviewFailed = docStatus === 'AI审核失败'
  const isReadOnly = docSource === 'created' || (docSource === 'review' && docStatus !== '人工审核中')

  // ── 提交审核 Modal state ──
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Department reviewers for submit modal
  const departments = ['Branding', 'MA', 'Legal', 'RA'] as const
  const [reviewerSelections, setReviewerSelections] = useState<Record<string, string>>({
    Branding: '',
    MA: '',
    Legal: '',
    RA: '',
  })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const mockReviewers = ['段威丞', '李明', '王芳', '张伟']

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<'批注' | '历史版本'>('批注')
  const [activeSubTab, setActiveSubTab] = useState<'全部' | 'AI' | '人工' | '本部门'>('全部')

  // ── Annotations ──
  const [annotations, setAnnotations] = useState<AnnotationData[]>(
    isAIReviewing || isAIReviewFailed ? [] : initialAnnotations
  )
  const [activeAnnotation, setActiveAnnotation] = useState<string>('')

  // ── Pending selection (box-select to add) ──
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)
  const [isAddingAnno, setIsAddingAnno] = useState(false)
  const [addAnnoRiskIndex, setAddAnnoRiskIndex] = useState(0)
  const [addAnnoRiskExpanded, setAddAnnoRiskExpanded] = useState(false)

  const RISK_LEVELS = [
    { label: '高风险', color: '#FA4D56', arrowColor: '#FFB3B8', bgColor: '#FFF1F1', hoverColor: '#FFE3E3', iconType: 'alert-fill' as const },
    { label: '中风险', color: '#d69d00', arrowColor: '#ffc629', bgColor: '#fef6df', hoverColor: '#ffebb3', iconType: 'alert-line' as const },
    { label: '低风险', color: '#4382f8', arrowColor: '#87b0fb', bgColor: '#f4f8ff', hoverColor: '#dce9ff' }
  ]

  // ── Review action state ──
  type ReviewAction = '审核通过' | '返回修改' | '待补充' | '无需审核'
  const [pendingReviewAction, setPendingReviewAction] = useState<ReviewAction | null>(null)
  // Initialize from sessionStorage (or URL fallback) so re-entering a reviewed document preserves state
  const [reviewResult, setReviewResult] = useState<ReviewAction | null>(() => {
    if (rowId) {
      try {
        const results = JSON.parse(sessionStorage.getItem('review_results') || '{}') as Record<string, string>
        if (results[rowId]) return results[rowId] as ReviewAction
      } catch { /* ignore */ }
    }
    // Fallback: read from URL param (passed by Workbench for pre-reviewed docs)
    if (urlReviewResult) return urlReviewResult as ReviewAction
    return null
  })

  const handleConfirmReview = useCallback(() => {
    if (!pendingReviewAction) return
    setReviewResult(pendingReviewAction)
    setPendingReviewAction(null)
    // Persist review result to sessionStorage (for Workbench sync + page re-entry)
    if (!rowId) return
    try {
      // Save reviewed row IDs for Workbench button change
      const reviewed = JSON.parse(sessionStorage.getItem('reviewed_docs') || '[]') as string[]
      if (!reviewed.includes(rowId)) {
        reviewed.push(rowId)
        sessionStorage.setItem('reviewed_docs', JSON.stringify(reviewed))
      }
      // Save the specific review action for ViewDocument re-entry
      const results = JSON.parse(sessionStorage.getItem('review_results') || '{}') as Record<string, string>
      results[rowId] = pendingReviewAction
      sessionStorage.setItem('review_results', JSON.stringify(results))
    } catch { /* ignore */ }
  }, [pendingReviewAction, rowId])

  // ── Zoom state ──
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState(0)

  // Dynamic maxZoom: PDF page can fill up to 90% of the container width
  const maxZoom = useMemo(() => {
    if (containerWidth <= 0) return 3
    return Math.max(1, Math.floor((containerWidth * 0.9) / PAGE_WIDTH * 100) / 100)
  }, [containerWidth])

  // Track PDF area width for dynamic maxZoom (excludes cards column)
  useEffect(() => {
    const el = pdfAreaRef.current
    if (!el) return
    const measure = () => setContainerWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Clamp zoom when maxZoom shrinks (e.g. window resize)
  useEffect(() => {
    setZoom(prev => Math.min(prev, maxZoom))
  }, [maxZoom])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const next = ZOOM_LEVELS.find(l => l > prev + 0.001 && l <= maxZoom)
      return next !== undefined ? next : Math.min(prev + ZOOM_STEP, maxZoom)
    })
  }, [maxZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const levels = [...ZOOM_LEVELS].reverse()
      const next = levels.find(l => l < prev - 0.001)
      return next !== undefined ? next : Math.max(prev - ZOOM_STEP, ZOOM_MIN)
    })
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  // ── Trackpad pinch-to-zoom (ctrlKey + wheel on macOS) ──
  useEffect(() => {
    const el = sharedScrollRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      // macOS trackpad pinch sends ctrlKey + deltaY
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = -e.deltaY * 0.01
      setZoom(prev => {
        const next = Math.round((prev + delta) * 100) / 100
        return Math.max(ZOOM_MIN, Math.min(maxZoom, next))
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [maxZoom])

  // ── Refs ──
  const sharedScrollRef = useRef<HTMLDivElement>(null)
  const pdfAreaRef = useRef<HTMLDivElement>(null)
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

  // ── Dashed line for pending selection → InputBox ──
  const [pendingDashedLine, setPendingDashedLine] = useState<{
    x1: number; y1: number; x2: number; y2: number
  } | null>(null)

  // ── PDF column height for annotation alignment ──
  const [pdfColumnHeight, setPdfColumnHeight] = useState(0)
  const stickyTabsRef = useRef<HTMLDivElement>(null)
  const [tabsHeight, setTabsHeight] = useState(0)
  // ── PDF column center X for action bar positioning ──
  const [pdfColumnCenterX, setPdfColumnCenterX] = useState<number | null>(null)

  useEffect(() => {
    const measure = () => {
      if (pdfColumnRef.current) {
        // Inner element has height: auto; transform scale doesn't affect offsetHeight
        setPdfColumnHeight(pdfColumnRef.current.offsetHeight)
        const rect = pdfColumnRef.current.getBoundingClientRect()
        setPdfColumnCenterX(rect.left + rect.width / 2)
      }
      if (stickyTabsRef.current) {
        setTabsHeight(stickyTabsRef.current.offsetHeight)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (pdfColumnRef.current) ro.observe(pdfColumnRef.current)
    if (stickyTabsRef.current) ro.observe(stickyTabsRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [zoom])

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
  }, [annotations, isAddingAnno, zoom])

  // (updateDashedLines defined after filteredAnnotations)

  // ── Mouse selection handlers ──
  const handlePdfMouseDown = useCallback((e: React.MouseEvent) => {
    if (isReadOnly) return
    if (e.button !== 0) return
    const pdfEl = pdfColumnRef.current
    if (!pdfEl) return

    const pdfRect = pdfEl.getBoundingClientRect()
    // getBoundingClientRect returns scaled (screen) coords; convert to base coords
    const rawX = (e.clientX - pdfRect.left) / zoom
    const rawY = (e.clientY - pdfRect.top) / zoom

    // Pages are centered within the column, calculate page left offset
    const pageLeftOffset = (pdfRect.width / zoom - PAGE_WIDTH) / 2
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
  }, [isReadOnly, zoom])

  const handlePdfMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return
    const pdfEl = pdfColumnRef.current
    if (!pdfEl) return

    const pdfRect = pdfEl.getBoundingClientRect()
    const pageLeftOffset = (pdfRect.width / zoom - PAGE_WIDTH) / 2
    const currentX = (e.clientX - pdfRect.left) / zoom - pageLeftOffset
    const currentY = (e.clientY - pdfRect.top) / zoom - COLUMN_PADDING_TOP

    const { page, x, y } = dragStartRef.current
    const pageRelY = currentY - getPageTop(page)

    setPendingSelection({
      page,
      startX: Math.min(x, currentX),
      startY: Math.min(y, pageRelY),
      endX: Math.max(x, currentX),
      endY: Math.max(y, pageRelY),
    })
  }, [zoom])

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
      risk: (['high', 'medium', 'low'] as const)[addAnnoRiskIndex] ?? 'high',
    }
    setAnnotations(prev => [...prev, newAnno])
    setPendingSelection(null)
    setIsAddingAnno(false)
    setAddAnnoRiskIndex(0)
    setAddAnnoRiskExpanded(false)
    setActiveAnnotation(newAnno.id)
  }, [pendingSelection, addAnnoRiskIndex])

  const handleCancelAdd = useCallback(() => {
    setPendingSelection(null)
    setIsAddingAnno(false)
    setAddAnnoRiskIndex(0)
    setAddAnnoRiskExpanded(false)
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

  const handleRiskChange = useCallback((annoId: string, risk: 'high' | 'medium' | 'low') => {
    setAnnotations(prev => prev.map(a => a.id === annoId ? { ...a, risk } : a))
  }, [])

  // ── Filter annotations by sub-tab ──
  const filteredAnnotations = useMemo(() => annotations.filter(a => {
    if (activeSubTab === 'AI') return a.type === 'AI'
    if (activeSubTab === '人工') return a.type === 'manual'
    if (activeSubTab === '本部门') return a.department === 'Branding'
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

  // ── Compute dashed line from pending selection highlight to InputBox card ──
  useEffect(() => {
    if (!isAddingAnno || !pendingSelection) {
      setPendingDashedLine(null)
      return
    }
    const computeLine = () => {
      const container = sharedScrollRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const scrollY = container.scrollTop

      // Find the pending selection highlight (has no data-card-id, identified by border style)
      const pdfCol = pdfColumnRef.current
      if (!pdfCol) return
      const hlEl = pdfCol.querySelector('[data-pending-highlight]') as HTMLElement | null
      const cardEl = annoCardRefs.current['__addAnno__']
      if (!hlEl || !cardEl) return

      const hlRect = hlEl.getBoundingClientRect()
      const cardRect = cardEl.getBoundingClientRect()

      if (hlRect.bottom < containerRect.top || hlRect.top > containerRect.bottom) return
      if (cardRect.bottom < containerRect.top || cardRect.top > containerRect.bottom) return

      setPendingDashedLine({
        x1: hlRect.right - containerRect.left,
        y1: hlRect.top + hlRect.height / 2 - containerRect.top + scrollY,
        x2: cardRect.left - containerRect.left,
        y2: cardRect.top + cardRect.height / 2 - containerRect.top + scrollY,
      })
    }
    const raf = requestAnimationFrame(computeLine)
    return () => cancelAnimationFrame(raf)
  }, [isAddingAnno, pendingSelection, dashedLines, cardHeights])

  // ── Collision resolution: compute non-overlapping card positions using actual heights ──
  const resolvedCardTops = useMemo(() => {
    const cards: CardRect[] = []

    // Annotation cards: compute natural top position
    // PDF column abs origin is at toolbarHeight below wrapper; cards container abs origin is at tabsHeight below wrapper
    // So card top in cards-container space = highlight center + PDF_TOOLBAR_HEIGHT - tabsHeight - padding_offset
    filteredAnnotations.forEach(anno => {
      const hlCenterY = (getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP) * zoom + PDF_TOOLBAR_HEIGHT - tabsHeight
      const height = cardHeights[anno.id] ?? estimateCardHeight(anno)
      cards.push({ id: anno.id, top: hlCenterY - height / 2 - 12, height })
    })

    // InputBox card — positioned to align with selection rect center in PDF column
    if (isAddingAnno && pendingSelection) {
      const selCenterY = (getPageTop(pendingSelection.page)
        + (pendingSelection.startY + pendingSelection.endY) / 2
        + COLUMN_PADDING_TOP) * zoom + PDF_TOOLBAR_HEIGHT - tabsHeight
      const height = cardHeights['__addAnno__'] ?? ADD_ANNO_HEIGHT
      cards.push({ id: '__addAnno__', top: selCenterY - height / 2 - 12, height })
    }

    // Resolve collisions using the layout engine
    return resolveCardPositions(cards)
  }, [filteredAnnotations, tabsHeight, isAddingAnno, pendingSelection, cardHeights, zoom])

  // ── Annotation activate handler ──
  const handleActivateAnnotation = useCallback((id: string) => {
    setActiveAnnotation(prev => prev === id ? '' : id)
    const anno = annotations.find(a => a.id === id)
    if (anno && sharedScrollRef.current) {
      const targetTop = (getPageTop(anno.page) + anno.rect.y) * zoom - 100
      sharedScrollRef.current.scrollTo({ top: targetTop, behavior: 'smooth' })
    }
  }, [annotations, zoom])

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
      const annoCenterY = (getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP) * zoom
      return annoCenterY >= viewportCenter
    })

    if (nextIdx === -1) nextIdx = 0
    if (nextIdx === 0 && sortedAnnotations.length > 0) {
      const firstCenterY = (getPageTop(sortedAnnotations[0].page) + sortedAnnotations[0].rect.y + sortedAnnotations[0].rect.height / 2 + COLUMN_PADDING_TOP) * zoom
      if (firstCenterY >= container.scrollTop) {
        nextIdx = 1 % sortedAnnotations.length
      }
    }

    const prevIdx = (nextIdx - 1 + sortedAnnotations.length) % sortedAnnotations.length
    return {
      prevAnno: sortedAnnotations[prevIdx],
      nextAnno: sortedAnnotations[nextIdx],
    }
  }, [sortedAnnotations, activeAnnotation, scrollTop, zoom])

  const navigateToAnnotation = useCallback((anno: AnnotationData) => {
    if (!sharedScrollRef.current) return
    const container = sharedScrollRef.current
    const annoCenterY = (getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2 + COLUMN_PADDING_TOP) * zoom
    const targetScroll = annoCenterY - container.clientHeight / 2
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
    setActiveAnnotation(anno.id)
  }, [zoom])

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* TopBar */}
      <TopBar status={docStatus as any} reviewResult={reviewResult ?? undefined} />

      {/* ── AI审核失败 Warning Banner ── */}
      {isAIReviewFailed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '8px 70px',
          backgroundColor: '#FFF1F1',
          flexShrink: 0,
        }}>
          {/* Error warning icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="#FA4D56"/>
          </svg>
          <span style={{
            fontSize: 14,
            color: '#FA4D56',
            fontFamily: "'PingFang SC', sans-serif",
            fontWeight: 400,
          }}>由于XXXX，AI审核失败，请重新上传或重试</span>
        </div>
      )}

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
                    sharedScrollRef.current.scrollTo({ top: getPageTop(i) * zoom, behavior: 'smooth' })
                  }
                }}
                style={{
                  width: '61px',
                  height: '76px',
                  borderRadius: '2px',
                  flexShrink: 0,
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'border-color 0.2s',
                  overflow: 'hidden',
                  backgroundColor: '#F5F5F5',
                }}
              >
                <PdfThumbnail pageIndex={i} />
              </div>
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
            overflowX: 'auto',
            minHeight: 0,
          }}
        >
          {/* PDF area wrapper: toolbar + PDF pages (side by side with cards column) */}
          <div ref={pdfAreaRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, alignSelf: 'flex-start' }}>
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
                justifyContent: isAIReviewing ? 'flex-end' : 'flex-start',
              }}
            >
              {!isAIReviewing && (
                <>
                  <span
                    onClick={handleZoomOut}
                    onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.backgroundColor = '#F5F5F5' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent' }}
                    style={{
                      fontSize: 16, color: zoom <= ZOOM_MIN ? '#BFBFBF' : '#666', cursor: zoom <= ZOOM_MIN ? 'default' : 'pointer',
                      width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 4, transition: 'background-color 0.15s', userSelect: 'none',
                      pointerEvents: zoom <= ZOOM_MIN ? 'none' : 'auto',
                    }}
                  >−</span>
                  <span
                    onClick={handleZoomReset}
                    style={{ fontSize: 13, color: '#666', cursor: 'pointer', minWidth: 40, textAlign: 'center', userSelect: 'none' }}
                  >{Math.round(zoom * 100)}%</span>
                  <span
                    onClick={handleZoomIn}
                    onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.backgroundColor = '#F5F5F5' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent' }}
                    style={{
                      fontSize: 16, color: zoom >= maxZoom ? '#BFBFBF' : '#666', cursor: zoom >= maxZoom ? 'default' : 'pointer',
                      width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 4, transition: 'background-color 0.15s', userSelect: 'none',
                      pointerEvents: zoom >= maxZoom ? 'none' : 'auto',
                    }}
                  >+</span>
                  <div style={{ width: 1, height: 20, backgroundColor: '#E5E5E5' }} />
                  <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>上一页</span>
                  <span style={{ fontSize: 13, color: '#666' }}>1 / {mockPages.length}</span>
                  <span style={{ fontSize: 13, color: '#666', cursor: 'pointer' }}>下一页</span>
                  {/* Spacer to push nav buttons to the right */}
                  <div style={{ flex: 1 }} />
                </>
              )}

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
                    <path d="M11.39 9.45313L9.70902 11.3438H14.6667V12.6771H9.70902L11.39 14.5677L10.3939 15.4531L7.33337 12.0104L10.3939 8.56771L11.39 9.45313Z" fill={prevAnno ? '#666666' : '#BFBFBF'} />
                    <path d="M14 2C14.3682 2 14.6667 2.29848 14.6667 2.66667V7.33333H13.3334V3.33333H2.66671V12.2565L3.84184 11.3333H6.00004V12.6667H4.30277L1.33337 15V2.66667C1.33337 2.29848 1.63185 2 2.00004 2H14Z" fill={prevAnno ? '#666666' : '#BFBFBF'} />
                  </svg>
                  <span style={{ fontSize: 12, color: prevAnno ? '#666666' : '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>上一条批注</span>
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
                    <path d="M14.6667 12.0104L11.6062 15.4531L10.6101 14.5677L12.2911 12.6771H7.33337V11.3438H12.2911L10.6101 9.45313L11.6062 8.56771L14.6667 12.0104Z" fill={nextAnno ? '#666666' : '#BFBFBF'} />
                    <path d="M14 2C14.3682 2 14.6667 2.29848 14.6667 2.66667V7.33333H13.3334V3.33333H2.66671V12.2565L3.84184 11.3333H6.00004V12.6667H4.30277L1.33337 15V2.66667C1.33337 2.29848 1.63185 2 2.00004 2H14Z" fill={nextAnno ? '#666666' : '#BFBFBF'} />
                  </svg>
                  <span style={{ fontSize: 12, color: nextAnno ? '#666666' : '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>下一条批注</span>
                </div>
              </div>
            </div>

            {/* ── PDF pages column (zoom sizer wrapper) ── */}
            <div style={{
              width: '100%',
              height: pdfColumnHeight > 0 ? pdfColumnHeight * zoom : undefined,
              flexShrink: 0,
              minWidth: 0,
              backgroundColor: '#F0F0F0',
            }}>
              <div
                ref={pdfColumnRef}
                onMouseDown={handlePdfMouseDown}
                style={{
                  width: '100%',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: `${COLUMN_PADDING_TOP}px 40px 60px`,
                  gap: `${PAGE_GAP}px`,
                  userSelect: 'none',
                  transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                  transformOrigin: 'top center',
                }}
              >
              {/* Pages */}
              {mockPages.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                    flexShrink: 0,
                    boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
                    margin: '0 auto',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <PdfPage pageIndex={i} />
                </div>
              ))}

              {/* Highlight rectangles */}
              {annotations.map(anno => {
                const pageTop = getPageTop(anno.page)
                const isActive = activeAnnotation === anno.id
                const deptColor = DEPT_COLORS[anno.department ?? 'Legal'] ?? DEPT_COLORS.Legal
                const bgColor = hexToRgba(deptColor, 0.15)
                const activeBgColor = hexToRgba(deptColor, 0.35)
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
                      backgroundColor: isActive ? activeBgColor : bgColor,
                      border: isActive
                        ? `2px solid ${deptColor}`
                        : `1px dashed ${deptColor}`,
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
                  data-pending-highlight
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
          </div>

            {/* ── Annotation cards column (inside same scroll, only when 批注 tab is active) ── */}
            {activeTab === '批注' && (
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
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px 0', gap: '10px', borderBottom: '1px solid #E5E5E5' }}>
                  <div style={{ display: 'flex', padding: '2px', gap: '2px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                    <div
                      onClick={() => setActiveTab('批注')}
                      style={{
                        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '8px 0', borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        boxShadow: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#333', fontFamily: "'PingFang SC', sans-serif" }}>批注</span>
                    </div>
                    <div
                      onClick={() => setActiveTab('历史版本')}
                      style={{
                        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '8px 0', borderRadius: '6px',
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#666', fontFamily: "'PingFang SC', sans-serif" }}>历史版本</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {(['全部', 'AI', '人工', '本部门'] as const).map(tab => (
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
                </div>
              </div>

              {/* Annotation cards - absolutely positioned to align with highlights */}
              <div
                ref={cardsContainerRef}
                onClick={() => setActiveAnnotation('')}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  height: pdfColumnHeight > 0 ? pdfColumnHeight * zoom : undefined,
                  padding: '16px',
                }}
              >
                <>
                  {isAddingAnno && pendingSelection && (() => {
                    const addAnnoTop = resolvedCardTops['__addAnno__'] ?? Math.max(8,
                      (getPageTop(pendingSelection.page)
                      + (pendingSelection.startY + pendingSelection.endY) / 2
                      + COLUMN_PADDING_TOP) * zoom + PDF_TOOLBAR_HEIGHT - tabsHeight - 12
                      - (cardHeights['__addAnno__'] ?? ADD_ANNO_HEIGHT) / 2
                    )
                    return (
                      <div
                        data-card-id="__addAnno__"
                        ref={el => { annoCardRefs.current['__addAnno__'] = el }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()} style={{
                        position: 'absolute',
                        top: addAnnoTop,
                        left: 16,
                        right: 16,
                        zIndex: 10,
                      }}>
                        <InputBox
                          variant={addAnnoRiskExpanded ? 'risk-expanded' : 'risk-collapsed'}
                          riskLevels={RISK_LEVELS}
                          selectedRiskIndex={addAnnoRiskIndex}
                          onRiskSelect={(idx) => {
                            setAddAnnoRiskIndex(idx)
                            setAddAnnoRiskExpanded(false)
                          }}
                          onToggleRisk={() => setAddAnnoRiskExpanded(prev => !prev)}
                          onSubmit={handleAddAnnotation}
                          onCancel={handleCancelAdd}
                        />
                      </div>
                    )
                  })()}
                  {filteredAnnotations.map(anno => {
                    const cardTop = resolvedCardTops[anno.id] ?? Math.max(8,
                      (getPageTop(anno.page) + anno.rect.y + anno.rect.height / 2
                      + COLUMN_PADDING_TOP) * zoom + PDF_TOOLBAR_HEIGHT - tabsHeight - 12
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
                          left: 16,
                          right: 16,
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
                          risk={anno.risk}
                          interactive
                          readOnly={isReadOnly}
                          id={anno.id}
                          isActive={activeAnnotation === anno.id}
                          onActivate={handleActivateAnnotation}
                          onDelete={handleDeleteAnnotation}
                          onEdit={handleEditAnnotation}
                          onRiskChange={handleRiskChange}
                        />
                      </div>
                    )
                  })}
                </>
              </div>
            </div>
            )}

            {/* ─── SVG Dashed Lines Overlay (all visible annotations + pending add) ─── */}
            {(Object.keys(dashedLines).length > 0 || pendingDashedLine) && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: sharedScrollRef.current?.scrollWidth ?? '100%',
                  height: sharedScrollRef.current?.scrollHeight ?? '100%',
                  pointerEvents: 'none',
                  zIndex: 8,
                }}
              >
                {filteredAnnotations.map(anno => {
                  const line = dashedLines[anno.id]
                  if (!line) return null
                  const isActive = activeAnnotation === anno.id
                  const color = DEPT_COLORS[anno.department ?? 'Legal'] ?? DEPT_COLORS.Legal
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
                {/* Dashed line from pending selection to InputBox card */}
                {pendingDashedLine && (
                  <polyline
                    points={`${pendingDashedLine.x1},${pendingDashedLine.y1} ${pendingDashedLine.x2 - 80},${pendingDashedLine.y1} ${pendingDashedLine.x2},${pendingDashedLine.y2}`}
                    fill="none"
                    stroke="#2A6DE7"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.6}
                  />
                )}
              </svg>
            )}
          </div>

        {/* ── 历史版本面板 (独立于 sharedScrollRef，不跟随 PDF 滚动) ── */}
        {activeTab === '历史版本' && (
          <div
            style={{
              width: '397px',
              flexShrink: 0,
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid #E5E5E5',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px 0', gap: '10px' }}>
                <div style={{ display: 'flex', padding: '2px', gap: '2px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                  <div
                    onClick={() => setActiveTab('批注')}
                    style={{
                      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                      padding: '8px 0', borderRadius: '6px',
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#666', fontFamily: "'PingFang SC', sans-serif" }}>批注</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('历史版本')}
                    style={{
                      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                      padding: '8px 0', borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333', fontFamily: "'PingFang SC', sans-serif" }}>历史版本</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Version cards - 独立滚动区域 */}
            <div
              className="no-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <VersionCard variant="current" version="V3" department="Branding" userName="段威丞" time="2026-05-19 15:20" tagVariant="人工审核中" />
                <VersionCard variant="old" version="V2" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="待补充" />
                <VersionCard variant="old" version="V1" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="返回修改" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 创建人 + AI审核完成 Action Bar ── */}
      {docStatus === 'AI审核完成' && docSource === 'created' && pdfColumnCenterX !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: pdfColumnCenterX,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#FAFAFA',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#2A6DE7',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >提交审核</button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={() => { /* handle file upload */ }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              color: '#333333',
              border: '1px solid #CCCCCC',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >重新上传</button>
        </div>
      )}

      {/* ── 创建人 + 待补充 Action Bar ── */}
      {docStatus === '待补充' && docSource === 'created' && pdfColumnCenterX !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: pdfColumnCenterX,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#FAFAFA',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            zIndex: 100,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={() => { /* handle file upload */ }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#2A6DE7',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >上传资料</button>
        </div>
      )}

      {/* ── 创建人 + 退回修改 Action Bar ── */}
      {docStatus === '退回修改' && docSource === 'created' && pdfColumnCenterX !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: pdfColumnCenterX,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#FAFAFA',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            zIndex: 100,
          }}
        >
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={() => { /* handle file upload */ }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#2A6DE7',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >重新上传</button>
        </div>
      )}

      {/* ── 创建人 + AI审核失败 Action Bar ── */}
      {isAIReviewFailed && docSource === 'created' && pdfColumnCenterX !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: pdfColumnCenterX,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#FAFAFA',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            zIndex: 100,
          }}
        >
          {/* 重新上传 button: brand blue-60 filled */}
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={() => { /* handle file upload */ }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#2A6DE7',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >重新上传</button>
          {/* 删除资料 button: white bg, grey border */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 15px',
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              color: '#333333',
              border: '1px solid #CCCCCC',
              fontSize: 14,
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >删除资料</button>
        </div>
      )}

      {/* ── 人工审核 Action Bar (fixed anchor, centered with PDF column) ── */}
      {docStatus === '人工审核中' && !isReadOnly && !reviewResult && pdfColumnCenterX !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: pdfColumnCenterX,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#FAFAFA',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            zIndex: 100,
          }}
        >
          {(['审核通过', '返回修改', '待补充', '无需审核'] as const).map((action) => {
            const isPrimary = action === '审核通过'
            const isDanger = action === '返回修改'
            return (
              <button
                key={action}
                onClick={() => setPendingReviewAction(action)}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '4px 15px',
                  borderRadius: 4,
                  backgroundColor: isPrimary ? '#2A6DE7' : '#FFFFFF',
                  color: isPrimary ? '#FFFFFF' : isDanger ? '#FA4D56' : '#333333',
                  border: isPrimary ? 'none' : isDanger ? '1px solid #FFD7D9' : '1px solid #CCCCCC',
                  fontSize: 14,
                  fontFamily: "'PingFang SC', sans-serif",
                  fontWeight: 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >{action}</button>
            )
          })}
        </div>
      )}

      {/* ── 审核确认弹窗 ── */}
      <Modal
        visible={!!pendingReviewAction}
        onClose={() => setPendingReviewAction(null)}
        title={pendingReviewAction || ''}
        description={`是否确认资料DOC-2026-0518-001${pendingReviewAction || ''}？`}
        actions={[
          { label: '取消', variant: 'default', onClick: () => setPendingReviewAction(null) },
          { label: '确认', variant: 'primary', onClick: handleConfirmReview },
        ]}
      />

      {/* ── 提交审核 Modal (选择待审核人) ── */}
      <Modal
        variant="form"
        visible={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setOpenDropdown(null) }}
        title="选择待审核人"
        subtitle="请选择各部门的审核人，至少选择一个部门，每个部门只能选择一人。"
        actions={[
          { label: '取消', variant: 'default', onClick: () => { setShowSubmitModal(false); setOpenDropdown(null) } },
          {
            label: '确认提交', variant: 'primary',
            disabled: !Object.values(reviewerSelections).some(v => v),
            onClick: () => {
              if (!Object.values(reviewerSelections).some(v => v)) return
              setShowSubmitModal(false)
              setOpenDropdown(null)
            },
          },
        ]}
      >
        {departments.map(dept => (
          <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              fontSize: 14, color: '#000000',
              fontFamily: "'PingFang SC', sans-serif", fontWeight: 400,
            }}>{dept}</span>
            <div
              onClick={() => setOpenDropdown(openDropdown === dept ? null : dept)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px', border: '1px solid #E5E5E5', borderRadius: 8,
                cursor: 'pointer', position: 'relative',
              }}
            >
              <span style={{
                fontSize: 14,
                color: reviewerSelections[dept] ? '#333333' : '#BFBFBF',
                fontFamily: "'PingFang SC', sans-serif", fontWeight: 400,
              }}>{reviewerSelections[dept] || '请选择审核人'}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 11.2L3.6 6.8L4.53333 5.86667L8 9.33333L11.4667 5.86667L12.4 6.8L8 11.2Z" fill="#333333"/>
              </svg>
              {openDropdown === dept && (
                <div style={{
                  position: 'absolute', top: '100%', left: -1, right: -1,
                  backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
                  borderRadius: 8, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10, marginTop: 4,
                }}>
                  {mockReviewers.map(name => (
                    <div
                      key={name}
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewerSelections(prev => ({ ...prev, [dept]: name }))
                        setOpenDropdown(null)
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F5F5F5' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = reviewerSelections[dept] === name ? '#F0F5FF' : '#FFFFFF' }}
                      style={{
                        padding: '8px 12px', fontSize: 14, color: '#333333',
                        fontFamily: "'PingFang SC', sans-serif", cursor: 'pointer',
                        backgroundColor: reviewerSelections[dept] === name ? '#F0F5FF' : '#FFFFFF',
                      }}
                    >{name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </Modal>

      {/* ── 删除资料确认弹窗 ── */}
      <Modal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="删除资料"
        description="是否确认删除资料DOC-2026-0518-001？"
        actions={[
          { label: '取消', variant: 'default', onClick: () => setShowDeleteConfirm(false) },
          {
            label: '确认', variant: 'primary',
            onClick: () => { setShowDeleteConfirm(false); navigate('/workbench') },
          },
        ]}
      />

      {/* ── AI审核中 Overlay (不遮挡 TopBar，保留返回按钮可点击) ── */}
      {isAIReviewing && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '112px',
          }}>
            <DotLottieReact
              src="/lottie/AILoading.lottie"
              loop
              autoplay
              style={{ width: 40, height: 40 }}
            />
            <span style={{
              fontSize: '14px',
              color: '#333333',
              fontFamily: "'PingFang SC', sans-serif",
              fontWeight: 400,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>AI审核中,请稍后...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewDocument
