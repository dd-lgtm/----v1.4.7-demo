import React, { useState } from 'react'
import TopBar from './TopBar'
import Annotation from './Annotation'
import VersionCard from './VersionCard'

const ViewDocument: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'批注' | '历史版本'>('批注')
  const [activeSubTab, setActiveSubTab] = useState<'全部' | 'AI' | '人工'>('全部')
  const [activeAnnotation, setActiveAnnotation] = useState<string>('')

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* TopBar */}
      <TopBar variant="人工审核中-创建人" />

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PDF View Area */}
        <div style={{ flex: 1, minHeight: 0, backgroundColor: '#EFEFEF', display: 'flex' }}>
          {/* PDF Left - Thumbnail sidebar */}
          <div
            style={{
              display: 'flex',
              padding: '16px 12px',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid #E5E5E5',
              alignSelf: 'stretch',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '13px', width: '61px' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '61px',
                    height: '76px',
                    backgroundColor: '#D9D9D9',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* PDF Right */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* PDF Toolbar */}
            <div
              style={{
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderRight: '1px solid #E5E5E5',
                flexShrink: 0,
              }}
            />
            {/* PDF Content Area */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
                padding: '52px 76px 0px',
                gap: '6px',
                flex: 1,
                backgroundColor: '#EFEFEF',
              }}
            >
              <div style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            </div>
          </div>
        </div>

        {/* Annotation & History Panel */}
        <div style={{ width: '397px', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
          {/* Tabs Section */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '16px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', gap: '10px' }}>
              {/* Tab Switcher */}
              <div
                style={{
                  display: 'flex',
                  padding: '2px',
                  gap: '2px',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '8px',
                }}
              >
                <div
                  onClick={() => setActiveTab('批注')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderRadius: '6px',
                    backgroundColor: activeTab === '批注' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === '批注' ? '0px 2px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: activeTab === '批注' ? 600 : 400,
                      color: activeTab === '批注' ? '#333333' : '#666666',
                      fontFamily: "'PingFang SC', sans-serif",
                    }}
                  >
                    批注
                  </span>
                </div>
                <div
                  onClick={() => setActiveTab('历史版本')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderRadius: '6px',
                    backgroundColor: activeTab === '历史版本' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === '历史版本' ? '0px 2px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: activeTab === '历史版本' ? 600 : 400,
                      color: activeTab === '历史版本' ? '#333333' : '#666666',
                      fontFamily: "'PingFang SC', sans-serif",
                    }}
                  >
                    历史版本
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-tab Track - only show when 批注 tab is active */}
            {activeTab === '批注' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                borderBottom: '1px solid #E5E5E5',
              }}
            >
              {(['全部', 'AI', '人工'] as const).map((tab) => (
                <div
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: activeSubTab === tab ? '2px solid #2A6DE7' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: activeSubTab === tab ? 600 : 400,
                      color: activeSubTab === tab ? '#2A6DE7' : '#333333',
                      textAlign: 'center',
                      fontFamily: "'PingFang SC', sans-serif",
                    }}
                  >
                    {tab}
                  </span>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Content Area */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div
              className="annotation-scroll"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 8px',
                gap: activeTab === '历史版本' ? '12px' : '50px',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {activeTab === '批注' ? (
                <>
                  {/* AI Annotation */}
                  <Annotation
                    variant="AI"
                    department="Branding"
                    time="06-24 14:32"
                    interactive
                    id="ai-1"
                    isActive={activeAnnotation === 'ai-1'}
                    onActivate={setActiveAnnotation}
                  />

                  {/* Manual Annotation */}
                  <Annotation
                    variant="manual"
                    department="Legal"
                    userName="段威丞"
                    time="06-24 14:32"
                    interactive
                    id="manual-1"
                    isActive={activeAnnotation === 'manual-1'}
                    onActivate={setActiveAnnotation}
                  />
                </>
              ) : (
                <>
                  {/* Version Cards */}
                  <VersionCard variant="current" version="V3" department="Branding" userName="段威丞" time="2026-05-19 15:20" tagVariant="人工审核中" />
                  <VersionCard variant="old" version="V2" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="待补充" />
                  <VersionCard variant="old" version="V1" department="RA" userName="段威丞" time="2026-05-19 15:20" tagVariant="返回修改" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewDocument
