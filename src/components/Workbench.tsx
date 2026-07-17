import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Plus
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────
type TagVariant = 'AI审核中' | 'AI审核完成' | '人工审核中' | '审核通过' | '待补充' | '无需审核' | '退回修改' | 'AI审核失败'
type FileType = 'PDF' | 'Photo' | 'Word' | 'PPT'
type RowAction = 'icons' | 'audit-button' | 'audit-done'

interface TableRow {
  id: string
  title: string
  docId: string
  version: string
  uploader: string
  uploadTime: string
  tag: TagVariant
  fileType: FileType
  action: RowAction
}

// ─── Tag colors ────────────────────────────────────────────
const tagStyles: Record<TagVariant, { bg: string; color: string }> = {
  'AI审核中':   { bg: '#F4F8FF', color: '#2A6DE7' },
  'AI审核完成': { bg: '#FAFAFA', color: '#666666' },
  '人工审核中': { bg: '#F4F8FF', color: '#2A6DE7' },
  '审核通过':   { bg: '#F5FFF5', color: '#23A123' },
  '待补充':     { bg: '#FEF6DF', color: '#FFBB00' },
  '无需审核':   { bg: '#F5FFF5', color: '#23A123' },
  '退回修改':   { bg: '#FFF1F1', color: '#FA4D56' },
  'AI审核失败': { bg: '#FFF1F1', color: '#FA4D56' },
}

// ─── Mock data ─────────────────────────────────────────────
const mockRows: TableRow[] = [
  { id: '1',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: 'AI审核中',   fileType: 'PDF',   action: 'icons' },
  { id: '2',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: 'AI审核完成', fileType: 'Photo', action: 'icons' },
  { id: '3',  title: '这是一份word文档',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'Word',  action: 'icons' },
  { id: '4',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '待补充',     fileType: 'Photo', action: 'icons' },
  { id: '5',  title: '这是个PPT',           docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '审核通过',   fileType: 'PPT',   action: 'icons' },
  { id: '6',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '无需审核',   fileType: 'PDF',   action: 'icons' },
  { id: '7',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '退回修改',   fileType: 'PDF',   action: 'icons' },
  { id: '8',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'Photo', action: 'audit-button' },
  { id: '9',  title: '创新药临床试验报告',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '审核通过',   fileType: 'PDF',   action: 'audit-done' },
  { id: '10', title: '新型疫苗开发进展',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: 'AI审核失败', fileType: 'PDF',   action: 'icons' },
  { id: '11', title: '新型疫苗开发进展',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'PDF',   action: 'audit-button' },
  { id: '12', title: '新型疫苗开发进展',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'PDF',   action: 'audit-button' },
  { id: '13', title: '新型疫苗开发进展',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'PDF',   action: 'audit-button' },
]

// ─── Sidebar menu items ────────────────────────────────────
const sidebarMenus = [
  { label: '资料库管理', icon: '/icons/computer-line.svg', expanded: true },
  { label: '智能问答',   icon: '/icons/chat-poll-line.svg', expanded: true },
  { label: '智能内容创作', icon: '/icons/sparkling-2-line.svg', expanded: true },
  { label: '数据报表',   icon: '/icons/donut-chart-fill.svg', expanded: false },
  { label: '智能审核',   icon: '/icons/ReviewLine.svg', expanded: true,  active: true },
]

