import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Plus
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────
type TagVariant = 'AI审核中' | 'AI审核完成' | '人工审核中' | '审核通过' | '待补充' | '无需审核' | '返回修改'
type FileType = 'PDF' | 'Photo'
type RowAction = 'icons' | 'audit-button'

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
  'AI审核完成': { bg: '#4382F8', color: '#FFFFFF' },
  '人工审核中': { bg: '#F4F8FF', color: '#2A6DE7' },
  '审核通过':   { bg: '#F5FFF5', color: '#23A123' },
  '待补充':     { bg: '#FEF6DF', color: '#D69D00' },
  '无需审核':   { bg: '#F5FFF5', color: '#23A123' },
  '返回修改':   { bg: '#FFF1F1', color: '#FA4D56' },
}

// ─── Mock data ─────────────────────────────────────────────
const mockRows: TableRow[] = [
  { id: '1',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: 'AI审核中',   fileType: 'PDF',   action: 'icons' },
  { id: '2',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: 'AI审核完成', fileType: 'Photo', action: 'icons' },
  { id: '3',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'Photo', action: 'icons' },
  { id: '4',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '审核通过',   fileType: 'PDF',   action: 'icons' },
  { id: '5',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '待补充',     fileType: 'Photo', action: 'icons' },
  { id: '6',  title: '创新药人体功能利用度', docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '无需审核',   fileType: 'PDF',   action: 'icons' },
  { id: '7',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '返回修改',   fileType: 'Photo', action: 'icons' },
  { id: '8',  title: '心血管健康科普长图',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'Photo', action: 'audit-button' },
  { id: '9',  title: '创新药临床试验报告',   docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'PDF',   action: 'audit-button' },
  { id: '10', title: '新型疫苗开发进展',     docId: 'DOC-2026-0601-042', version: 'V1', uploader: '段威丞', uploadTime: '2026-05-10 10:00', tag: '人工审核中', fileType: 'PDF',   action: 'audit-button' },
]

// ─── Sidebar menu items ────────────────────────────────────
const sidebarMenus = [
  { label: '资料库管理', icon: '💾', expanded: false },
  { label: '智能问答',   icon: '💬', expanded: false },
  { label: '智能内容创作', icon: '✨', expanded: false },
  { label: '数据报表',   icon: '📊', expanded: false },
  { label: '智能审核',   icon: '✅', expanded: true,  active: true },
]

