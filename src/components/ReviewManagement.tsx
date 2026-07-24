import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────
interface TagRow {
  id: string
  name: string
  displayName: string
  dataType: '多选' | '单选'
  values: string[]
}

const mockTags: TagRow[] = [
  { id: '1', name: '产品介绍', displayName: '产品介绍', dataType: '多选', values: ['来曲唑', '阿霉素', '曲妥珠单抗', '康奈克'] },
  { id: '2', name: '疾病领域', displayName: '疾病领域', dataType: '多选', values: ['肿瘤', '慢病', '神经'] },
  { id: '3', name: '客户性质', displayName: '客户性质', dataType: '多选', values: ['好', '中', '差'] },
  { id: '4', name: '测试', displayName: '测试001', dataType: '单选', values: ['1212', '1211'] },
  { id: '5', name: '你好', displayName: '你好', dataType: '单选', values: [] },
  { id: '6', name: '销售类型', displayName: '销售类型', dataType: '单选', values: ['调拨', '纯销'] },
]

// ─── AI Config Mock Data ──────────────────────────────────
interface DepartmentCard {
  id: string
  name: string
  reviewers: number
  standards: number
  enabled: boolean
}

const mockDepartments: DepartmentCard[] = [
  { id: 'ma', name: 'MA', reviewers: 1, standards: 4, enabled: true },
  { id: 'ra', name: 'RA', reviewers: 1, standards: 3, enabled: false },
  { id: 'legal', name: 'Legal', reviewers: 1, standards: 2, enabled: false },
  { id: 'branding', name: 'Branding', reviewers: 1, standards: 2, enabled: true },
]

const mockReviewers = ['李医学', '王药学', '张临床', '赵法规', '陈品牌', '刘审核', '周质量', '吴研发', '郑市场', '孙合规', '钱医学', '李药学']

const allAvailableReviewers = [
  '李医学', '王药学', '张临床', '赵法规', '陈品牌', '刘审核',
  '周质量', '吴研发', '郑市场', '孙合规', '钱医学', '李药学',
  '黄注册', '林合规', '杨药学', '许临床', '何审批', '罗质控',
]

interface StandardRow {
  id: string
  category: string
  standardCount: number
  criteria: string[]
  riskLevel: '高风险' | '中风险' | '低风险'
  enabled: boolean
}

const mockStandards: StandardRow[] = [
  {
    id: '1', category: '适应症准确性', standardCount: 3,
    criteria: ['1. 适应症与NMPA批准范围严格一致', '2. 识别并标记超范围适应症表述', '3. 适应症措辞与说明书核对'],
    riskLevel: '高风险', enabled: true,
  },
  {
    id: '2', category: '疗效数据核实', standardCount: 3,
    criteria: ['1.  临床证据充分性验证', '2. 文献引用规范性及来源标注', '3. 数据结论与原文一致性核查'],
    riskLevel: '高风险', enabled: true,
  },
  {
    id: '3', category: '不良反应披露', standardCount: 3,
    criteria: ['1. 说明书中不良反应完整披露', '2. 常见不良反应准确表述', '3. 严重不良反应重点标注'],
    riskLevel: '中风险', enabled: true,
  },
  {
    id: '4', category: '用药规范性', standardCount: 3,
    criteria: ['1. 用法用量与说明书严格一致', '2. 医学术语使用规范', '3. 用药禁忌及注意事项准确标注'],
    riskLevel: '低风险', enabled: true,
  },
]

// ─── Toggle Component ─────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange?: () => void }> = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
      backgroundColor: checked ? '#2A6DE7' : '#BFBFBF',
      display: 'flex', alignItems: 'center',
      padding: checked ? '0 2px 0 18px' : '0 18px 0 2px',
      transition: 'all 0.2s',
    }}
  >
    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
  </div>
)