// ═══════════════════════════════════════════════════════════
const Workbench: React.FC = () => {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilterState] = useState(
    () => sessionStorage.getItem('wb_filter') || '全部'
  )
  const setSelectedFilter = (val: string) => {
    setSelectedFilterState(val)
    sessionStorage.setItem('wb_filter', val)
  }
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState<'single' | 'batch'>('single')
  const [rows, setRows] = useState<TableRow[]>(mockRows)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hoveredAction, setHoveredAction] = useState<{ rowId: string; action: string } | null>(null)

  const filterOptions = ['全部', '待我审核', '由我创建']

  // ── Filter rows by selected tab ──
  const filteredRows = rows.filter(row => {
    if (selectedFilter === '待我审核') return row.action === 'audit-button' || row.action === 'audit-done'
    if (selectedFilter === '由我创建') return row.action === 'icons'
    return true
  })

  const displayRows = filteredRows

  const allSelected = displayRows.length > 0 && displayRows.every(r => selectedIds.has(r.id))
  const someSelected = displayRows.some(r => selectedIds.has(r.id)) && !allSelected

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        displayRows.forEach(r => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        displayRows.forEach(r => next.add(r.id))
        return next
      })
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatchDelete = () => {
    setDeleteMode('batch')
    setDeleteConfirmOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
    setDeleteMode('single')
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteMode === 'batch') {
      setRows(prev => prev.filter(r => !selectedIds.has(r.id)))
      setSelectedIds(new Set())
    } else if (deleteTargetId) {
      setRows(prev => prev.filter(r => r.id !== deleteTargetId))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(deleteTargetId)
        return next
      })
    }
    setDeleteConfirmOpen(false)
    setDeleteTargetId(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setDeleteTargetId(null)
  }

  // ─── Tag component ───────────────────────────────────────
  const StatusTag: React.FC<{ variant: TagVariant }> = ({ variant }) => {
    const style = tagStyles[variant]
    return (
      <div style={{
        display: 'flex', padding: '2px 4px', justifyContent: 'center', alignItems: 'center',
        backgroundColor: style.bg, borderRadius: '2px', gap: variant === 'AI审核失败' ? '4px' : undefined,
      }}>
        {variant === 'AI审核失败' && (
          <img src="/icons/warning.svg" alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '12px', color: style.color, fontFamily: "'PingFang SC', sans-serif" }}>
          {variant}
        </span>
      </div>
    )
  }

  // ─── File icon ───────────────────────────────────────────
  const fileIconMap: Record<FileType, string> = {
    PDF: '/icons/PDF-icon.svg',
    Photo: '/icons/Photo-icon.svg',
    Word: '/icons/Word.svg',
    PPT: '/icons/PPT.svg',
  }
  const FileIcon: React.FC<{ type: FileType }> = ({ type }) => (
    <div style={{ width: '18px', height: '20px', flexShrink: 0 }}>
      <img
        src={fileIconMap[type]}
        alt={type}
        style={{ width: '18px', height: '20px' }}
      />
    </div>
  )

  // ─── Column widths (grid: 3fr 3fr 1fr 1fr 2fr 1.5fr 2fr) ──
  const gridCols = '0.25fr 3fr 2fr 1fr 1fr 2fr 1.5fr 2fr'

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>

      {/* ─── Top Navigation Bar ─── */}
      <div style={{
        display: 'flex', padding: '11px 24px', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#052477', flexShrink: 0,
      }}>
        {/* Left: Logo + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Logo placeholder */}
            <div style={{ width: 24, height: 24, backgroundColor: '#364E91', borderRadius: 4 }} />
            <span style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>内容中心</span>
            <div style={{ width: 1, height: 24, backgroundColor: '#364E91' }} />
          </div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>智能审核</span>
            <span style={{ fontSize: '14px', color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>/</span>
            <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>工作台</span>
          </div>
        </div>
        {/* Right: Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>太美数字营销事业部</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#A6DBFF' }} />
            <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>太美</span>
            <ChevronDown size={12} color="#A6DBFF" />
          </div>
        </div>
      </div>

      {/* ─── Body: Sidebar + Main ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─── Left Sidebar ─── */}
        <div style={{
          width: '160px', flexShrink: 0, backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E5E5',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '0 0 8px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sidebarMenus.map((menu) => (
              <div key={menu.label} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Menu header */}
                <div style={{
                  display: 'flex', padding: '12px', alignItems: 'center', gap: '8px',
                  cursor: 'pointer',
                }}>
                  <img src={menu.icon} alt={menu.label} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", flex: 1 }}>
                    {menu.label}
                  </span>
                  {menu.expanded && <ChevronDown size={14} color="#333" />}
                </div>
                {/* Sub-menu: 工作台 + 审核管理 (only for 智能审核) */}
                {menu.active && (
                  <>
                    <div style={{
                      display: 'flex', padding: '8px 36px', alignItems: 'center', gap: '8px',
                      backgroundColor: '#F4F8FF', borderRight: '1px solid #0049CD',
                      cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#0049CD', fontFamily: "'PingFang SC', sans-serif" }}>
                        工作台
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', padding: '8px 36px', alignItems: 'center', gap: '8px',
                      cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                        审核管理
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Folding Menu Icon */}
          <div style={{
            display: 'flex', padding: '4px 12px', alignItems: 'center', gap: '10px',
            borderTop: '1px solid #E5E5E5', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H14M2 8H10M2 12H14" stroke="#333333" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '24px 36px', gap: '16px',
          backgroundColor: '#FFFFFF', overflow: 'auto',
        }}>

          {/* ── Filter section ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignSelf: 'stretch' }}>
            {/* Filter inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'stretch' }}>
              {[
                { label: '资料编号', placeholder: '请填写资料编号', type: 'input' },
                { label: '标题',     placeholder: '请填写标题',     type: 'input' },
                { label: '上传者',   placeholder: '请选择上传者',   type: 'select' },
                { label: '状态',     placeholder: '请选择状态',     type: 'select' },
              ].map((field) => (
                <div key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, width: '100%', padding: '8px 0' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", whiteSpace: 'nowrap' }}>
                    {field.label}
                  </span>
                  <div style={{
                    display: 'flex', padding: '8px 8px 8px 12px', alignItems: 'center',
                    border: '1px solid #E5E5E5', borderRadius: '4px',
                    backgroundColor: '#FFFFFF', minWidth: field.type === 'input' ? '200px' : '160px',
                    justifyContent: 'space-between', width: '100%',
                  }}>
                    <span style={{ fontSize: '14px', color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>
                      {field.placeholder}
                    </span>
                    {field.type === 'select' && <ChevronDown size={14} color="#BFBFBF" />}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Action row ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: plain text tabs (no filter icon) */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {filterOptions.map((option, idx) => (
                <div
                  key={option}
                  style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '2px 10px 2px 0px',
                    paddingLeft: idx === 0 ? 0 : 10,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedFilter(option)}
                >
                  <span style={{
                    fontSize: '14px', fontWeight: 400,
                    color: option === selectedFilter ? '#2A6DE7' : '#333333',
                    fontFamily: "'PingFang SC', sans-serif",
                  }}>{option}</span>
                </div>
              ))}
            </div>
            {/* Right: buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button style={{
                padding: '4px 15px', border: '1px solid #CCCCCC', borderRadius: '4px',
                backgroundColor: '#FFFFFF', cursor: 'pointer',
                fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif",
              }}>重置</button>
              <button style={{
                padding: '4px 15px', border: 'none', borderRadius: '4px',
                backgroundColor: '#2A6DE7', cursor: 'pointer',
                fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif",
              }}>查询</button>
            </div>
          </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: '1px', backgroundColor: '#E5E5E5' }} />

          {/* ── List area (non-scroll wrapper) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0 }}>

            {/* Upload button + Batch delete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={selectedIds.size > 0 ? handleBatchDelete : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: 'transparent', border: 'none', cursor: selectedIds.size > 0 ? 'pointer' : 'default',
                  padding: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.3334 4.00004H14.6667V5.33337H13.3334V14C13.3334 14.3682 13.0349 14.6667 12.6667 14.6667H3.33337C2.96519 14.6667 2.66671 14.3682 2.66671 14V5.33337H1.33337V4.00004H4.66671V2.00004C4.66671 1.63185 4.96519 1.33337 5.33337 1.33337H10.6667C11.0349 1.33337 11.3334 1.63185 11.3334 2.00004V4.00004ZM12 5.33337H4.00004V13.3334H12V5.33337ZM6.00004 2.66671V4.00004H10V2.66671H6.00004Z" fill={selectedIds.size > 0 ? '#333333' : '#BFBFBF'} />
                </svg>
                <span style={{
                  fontSize: '14px', fontWeight: 400,
                  color: selectedIds.size > 0 ? '#333333' : '#BFBFBF',
                  fontFamily: "'PingFang SC', sans-serif",
                }}>
                  删除{selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </span>
              </button>
              <button style={{
                display: 'flex', padding: '4px 15px', justifyContent: 'center', alignItems: 'center', gap: '2px',
                backgroundColor: '#2A6DE7', border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>
                <Plus size={16} color="#FFFFFF" />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>上传资料</span>
              </button>
            </div>

            {/* Table */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Header (fixed, not scrollable) */}
              <div style={{
                display: 'grid', gridTemplateColumns: gridCols, gap: '20px',
                padding: '12px 0px 12px 8px', backgroundColor: '#FAFAFA',
                borderBottom: '1px solid #E5E5E5', flexShrink: 0,
              }}>
                {/* Select all checkbox */}
                <div
                  onClick={toggleSelectAll}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 16, height: 16, border: '1px solid #CCCCCC', borderRadius: 2,
                    backgroundColor: allSelected ? '#2A6DE7' : someSelected ? '#2A6DE7' : '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderColor: (allSelected || someSelected) ? '#2A6DE7' : '#CCCCCC',
                    cursor: 'pointer',
                  }}>
                    {allSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {someSelected && !allSelected && (
                      <div style={{ width: 8, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
                    )}
                  </div>
                </div>
                {['资料标题', '项目编号', '版本', '上传者', '上传时间', '项目状态', '操作'].map((h, i) => (
                  <span key={h} style={{
                    fontSize: '14px', fontWeight: i === 2 || i === 5 ? 600 : 600,
                    color: '#333333', fontFamily: "'PingFang SC', sans-serif",
                    textAlign: 'left',
                  }}>{h}</span>
                ))}
              </div>

              {/* Scrollable rows area — overlay scrollbar */}
              <div
                className="wb-rows-scroll"
                style={{
                  flex: 1, minHeight: 0,
                  overflowY: 'auto',
                }}
              >
              {displayRows.map((row) => (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: gridCols, gap: '20px',
                  padding: '8px 0px 8px 8px', backgroundColor: selectedIds.has(row.id) ? '#F4F8FF' : '#FFFFFF',
                  borderBottom: '1px solid #E5E5E5',
                  alignItems: 'center', height: '44px',
                }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleSelect(row.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 16, height: 16, border: '1px solid #CCCCCC', borderRadius: 2,
                      backgroundColor: selectedIds.has(row.id) ? '#2A6DE7' : '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderColor: selectedIds.has(row.id) ? '#2A6DE7' : '#CCCCCC',
                      cursor: 'pointer',
                    }}>
                      {selectedIds.has(row.id) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {/* Title + file icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileIcon type={row.fileType} />
                    <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                      {row.title}
                    </span>
                  </div>
                  {/* Doc ID */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif", display: 'flex', alignItems: 'center', height: '100%' }}>
                    {row.docId}
                  </span>
                  {/* Version */}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", display: 'flex', alignItems: 'center', height: '100%' }}>
                    {row.version}
                  </span>
                  {/* Uploader */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif", display: 'flex', alignItems: 'center', height: '100%' }}>
                    {row.uploader}
                  </span>
                  {/* Upload time */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif", display: 'flex', alignItems: 'center', height: '100%' }}>
                    {row.uploadTime}
                  </span>
                  {/* Status tag */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'stretch' }}>
                    <StatusTag variant={row.tag} />
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', alignSelf: 'stretch' }}>
                    {row.action === 'icons' ? (
                      <>
                        <div
                          style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => navigate(`/document?status=${encodeURIComponent(row.tag)}&source=created`)}
                          onMouseEnter={() => setHoveredAction({ rowId: row.id, action: 'view' })}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <img src="/icons/EyeLine.svg" alt="view" style={{ width: 16, height: 16 }} />
                          {hoveredAction?.rowId === row.id && hoveredAction?.action === 'view' && (
                            <div style={{
                              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                              marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                              pointerEvents: 'none', zIndex: 10,
                            }}>
                              <div style={{
                                padding: '4px 8px', backgroundColor: 'rgba(51, 51, 51, 0.9)',
                                whiteSpace: 'nowrap',
                              }}>
                                <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>查看</span>
                              </div>
                              <img src="/icons/tooltip-arrow.svg" alt="" style={{ width: 10, height: 8 }} />
                            </div>
                          )}
                        </div>
                        <div
                          style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => handleDeleteClick(row.id)}
                          onMouseEnter={() => setHoveredAction({ rowId: row.id, action: 'delete' })}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <img src="/icons/delete-bin-7-line.svg" alt="delete" style={{ width: 16, height: 16 }} />
                          {hoveredAction?.rowId === row.id && hoveredAction?.action === 'delete' && (
                            <div style={{
                              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                              marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                              pointerEvents: 'none', zIndex: 10,
                            }}>
                              <div style={{
                                padding: '4px 8px', backgroundColor: 'rgba(51, 51, 51, 0.9)',
                                whiteSpace: 'nowrap',
                              }}>
                                <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>删除</span>
                              </div>
                              <img src="/icons/tooltip-arrow.svg" alt="" style={{ width: 10, height: 8 }} />
                            </div>
                          )}
                        </div>
                      </>
                    ) : row.action === 'audit-done' ? (
                      <button style={{
                        padding: '4px 15px', backgroundColor: '#FFFFFF',
                        border: '1px solid #CCCCCC', borderRadius: '4px', cursor: 'pointer',
                      }}
                        onClick={() => navigate(`/document?status=${encodeURIComponent(row.tag)}&source=review`)}
                      >
                        <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>查看</span>
                      </button>
                    ) : (
                      <button style={{
                        padding: '4px 15px', backgroundColor: '#2A6DE7',
                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                      }}
                        onClick={() => navigate(`/document?status=${encodeURIComponent(row.tag)}&source=review`)}
                      >
                        <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>审核</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* ── Pagination ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: '#000000', fontFamily: "'PingFang SC', sans-serif" }}>第1-20条/总共27条</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <ChevronLeft size={16} color="#333" />
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: 20, height: 20, backgroundColor: '#2A6DE7', borderRadius: 4,
                }}>
                  <span style={{ fontSize: '12px', color: '#FFFFFF' }}>1</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: 20, height: 20, borderRadius: 4,
                }}>
                  <span style={{ fontSize: '12px', color: '#333333' }}>2</span>
                </div>
                <ChevronRight size={16} color="#333" />
              </div>
              <div style={{
                display: 'flex', padding: '0 4px', alignItems: 'center', gap: '5px',
                border: '1px solid #E5E5E5', borderRadius: '2px', height: '20px',
              }}>
                <span style={{ fontSize: '12px', color: '#333333' }}>20条/页</span>
                <ChevronDown size={10} color="#333" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: '#333333' }}>跳转至</span>
                <div style={{ width: 24, height: 20, border: '1px solid #E5E5E5', borderRadius: 2 }} />
                <span style={{ fontSize: '12px', color: '#333333' }}>页</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '8px',
            padding: '24px', width: '400px',
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                fontSize: '16px', fontWeight: 600, color: '#333333',
                fontFamily: "'PingFang SC', sans-serif",
              }}>确认删除</span>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '14px', color: '#666666',
                fontFamily: "'PingFang SC', sans-serif",
              }}>{ deleteMode === 'batch' ? `确定要删除这${selectedIds.size}条资料吗？此操作不可撤销。` : '确定要删除这条资料吗？此操作不可撤销。'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{
                  padding: '8px 20px', border: '1px solid #CCCCCC', borderRadius: '4px',
                  backgroundColor: '#FFFFFF', cursor: 'pointer',
                  fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif",
                }}
                onClick={handleCancelDelete}
              >
                取消
              </button>
              <button
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: '4px',
                  backgroundColor: '#FA4D56', cursor: 'pointer',
                  fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif",
                }}
                onClick={handleConfirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workbench