// ═══════════════════════════════════════════════════════════
const Workbench: React.FC = () => {
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('全部')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const filterOptions = ['全部', '由我审核', '由我创建']

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    // TODO: 实际删除逻辑
    console.log('删除资料:', deleteTargetId)
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
        display: 'flex', padding: '4px 8px', justifyContent: 'center', alignItems: 'center',
        backgroundColor: style.bg, borderRadius: '4px',
      }}>
        <span style={{ fontSize: '12px', color: style.color, fontFamily: "'PingFang SC', sans-serif" }}>
          {variant}
        </span>
      </div>
    )
  }

  // ─── File icon ───────────────────────────────────────────
  const FileIcon: React.FC<{ type: FileType }> = ({ type }) => (
    <div style={{ width: '18px', height: '20px', flexShrink: 0 }}>
      <img
        src={type === 'PDF' ? '/icons/PDF-icon.svg' : '/icons/Photo-icon.svg'}
        alt={type}
        style={{ width: '18px', height: '20px' }}
      />
    </div>
  )

  // ─── Column widths (grid: 3fr 3fr 1fr 1fr 2fr 1.5fr 2fr) ──
  const gridCols = '3fr 3fr 1fr 1fr 2fr 1.5fr 2fr'

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
          padding: '0 0 12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sidebarMenus.map((menu) => (
              <div key={menu.label} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Menu header */}
                <div style={{
                  display: 'flex', padding: '12px', alignItems: 'center', gap: '8px',
                  cursor: 'pointer',
                }}>
                  <span style={{ fontSize: '16px' }}>{menu.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", flex: 1 }}>
                    {menu.label}
                  </span>
                  {menu.expanded && <ChevronDown size={14} color="#333" />}
                </div>
                {/* Sub-menu: 工作台 (only for 智能审核) */}
                {menu.active && (
                  <div style={{
                    display: 'flex', padding: '8px 36px', alignItems: 'center', gap: '8px',
                    backgroundColor: '#F4F8FF', borderRight: '1px solid #0049CD',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0049CD', fontFamily: "'PingFang SC', sans-serif" }}>
                      工作台
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '24px 36px', gap: '16px',
          backgroundColor: '#FFFFFF', overflow: 'auto',
        }}>

          {/* ── Filter form ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0', width: '100%' }}>
            {[
              { label: '资料编号', placeholder: '请填写资料编号', type: 'input' },
              { label: '标题',     placeholder: '请填写标题',     type: 'input' },
              { label: '上传者',   placeholder: '请选择上传者',   type: 'select' },
              { label: '状态',     placeholder: '请选择状态',     type: 'select' },
            ].map((field) => (
              <div key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, width: '100%', padding: '8px' }}>
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
            {/* Left: filter link with dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <img src="/icons/filter-line.svg" alt="filter" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#2A6DE7', fontFamily: "'PingFang SC', sans-serif" }}>{selectedFilter}</span>
              </div>
              {filterOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  backgroundColor: '#FFFFFF', borderRadius: '4px',
                  boxShadow: '0px 1px 5.2px 0px rgba(0, 0, 0, 0.15)',
                  zIndex: 100, overflow: 'hidden',
                  width: 'fit-content',
                }}>
                  {filterOptions.map((option) => (
                    <div
                      key={option}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '0 8px',
                        height: '32px', cursor: 'pointer', width: '72px',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (option !== selectedFilter) {
                          e.currentTarget.style.backgroundColor = '#F0F0F0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      onClick={() => {
                        setSelectedFilter(option)
                        setFilterOpen(false)
                      }}
                    >
                      <span style={{
                        fontSize: '14px', fontWeight: 400,
                        color: option === selectedFilter ? '#2A6DE7' : '#333333',
                        fontFamily: "'PingFang SC', sans-serif",
                      }}>{option}</span>
                    </div>
                  ))}
                </div>
              )}
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

          {/* ── Divider ── */}
          <div style={{ height: '1px', backgroundColor: '#E5E5E5' }} />

          {/* ── List area ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

            {/* Upload button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{
                display: 'flex', padding: '4px 15px', justifyContent: 'center', alignItems: 'center', gap: '2px',
                backgroundColor: '#2A6DE7', border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>
                <Plus size={16} color="#FFFFFF" />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>上传资料</span>
              </button>
            </div>

            {/* Table */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: gridCols, gap: '20px',
                padding: '12px', backgroundColor: '#FAFAFA',
                borderBottom: '1px solid #E5E5E5',
              }}>
                {['资料标题', '项目编号', '版本', '上传者', '上传时间', '项目状态', '操作'].map((h, i) => (
                  <span key={h} style={{
                    fontSize: '14px', fontWeight: i === 2 || i === 5 ? 600 : 600,
                    color: '#333333', fontFamily: "'PingFang SC', sans-serif",
                    textAlign: i === 2 || i === 4 || i === 6 ? 'center' : 'left',
                  }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {mockRows.map((row) => (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: gridCols, gap: '20px',
                  padding: '13px 12px', backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #E5E5E5',
                  alignItems: 'center', minHeight: '57px',
                }}>
                  {/* Title + file icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileIcon type={row.fileType} />
                    <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                      {row.title}
                    </span>
                  </div>
                  {/* Doc ID */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                    {row.docId}
                  </span>
                  {/* Version */}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", textAlign: 'center' }}>
                    {row.version}
                  </span>
                  {/* Uploader */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>
                    {row.uploader}
                  </span>
                  {/* Upload time */}
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif", textAlign: 'center' }}>
                    {row.uploadTime}
                  </span>
                  {/* Status tag */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <StatusTag variant={row.tag} />
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {row.action === 'icons' ? (
                      <>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => navigate('/document')}
                        >
                          <img src="/icons/EyeLine.svg" alt="view" style={{ width: 16, height: 16 }} />
                        </div>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => handleDeleteClick(row.id)}
                        >
                          <img src="/icons/delete-bin-7-line.svg" alt="delete" style={{ width: 16, height: 16 }} />
                        </div>
                      </>
                    ) : (
                      <button style={{
                        padding: '4px 15px', backgroundColor: '#2A6DE7',
                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                      }}
                        onClick={() => navigate('/document')}
                      >
                        <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>审核</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
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
              }}>确定要删除这条资料吗？此操作不可撤销。</span>
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