// ─── Risk Tag Component ───────────────────────────────────
const RiskTag: React.FC<{ level: '高风险' | '中风险' | '低风险' }> = ({ level }) => {
  const config = {
    '高风险': { bg: '#FFF1F1', color: '#FA4D56', icon: '/icons/alert-fill.svg' },
    '中风险': { bg: '#FEF6DF', color: '#D69D00', icon: '/icons/alert-line.svg' },
    '低风险': { bg: '#F4F8FF', color: '#4382F8', icon: '/icons/capsule-line.svg' },
  }
  const c = config[level]
  return (
    <div style={{
      display: 'flex', padding: '2px 4px', alignItems: 'center', gap: 4,
      backgroundColor: c.bg, borderRadius: 4,
    }}>
      <img src={c.icon} alt={level} style={{ width: 12, height: 12 }} />
      <span style={{ fontSize: 12, color: c.color, fontFamily: "'PingFang SC', sans-serif" }}>{level}</span>
    </div>
  )
}

// ─── Sidebar Menus ───────────────────────────────────────
const sidebarMenus = [
  { label: '资料库管理', icon: '/icons/computer-line.svg', expanded: true },
  { label: '智能问答', icon: '/icons/chat-poll-line.svg', expanded: true },
  { label: '智能内容创作', icon: '/icons/sparkling-2-line.svg', expanded: true },
  { label: '数据报表', icon: '/icons/donut-chart-fill.svg', expanded: false },
  { label: '智能审核', icon: '/icons/ReviewLine.svg', active: true, expanded: true },
]

// ─── Tooltip Component ────────────────────────────────────
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
      <div style={{ padding: '4px 8px', backgroundColor: 'rgba(51, 51, 51, 0.9)', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif", fontWeight: 400 }}>
          {label}
        </span>
      </div>
      <img src="/icons/tooltip-arrow.svg" alt="" style={{ width: 10, height: 8 }} />
    </div>,
    document.body
  )

// ─── AI Config Panel ──────────────────────────────────────
const AIConfigPanel: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState('ma')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [standards, setStandards] = useState(mockStandards)
  const [reviewers, setReviewers] = useState(mockReviewers)
  const [hoveredAction, setHoveredAction] = useState<{ key: string; rowId: string; rect: { left: number; top: number; width: number } } | null>(null)
  const [hoveredBadge, setHoveredBadge] = useState<{ index: number; rect: { left: number; top: number; width: number } } | null>(null)

  // Modal state
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [deptName, setDeptName] = useState('')
  const [showStandardModal, setShowStandardModal] = useState(false)
  const [standardCategory, setStandardCategory] = useState('')
  const [standardRisk, setStandardRisk] = useState<'高风险' | '中风险' | '低风险' | null>(null)
  const [standardItems, setStandardItems] = useState<string[]>([''])

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const selectBtnRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const toggleReviewer = (name: string) => {
    setReviewers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const removeReviewer = (index: number) => {
    setReviewers(prev => prev.filter((_, i) => i !== index))
  }

  const toggleStandard = (id: string) => {
    setStandards(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const filteredReviewers = allAvailableReviewers.filter(name =>
    name.includes(searchText)
  )

  const openDropdown = () => {
    if (selectBtnRef.current) {
      const r = selectBtnRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setDropdownOpen(true)
    setSearchText('')
  }

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (selectBtnRef.current && selectBtnRef.current.contains(e.target as Node)) return
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return
      setDropdownOpen(false)
      setSearchText('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left department sidebar */}
      <div style={{
        width: 150, flexShrink: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '16px 0',
        borderRight: '1px solid #E5E5E5',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 1px 0 0' }}>
          {mockDepartments.map(dept => {
            const isSelected = selectedDept === dept.id
            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                style={{
                  display: 'flex', padding: '4px 16px', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer',
                  backgroundColor: isSelected ? '#F4F8FF' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: 14, fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#2A6DE7' : '#333333',
                    fontFamily: "'PingFang SC', sans-serif",
                    lineHeight: '20px', letterSpacing: '-0.0107em',
                  }}>{dept.name}</span>
                  <span style={{
                    fontSize: 10, color: isSelected ? '#2A6DE7' : '#666666',
                    lineHeight: '20px', letterSpacing: '-0.015em',
                    fontFamily: "'PingFang SC', sans-serif",
                  }}>{dept.reviewers}名审核员·{dept.standards}条标准</span>
                </div>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: isSelected
                    ? (dept.enabled && aiEnabled ? '#3EC23E' : '#999999')
                    : (dept.enabled ? '#3EC23E' : '#999999'),
                }} />
              </div>
            )
          })}
        </div>
        <div
          onClick={() => { setDeptName(''); setShowDeptModal(true) }}
          style={{
          display: 'flex', padding: '0 8px', justifyContent: 'center',
          alignItems: 'center', gap: 2, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5v9M2.5 7h9" stroke="#2A6DE7" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 14, color: '#2A6DE7', fontFamily: "'PingFang SC', sans-serif" }}>新增部门规则</span>
        </div>
      </div>

      {/* Right content area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: 16, gap: 16, overflow: 'auto', backgroundColor: '#FFFFFF',
      }}>
        {/* Title bar with toggle */}
        <div style={{
          display: 'flex', padding: '13px 16px', justifyContent: 'space-between',
          alignItems: 'center', backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5', borderRadius: 4,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 600, color: '#333333', lineHeight: '20px',
            letterSpacing: '-0.0094em', fontFamily: "'PingFang SC', sans-serif",
          }}>MA-审核配置</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 14, color: '#000000', lineHeight: '20px',
              letterSpacing: '-0.0107em', fontFamily: "'PingFang SC', sans-serif",
            }}>启用AI审核</span>
            <Toggle checked={aiEnabled} onChange={() => setAiEnabled(!aiEnabled)} />
          </div>
        </div>

        {/* Reviewers card */}
        <div style={{
          display: 'flex', flexDirection: 'column', padding: '12px 16px',
          gap: 16, backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5', borderRadius: 4,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontSize: 16, fontWeight: 600, color: '#333333',
                fontFamily: "'PingFang SC', sans-serif",
              }}>审核人员</span>
              <span style={{
                fontSize: 14, color: '#999999',
                fontFamily: "'PingFang SC', sans-serif",
              }}>选择参与此部门规则的审核人员</span>
            </div>
            <div
              ref={selectBtnRef}
              style={{
                display: 'inline-flex', padding: dropdownOpen ? 2 : 0,
                borderRadius: 6,
                backgroundColor: dropdownOpen ? '#DCE9FF' : 'transparent',
              }}
            >
              <div style={{
                display: 'flex', padding: '8px 12px', alignItems: 'center', gap: 12,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${dropdownOpen ? '#2A6DE7' : '#E5E5E5'}`,
                borderRadius: 4, minWidth: 160,
              }}>
                <input
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); if (!dropdownOpen) openDropdown() }}
                  onFocus={openDropdown}
                  placeholder="选择审核人员"
                  style={{
                    border: 'none', outline: 'none', flex: 1,
                    fontSize: 14, color: '#333333',
                    fontFamily: "'PingFang SC', sans-serif",
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <ChevronDown size={16} color="#333" onClick={openDropdown} style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s', flexShrink: 0, cursor: 'pointer',
                }} />
              </div>
            </div>
            {dropdownOpen && createPortal(
              <div ref={dropdownRef} style={{
                position: 'fixed',
                top: dropdownPos.top,
                right: dropdownPos.right,
                width: 240,
                padding: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
                zIndex: 9999,
              }}>
                {/* Scrollable list - max 8 items */}
                <div style={{
                  maxHeight: 8 * 32, overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#BFBFBF transparent',
                }}>
                  {filteredReviewers.map(name => {
                    const isSelected = reviewers.includes(name)
                    const isHovered = hoveredItem === name
                    let bg = 'transparent'
                    if (isSelected && isHovered) bg = '#B4CFFF'
                    else if (isSelected) bg = '#DCE9FF'
                    else if (isHovered) bg = '#F5F5F5'
                    return (
                      <div
                        key={name}
                        onMouseEnter={() => setHoveredItem(name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={(e) => { e.stopPropagation(); toggleReviewer(name) }}
                        style={{
                          display: 'flex', padding: '4px 8px', alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: 2, cursor: 'pointer',
                          backgroundColor: bg,
                        }}
                      >
                        <span style={{
                          fontSize: 14, color: '#333333',
                          fontFamily: "'PingFang SC', sans-serif",
                        }}>{name}</span>
                        {isSelected && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#2A6DE7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 12px',
          }}>
            {reviewers.map((name, i) => (
              <div key={i} style={{
                display: 'flex', padding: '2px 4px', alignItems: 'center', gap: 4,
                backgroundColor: '#F4F8FF', borderRadius: 4,
              }}>
                <span style={{
                  fontSize: 14, color: '#2A6DE7',
                  fontFamily: "'PingFang SC', sans-serif",
                }}>{name}</span>
                <div
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    setHoveredBadge({ index: i, rect: { left: r.left, top: r.top, width: r.width } })
                  }}
                  onMouseLeave={() => setHoveredBadge(null)}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: 2, cursor: 'pointer', backgroundColor: hoveredBadge?.index === i ? '#F5F5F5' : 'transparent' }}
                >
                  {hoveredBadge?.index === i && <Tooltip label="删除" rect={hoveredBadge.rect} />}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" onClick={() => removeReviewer(i)}>
                    <path d="M3 3l6 6M9 3l-6 6" stroke="#2A6DE7" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standards card */}
        <div style={{
          display: 'flex', flexDirection: 'column', padding: '12px 16px',
          gap: 12, backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5', borderRadius: 4,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontSize: 16, fontWeight: 600, color: '#333333',
                fontFamily: "'PingFang SC', sans-serif",
              }}>审核标准</span>
              <span style={{
                fontSize: 14, color: '#999999',
                fontFamily: "'PingFang SC', sans-serif",
              }}>设置各类别的审核要点与风险等级</span>
            </div>
            <button onClick={() => { setStandardCategory(''); setStandardRisk(null); setStandardItems(['']); setShowStandardModal(true) }} style={{
              display: 'flex', padding: '4px 15px', justifyContent: 'center',
              alignItems: 'center', gap: 2,
              backgroundColor: '#2A6DE7', border: 'none', borderRadius: 4,
              cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2.5v9M2.5 7h9" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{
                fontSize: 14, color: '#FFFFFF',
                fontFamily: "'PingFang SC', sans-serif",
              }}>新增审核标准</span>
            </button>
          </div>

          {/* Table header */}
          <div style={{
            display: 'flex', padding: '12px 16px', alignItems: 'center', gap: 12,
            backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB',
          }}>
            <div style={{ width: 180 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', fontFamily: "'PingFang SC', sans-serif" }}>审核类别</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', fontFamily: "'PingFang SC', sans-serif" }}>审核标准</span>
            </div>
            <div style={{ width: 120 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', fontFamily: "'PingFang SC', sans-serif" }}>风险等级</span>
            </div>
            <div style={{ width: 144 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', fontFamily: "'PingFang SC', sans-serif" }}>操作</span>
            </div>
          </div>

          {/* Table rows */}
          {standards.map(row => (
            <div key={row.id} style={{
              display: 'flex', padding: '16px', alignItems: 'center', gap: 12,
              borderBottom: '1px solid #E5E7EB',
            }}>
              {/* Category column */}
              <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{
                  fontSize: 14, fontWeight: 600, color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif",
                }}>{row.category}</span>
                <div style={{
                  display: 'flex', padding: '2px 4px', alignItems: 'center', gap: 4,
                  backgroundColor: '#F4F8FF', borderRadius: 4, alignSelf: 'flex-start',
                }}>
                  <span style={{
                    fontSize: 12, color: '#2A6DE7',
                    fontFamily: "'PingFang SC', sans-serif",
                  }}>{row.standardCount}条标准</span>
                </div>
              </div>

              {/* Criteria column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                {row.criteria.map((c, i) => (
                  <span key={i} style={{
                    fontSize: 13, color: '#4B5563', lineHeight: '1.5em',
                    fontFamily: "'PingFang SC', sans-serif",
                  }}>{c}</span>
                ))}
              </div>

              {/* Risk level column */}
              <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
                <RiskTag level={row.riskLevel} />
              </div>

              {/* Actions column */}
              <div style={{ width: 144, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setHoveredAction({ key: 'edit', rowId: row.id, rect: { left: r.left, top: r.top, width: r.width } })
                    }}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 20, height: 20, borderRadius: 2, cursor: 'pointer', backgroundColor: hoveredAction?.key === 'edit' && hoveredAction?.rowId === row.id ? '#F5F5F5' : 'transparent' }}
                  >
                    {hoveredAction?.key === 'edit' && hoveredAction?.rowId === row.id && <Tooltip label="编辑" rect={hoveredAction.rect} />}
                    <img src="/icons/edit-line.svg" alt="edit" style={{ width: 16, height: 16 }} />
                  </div>
                  <div
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setHoveredAction({ key: 'delete', rowId: row.id, rect: { left: r.left, top: r.top, width: r.width } })
                    }}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 20, height: 20, borderRadius: 2, cursor: 'pointer', backgroundColor: hoveredAction?.key === 'delete' && hoveredAction?.rowId === row.id ? '#F5F5F5' : 'transparent' }}
                  >
                    {hoveredAction?.key === 'delete' && hoveredAction?.rowId === row.id && <Tooltip label="删除" rect={hoveredAction.rect} />}
                    <img src="/icons/delete-bin-7-line.svg" alt="delete" style={{ width: 16, height: 16 }} />
                  </div>
                </div>
                <Toggle checked={row.enabled} onChange={() => toggleStandard(row.id)} />
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 12, color: '#000000', textAlign: 'center', fontFamily: "'PingFang SC', sans-serif" }}>
              第1-20条/总共27条
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="#BFBFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#2A6DE7', borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>1</span>
              </div>
              <div style={{
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>2</span>
              </div>
              <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
            <div style={{
              display: 'flex', padding: '0 4px', alignItems: 'center', gap: 5,
              height: 20, border: '1px solid #BFBFBF', borderRadius: 2,
            }}>
              <span style={{ fontSize: 12, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>20条/页</span>
              <ChevronDown size={12} color="#333" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>跳转至</span>
              <div style={{ width: 24, height: 20, border: '1px solid #BFBFBF', borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>页</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 新增部门规则 Modal ─── */}
      {showDeptModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10000,
        }} onClick={() => setShowDeptModal(false)}>
          <div style={{
            width: 600, backgroundColor: '#FFFFFF', borderRadius: 8,
            display: 'flex', flexDirection: 'column', gap: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex', padding: '12px 16px', justifyContent: 'space-between',
              alignItems: 'center', borderBottom: '1px solid #E5E5E5',
            }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>新增部门规则</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer' }} onClick={() => setShowDeptModal(false)}>
                <path d="M6 6l12 12M18 6L6 18" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#FA4D56" /></svg>
                <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>部门规则名称</span>
              </div>
              <div style={{
                display: 'flex', padding: 8, alignItems: 'center', height: 37,
                border: '1px solid #E5E5E5', borderRadius: 8,
              }}>
                <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="例如：Legal" style={{
                  border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#333333',
                  fontFamily: "'PingFang SC', sans-serif", backgroundColor: 'transparent',
                }} />
              </div>
            </div>
            <div style={{
              display: 'flex', padding: '12px 24px', justifyContent: 'flex-end',
              alignItems: 'center', gap: 10, borderTop: '1px solid #E5E5E5',
            }}>
              <button onClick={() => setShowDeptModal(false)} style={{
                padding: '4px 15px', backgroundColor: '#FFFFFF',
                border: '1px solid #CCCCCC', borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>取消</span>
              </button>
              <button onClick={() => setShowDeptModal(false)} style={{
                padding: '4px 15px', backgroundColor: '#2A6DE7',
                border: 'none', borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>确定</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 新增审核标准 Modal ─── */}
      {showStandardModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10000,
        }} onClick={() => setShowStandardModal(false)}>
          <div style={{
            width: 600, backgroundColor: '#FFFFFF', borderRadius: 8,
            boxShadow: '1px 2px 4px 0px rgba(0,0,0,0.08), 0px 3px 8px 0px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex', padding: '12px 16px', justifyContent: 'space-between',
              alignItems: 'center', borderBottom: '1px solid #E5E5E5',
            }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>新增审核标准</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer' }} onClick={() => setShowStandardModal(false)}>
                <path d="M6 6l12 12M18 6L6 18" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#FA4D56" /></svg>
                  <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>审核类别</span>
                </div>
                <div style={{
                  display: 'flex', padding: 8, justifyContent: 'space-between', alignItems: 'center',
                  height: 37, border: '1px solid #E5E5E5', borderRadius: 8,
                }}>
                  <input value={standardCategory} onChange={(e) => setStandardCategory(e.target.value)} placeholder="例如：适应症准确性" style={{
                    border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#333333',
                    fontFamily: "'PingFang SC', sans-serif", backgroundColor: 'transparent',
                  }} />
                  <ChevronDown size={16} color="#333" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#FA4D56" /></svg>
                  <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>风险等级</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['高风险', '中风险', '低风险'] as const).map(level => {
                    const isActive = standardRisk === level
                    const colors = {
                      '高风险': { bg: isActive ? '#FFF1F1' : '#FFFFFF', border: isActive ? '#FA4D56' : '#E5E5E5', text: isActive ? '#FA4D56' : '#666666' },
                      '中风险': { bg: isActive ? '#FEF6DF' : '#FFFFFF', border: isActive ? '#D69D00' : '#E5E5E5', text: isActive ? '#D69D00' : '#666666' },
                      '低风险': { bg: isActive ? '#F4F8FF' : '#FFFFFF', border: isActive ? '#4382F8' : '#E5E5E5', text: isActive ? '#4382F8' : '#666666' },
                    }
                    const c = colors[level]
                    return (
                      <div key={level} onClick={() => setStandardRisk(level)} style={{
                        display: 'flex', padding: 8, justifyContent: 'center', alignItems: 'center',
                        flex: 1, height: 37, borderRadius: 8, cursor: 'pointer',
                        backgroundColor: c.bg, border: `1px solid ${c.border}`,
                      }}>
                        <span style={{ fontSize: 14, color: c.text, fontFamily: "'PingFang SC', sans-serif" }}>{level}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>审核标准条目</span>
                  <span style={{ fontSize: 14, color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>{standardItems.length}条</span>
                </div>
                {standardItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 14, color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif", flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ display: 'flex', padding: 8, alignItems: 'center', flex: 1, height: 37, border: '1px solid #E5E5E5', borderRadius: 8 }}>
                      <input value={item} onChange={(e) => { const next = [...standardItems]; next[i] = e.target.value; setStandardItems(next) }} placeholder={`标准条目${i + 1}`} style={{
                        border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#333333',
                        fontFamily: "'PingFang SC', sans-serif", backgroundColor: 'transparent',
                      }} />
                    </div>
                  </div>
                ))}
                <div onClick={() => setStandardItems(prev => [...prev, ''])} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#2A6DE7" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 14, color: '#2A6DE7', fontFamily: "'PingFang SC', sans-serif" }}>添加条目</span>
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', padding: '12px 24px', justifyContent: 'flex-end',
              alignItems: 'center', gap: 10, borderTop: '1px solid #E5E5E5',
            }}>
              <button onClick={() => setShowStandardModal(false)} style={{
                padding: '4px 15px', backgroundColor: '#FFFFFF',
                border: '1px solid #CCCCCC', borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>取消</span>
              </button>
              <button onClick={() => setShowStandardModal(false)} style={{
                padding: '4px 15px', backgroundColor: '#2A6DE7',
                border: 'none', borderRadius: 4, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>添加</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const ReviewManagement: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'资料信息配置' | 'AI审核配置'>('资料信息配置')
  const [filterText, setFilterText] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const filteredTags = filterText
    ? mockTags.filter(t => t.name.includes(filterText) || t.displayName.includes(filterText))
    : mockTags

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>

      {/* ─── Top Navigation Bar ─── */}
      <div style={{
        display: 'flex', padding: '11px 24px', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#052477', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 24, height: 24, backgroundColor: '#364E91', borderRadius: 4 }} />
            <span style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>内容中心</span>
            <div style={{ width: 1, height: 24, backgroundColor: '#364E91' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>智能审核</span>
            <span style={{ fontSize: '14px', color: '#BFBFBF', fontFamily: "'PingFang SC', sans-serif" }}>/</span>
            <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>审核管理</span>
          </div>
        </div>
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
        {sidebarCollapsed ? (
          /* Collapsed sidebar */
          <div style={{
            width: 40, flexShrink: 0, backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E5E5',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            alignItems: 'stretch', padding: '6px 0 8px',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              {sidebarMenus.map((menu) => (
                <div
                  key={menu.label}
                  style={{
                    width: 32, height: 32, display: 'flex',
                    justifyContent: 'center', alignItems: 'center',
                    borderRadius: 8, cursor: 'pointer',
                    backgroundColor: menu.active ? '#2A6DE7' : 'transparent',
                    padding: '8px 12px',
                  }}
                >
                  <img src={menu.icon} alt={menu.label} style={{
                    width: 16, height: 16,
                    filter: menu.active ? 'brightness(0) invert(1)' : 'none',
                  }} />
                </div>
              ))}
            </div>
            <div
              onClick={() => setSidebarCollapsed(false)}
              style={{
                display: 'flex', padding: '4px 12px', alignItems: 'center',
                borderTop: '1px solid #E5E5E5', cursor: 'pointer',
              }}
            >
              <img src="/icons/menu-unfold-2-line.svg" alt="expand" style={{ width: 16, height: 16 }} />
            </div>
          </div>
        ) : (
          /* Expanded sidebar */
          <div style={{
            width: 160, flexShrink: 0, backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E5E5',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '0 0 8px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sidebarMenus.map((menu) => (
                <div key={menu.label} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex', padding: '12px', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  }}>
                    <img src={menu.icon} alt={menu.label} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif", flex: 1 }}>
                      {menu.label}
                    </span>
                    {menu.expanded && <ChevronDown size={14} color="#333" />}
                  </div>
                  {menu.active && (
                    <>
                      <div
                        onClick={() => navigate('/workbench')}
                        style={{
                          display: 'flex', padding: '8px 36px', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>工作台</span>
                      </div>
                      <div style={{
                        display: 'flex', padding: '8px 36px', alignItems: 'center', gap: '8px',
                        backgroundColor: '#F4F8FF', borderRight: '1px solid #0049CD', cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0049CD', fontFamily: "'PingFang SC', sans-serif" }}>审核管理</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div
              onClick={() => setSidebarCollapsed(true)}
              style={{
                display: 'flex', padding: '4px 12px', alignItems: 'center', gap: '10px',
                borderTop: '1px solid #E5E5E5', cursor: 'pointer',
              }}
            >
              <img src="/icons/menu-unfold-2-line.svg" alt="collapse" style={{ width: 16, height: 16 }} />
            </div>
          </div>
        )}

        {/* ─── Main Content ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Sub-tabs */}
          <div style={{
            display: 'flex', alignSelf: 'stretch', padding: '0 16px', alignItems: 'stretch',
            height: '46px', borderBottom: '1px solid #EBEBEB', flexShrink: 0,
          }}>
            {(['资料信息配置', 'AI审核配置'] as const).map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex', padding: '4px 16px', justifyContent: 'center', alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #2A6DE7' : '2px solid transparent',
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#2A6DE7' : '#333333',
                  lineHeight: '20px',
                  letterSpacing: '-0.0107em',
                  fontFamily: "'PingFang SC', sans-serif",
                }}>{tab}</span>
              </div>
            ))}
          </div>

          {/* Content area - switch based on active tab */}
          {activeTab === '资料信息配置' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 36px', gap: '24px', overflow: 'auto' }}>

              {/* Filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '284px', height: '36px',
                }}>
                  <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif", flexShrink: 0 }}>标签名称</span>
                  <div style={{
                    display: 'flex', flex: 1, padding: '8px 12px', alignItems: 'center',
                    backgroundColor: '#FFFFFF', border: '1px solid #BFBFBF', borderRadius: '4px',
                  }}>
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="请填写标签名称"
                      style={{
                        border: 'none', outline: 'none', flex: 1, fontSize: '14px',
                        color: '#333333', fontFamily: "'PingFang SC', sans-serif",
                        backgroundColor: 'transparent',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setFilterText('')}
                    style={{
                      padding: '4px 15px', backgroundColor: '#FFFFFF',
                      border: '1px solid #CCCCCC', borderRadius: '4px', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>重置</span>
                  </button>
                  <button style={{
                    padding: '4px 15px', backgroundColor: '#2A6DE7',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>查询</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#E5E5E5', flexShrink: 0 }} />

              {/* Table area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {/* Actions row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button style={{
                    padding: '4px 15px', backgroundColor: '#2A6DE7',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>添加标签</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src="/icons/reset-left-fill.svg" alt="reset" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <img src="/icons/line-height.svg" alt="line-height" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <img src="/icons/settings-3-line.svg" alt="settings" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  </div>
                </div>

                {/* Data Table */}
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E5E5E5', borderRadius: 0 }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', height: '52px', backgroundColor: '#FAFAFA',
                    borderBottom: '1px solid #E5E5E5',
                  }}>
                    <div style={{ width: '180px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>标签名称</span>
                    </div>
                    <div style={{ width: '180px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>标签展示名称</span>
                    </div>
                    <div style={{ width: '140px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>数据类型</span>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>标签值</span>
                    </div>
                    <div style={{ width: '120px', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>操作</span>
                    </div>
                  </div>

                  {/* Rows */}
                  {filteredTags.map(row => (
                    <div key={row.id} style={{
                      display: 'flex', height: '52px',
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                      <div style={{ width: '180px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                        <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>{row.name}</span>
                      </div>
                      <div style={{ width: '180px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                        <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>{row.displayName}</span>
                      </div>
                      <div style={{ width: '140px', padding: '12px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #E5E5E5' }}>
                        <span style={{ fontSize: '14px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>{row.dataType}</span>
                      </div>
                      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderRight: '1px solid #E5E5E5' }}>
                        {row.values.map((val, i) => (
                          <span key={i} style={{
                            padding: '4px 8px', backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E5E5', borderRadius: '2px',
                            fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif",
                          }}>{val}</span>
                        ))}
                      </div>
                      <div style={{ width: '120px', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 500, color: '#2A6DE7',
                          fontFamily: "'PingFang SC', sans-serif", cursor: 'pointer',
                        }}>修改</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px',
                  paddingBottom: '24px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '12px', color: '#000000', fontFamily: "'PingFang SC', sans-serif" }}>
                    第1-{filteredTags.length}条/总共{filteredTags.length}条
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="#BFBFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{
                      width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#2A6DE7', borderRadius: '4px', cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: "'PingFang SC', sans-serif" }}>1</span>
                    </div>
                    <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', padding: '0 4px', alignItems: 'center', gap: '5px',
                    height: '20px', border: '1px solid #BFBFBF', borderRadius: '2px',
                  }}>
                    <span style={{ fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>20条/页</span>
                    <ChevronDown size={12} color="#333" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>跳转至</span>
                    <div style={{
                      width: 24, height: 20, border: '1px solid #BFBFBF', borderRadius: '2px',
                    }} />
                    <span style={{ fontSize: '12px', color: '#333333', fontFamily: "'PingFang SC', sans-serif" }}>页</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AIConfigPanel />
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewManagement
