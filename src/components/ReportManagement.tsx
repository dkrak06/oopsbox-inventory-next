/**
 * [ReportManagement 컴포넌트]
 * 역할: 입출고요약, 과거수량조회, 대시보드, 재고분석, 매출분석, 커스텀 리포트 등 분석 폴더 6대 기능을 실제 박스히어로 UI에 맞춰 제공합니다.
 * 흐름: 상단 서브 탭 분기 -> 각 리포트 유형별 실 데이터 통계/역산 연산 -> 모의 SQL 쿼리 실행기 구동.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredItems, 
  getStoredOrders, 
  getStoredHistories, 
  Item, 
  OrderItem, 
  StockHistory 
} from '@/lib/storage';

interface ReportManagementProps {
  currentPath: 'summary' | 'past-quantity' | 'dashboard' | 'inventory' | 'sales' | 'duckdb' | string;
}

export default function ReportManagement({ currentPath }: ReportManagementProps) {
  // 상태 데이터 불러오기
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);

  // 1. 공통 날짜 범위 & 검색 조건 상태
  const [startDate, setStartDate] = useState('2026-07-06');
  const [endDate, setEndDate] = useState('2026-08-05');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. 입출고 요약 전용 서브 탭 (summary / date)
  const [summarySubTab, setSummarySubTab] = useState<'SUMMARY' | 'DATE'>('SUMMARY');

  // 3. 과거 수량 조회 기준 날짜 및 위치 토글
  const [pastDate, setPastDate] = useState('2026-08-05');
  const [showByLocation, setShowByLocation] = useState(false);

  // 4. 재고 분석 시작 트리거 상태
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 5. 매출 분석 서브 탭 (손익 / 매입매출) & 거래처별 묶어보기
  const [salesSubTab, setSalesSubTab] = useState<'PROFIT' | 'VOLUME'>('PROFIT');
  const [groupByPartner, setGroupByPartner] = useState(false);

  // 6. 커스텀 리포트 SQL 모의 상태
  const [sqlQuery, setSqlQuery] = useState('SELECT name, total_quantity, selling_price FROM products WHERE total_quantity < 20;');
  const [sqlResult, setSqlResult] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(false); // 박스히어로 DuckDB 끊김 화면 모사

  // 초기화 로드
  useEffect(() => {
    setItems(getStoredItems());
    setOrders(getStoredOrders());
    setHistory(getStoredHistories());
    
    // 탭 변경 시 분석 상태 초기화
    setAnalysisStarted(false);
    setDbConnected(false);
    setSqlError(null);
    setSqlResult([]);
  }, [currentPath]);

  // ==========================================
  // [1] 입출고 요약 연산 및 렌더러
  // ==========================================
  const renderSummaryTab = () => {
    // 필터링된 아이템 목록
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 날짜 범위 내 입출고 트랜잭션 집계
    const summaryData = filteredItems.map(item => {
      const filteredHistory = history.filter(h => {
        const hDate = h.created_at.split(' ')[0];
        return h.item_id === item.id && hDate >= startDate && hDate <= endDate;
      });

      const inQty = filteredHistory.filter(h => h.type === 'IN').reduce((sum, h) => sum + h.qty_change, 0);
      const outQty = filteredHistory.filter(h => h.type === 'OUT').reduce((sum, h) => sum + h.qty_change, 0);
      const adjustQty = filteredHistory.filter(h => h.type === 'ADJUST').reduce((sum, h) => sum + h.qty_change, 0);
      const moveQty = filteredHistory.filter(h => h.type === 'MOVE').reduce((sum, h) => sum + h.qty_change, 0);

      return {
        ...item,
        inQty,
        outQty,
        adjustQty,
        moveQty,
        endQty: item.total_quantity
      };
    });

    // 전체 합계 산출
    const totalIn = summaryData.reduce((sum, d) => sum + d.inQty, 0);
    const totalOut = summaryData.reduce((sum, d) => sum + d.outQty, 0);
    const totalAdjust = summaryData.reduce((sum, d) => sum + d.adjustQty, 0);
    const totalMove = summaryData.reduce((sum, d) => sum + d.moveQty, 0);
    const totalEnd = summaryData.reduce((sum, d) => sum + d.endQty, 0);

    return (
      <div>
        {/* 탭 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>분석 &gt; 입출고 요약</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>입출고 요약</h2>
          </div>
          <button style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            엑셀 내보내기
          </button>
        </div>

        {/* 필터 툴바 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', fontSize: '13px' }} />
            <span style={{ color: '#94a3b8' }}>~</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', fontSize: '13px' }} />
          </div>
          <input
            type="text"
            placeholder="이름, 바코드, 속성 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
          <button style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            필터 추가
          </button>
        </div>

        {/* 서브 탭 분류 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <button 
            onClick={() => setSummarySubTab('SUMMARY')} 
            style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: summarySubTab === 'SUMMARY' ? '2px solid #3b82f6' : '2px solid transparent', color: summarySubTab === 'SUMMARY' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            요약
          </button>
          <button 
            onClick={() => setSummarySubTab('DATE')} 
            style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: summarySubTab === 'DATE' ? '2px solid #3b82f6' : '2px solid transparent', color: summarySubTab === 'DATE' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            날짜별
          </button>
        </div>

        {/* 요약 테이블 */}
        {summarySubTab === 'SUMMARY' ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>제품명</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>입고량</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>출고량</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>조정 변동량</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>이동 변동량</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>종료 재고</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.sku}</div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>+{d.inQty}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>-{d.outQty}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: d.adjustQty >= 0 ? '#10b981' : '#ef4444' }}>
                      {d.adjustQty > 0 ? `+${d.adjustQty}` : d.adjustQty}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{d.moveQty}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{d.endQty} 개</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                  <td style={{ padding: '10px 14px' }}>합계 ({summaryData.length}개 항목)</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981' }}>+{totalIn}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444' }}>-{totalOut}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{totalAdjust > 0 ? `+${totalAdjust}` : totalAdjust}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{totalMove}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#1e293b' }}>{totalEnd} 개</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
            날짜별 변동 트랜잭션 타임라인 준비 중입니다. 날짜 범위를 조절하여 요약 표를 확인해 보세요.
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // [2] 과거 수량 조회 연산 및 렌더러
  // ==========================================
  const renderPastQtyTab = () => {
    // 💡 과거 수량 산출 알고리즘: 현재고에서 시작해서 기준일 '이후'의 모든 변동 히스토리를 추적하여 역산
    const calculatedPastData = items.map(item => {
      const subsequentMovements = history.filter(h => {
        const hDate = h.created_at.split(' ')[0];
        return h.item_id === item.id && hDate > pastDate;
      });

      let calculatedQty = item.total_quantity;
      
      // 역방향 계산: 이후 발생한 입고(IN)는 빼주고, 출고(OUT)는 더해줌. ADJUST(조정)도 마찬가지로 역으로 보정
      subsequentMovements.forEach(m => {
        if (m.type === 'IN') {
          calculatedQty -= m.qty_change;
        } else if (m.type === 'OUT') {
          calculatedQty += m.qty_change;
        } else if (m.type === 'ADJUST') {
          calculatedQty -= m.qty_change;
        }
      });

      return {
        ...item,
        pastQty: Math.max(0, calculatedQty)
      };
    });

    const totalPastQty = calculatedPastData.reduce((sum, d) => sum + d.pastQty, 0);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>분석 &gt; 과거 수량 조회</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>과거 수량 조회</h2>
          </div>
          <button style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            엑셀 내보내기
          </button>
        </div>

        {/* 과거 날짜 선택 필터 바 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>기준 날짜:</label>
            <input type="date" value={pastDate} onChange={e => setPastDate(e.target.value)} style={{ border: 'none', fontSize: '13px', fontWeight: 600 }} />
          </div>
          <input
            type="text"
            placeholder="이름, 바코드, 속성 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
          <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>재고 보유 품목만</span>
          </label>
        </div>

        {/* 부가 제어 옵션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>위치 필터: <strong>기본 위치</strong></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#475569' }}>위치별 수량 보기</span>
            <input 
              type="checkbox" 
              checked={showByLocation} 
              onChange={() => setShowByLocation(!showByLocation)} 
              style={{ width: '34px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 과거 재고 테이블 */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>제품</th>
                {showByLocation && <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, width: '150px' }}>보관 위치</th>}
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right', width: '180px' }}>
                  {pastDate} 기준 재고
                </th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'center', width: '120px' }}>이동 히스토리</th>
              </tr>
            </thead>
            <tbody>
              {calculatedPastData.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.sku} | {d.barcode}</div>
                  </td>
                  {showByLocation && <td style={{ padding: '12px 14px', color: '#475569' }}>기본 위치 (창고 A)</td>}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                    {d.pastQty} 개
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                      조회 ➔
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                <td style={{ padding: '12px 14px' }}>합계 ({calculatedPastData.length}개 항목)</td>
                {showByLocation && <td></td>}
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontSize: '14px' }}>
                  {totalPastQty} 개
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // ==========================================
  // [3] 대시보드 리포트 렌더러
  // ==========================================
  const renderDashboardTab = () => {
    // 간단한 대시보드 요약 지표 산출
    const totalInventoryCount = items.reduce((sum, item) => sum + item.total_quantity, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 오늘의 입고/출고
    const todayMovements = history.filter(h => h.created_at.startsWith(todayStr));
    const todayIn = todayMovements.filter(h => h.type === 'IN').reduce((sum, h) => sum + h.qty_change, 0);
    const todayOut = todayMovements.filter(h => h.type === 'OUT').reduce((sum, h) => sum + h.qty_change, 0);

    // 최근 한 달의 입출고 누계
    const oneMonthAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthMovements = history.filter(h => h.created_at.split(' ')[0] >= oneMonthAgoStr);
    const monthIn = monthMovements.filter(h => h.type === 'IN').reduce((sum, h) => sum + h.qty_change, 0);
    const monthOut = monthMovements.filter(h => h.type === 'OUT').reduce((sum, h) => sum + h.qty_change, 0);

    return (
      <div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>분석 &gt; 대시보드</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>대시보드</h2>

        {/* 상단 메일 알림 안내 배너 (실제 박스히어로 배너 카피 반영) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '8px', color: '#1e40af', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
          <i className="fa-solid fa-circle-info" style={{ fontSize: '16px' }}></i>
          <span>관리자 권한이 있는 경우 주간 리포트를 이메일로 받아볼 수 있습니다. 알림 설정에서 수신 여부를 확인해 주세요.</span>
        </div>

        {/* 메인 리포트 레이아웃 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* 섹션 1: 오늘 (Date) 지표 */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
              오늘의 재고 현황 ({todayStr})
            </h3>
            
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>총 재고 수량</span>
                <strong style={{ fontSize: '18px', color: '#1e293b' }}>{totalInventoryCount.toLocaleString()} 개</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>오늘 입고량</span>
                <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 700 }}>+{todayIn} 개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>오늘 출고량</span>
                <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>-{todayOut} 개</span>
              </div>
            </div>
          </div>

          {/* 섹션 2: 최근 한 달 누계 지표 */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
              최근 한 달 지표 누계 (30일간)
            </h3>
            
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>재고 순변동량</span>
                <strong style={{ fontSize: '16px', color: monthIn - monthOut >= 0 ? '#10b981' : '#ef4444' }}>
                  {monthIn - monthOut >= 0 ? `+${monthIn - monthOut}` : monthIn - monthOut} 개
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>누적 총 입고량</span>
                <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>+{monthIn} 개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>누적 총 출고량</span>
                <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>-{monthOut} 개</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // ==========================================
  // [4] 재고 분석 렌더러 (정밀 테이블 통계)
  // ==========================================
  const renderInventoryTab = () => {
    // 가상의 재고 분석 시작 로직
    const handleStartAnalysis = () => {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisStarted(true);
      }, 1200);
    };

    if (!analysisStarted) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
          <i className="fa-solid fa-chart-line" style={{ fontSize: '50px', color: '#3b82f6', marginBottom: '16px' }}></i>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>데이터 기반으로 재고를 분석해 보세요.</h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', lineHeight: 1.5, marginBottom: '20px' }}>
            재고자산의 총 가치, 기간별 평균 재고량, 회전율, 예상 소진 소요 일수를 정밀하게 계산합니다.
          </p>
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
          >
            {isAnalyzing ? '데이터 연산 분석 중...' : '재고 분석 시작'}
          </button>
        </div>
      );
    }

    // 모의 재고 자산 및 회전율 요약 지표 생성
    let totalAssetValue = 0;
    const analysisRows = items.map(item => {
      const assetVal = item.total_quantity * item.purchase_price;
      totalAssetValue += assetVal;
      
      // 모의 분석 지표 매핑
      const avgQty = Math.round(item.total_quantity * 0.95 + 2);
      const turnover = item.total_quantity > 50 ? 1.4 : 0.8;
      const daysLeft = item.total_quantity === 0 ? 0 : Math.round(item.total_quantity / 0.5);

      return {
        ...item,
        assetVal,
        avgQty,
        turnover,
        daysLeft
      };
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>분석 &gt; 재고 분석</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>재고 분석 결과</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>수식 추가 및 설정</button>
            <button style={{ padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>엑셀 내보내기</button>
          </div>
        </div>

        {/* 리포트 그리드 */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>제품 정보</th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>현재 재고량</th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>재고자산 가치</th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>평균 재고량</th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>재고 회전율 (회)</th>
                <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>예상 소진 일수</th>
              </tr>
            </thead>
            <tbody>
              {analysisRows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.sku}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{row.total_quantity} 개</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₩{row.assetVal.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569' }}>{row.avgQty} 개</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#3b82f6', fontWeight: 700 }}>{row.turnover} 회</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: row.daysLeft < 30 ? '#ef4444' : '#1e293b', fontWeight: 600 }}>
                    {row.daysLeft === 0 ? '소진됨' : `${row.daysLeft}일`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700 }}>
                <td style={{ padding: '12px 14px' }}>합계 ({analysisRows.length}개 품목)</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {items.reduce((sum, i) => sum + i.total_quantity, 0)} 개
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b' }}>
                  ₩{totalAssetValue.toLocaleString()}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // ==========================================
  // [5] 매출 분석 렌더러
  // ==========================================
  const renderSalesTab = () => {
    // 구매/판매 전표 내역 기반의 순수 마진 및 손익 계산
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalBuy = completedOrders
      .filter(o => o.type === 'BUY')
      .reduce((sum, o) => sum + (o.products || []).reduce((prodSum, p) => prodSum + (p.qty * p.price), 0), 0);
    const totalSell = completedOrders
      .filter(o => o.type === 'SELL')
      .reduce((sum, o) => sum + (o.products || []).reduce((prodSum, p) => prodSum + (p.qty * p.price), 0), 0);
    const totalReturn = completedOrders
      .filter(o => o.type === 'RETURN')
      .reduce((sum, o) => sum + (o.products || []).reduce((prodSum, p) => prodSum + (p.qty * p.price), 0), 0);

    const netProfit = totalSell - totalBuy - totalReturn;
    const marginPercent = totalSell === 0 ? 0 : Math.round((netProfit / totalSell) * 100);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>분석 &gt; 매출 분석</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>매출 분석</h2>
          </div>
          <button style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            엑셀 내보내기
          </button>
        </div>

        {/* 상단 고지 멘트 배너 (실제 박스히어로 배너 카피 반영) */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>
          💡 매출 분석은 구매 및 판매에서 작성된 데이터만 포함됩니다.
        </div>

        {/* 필터 툴바 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', fontSize: '13px' }} />
            <span style={{ color: '#94a3b8' }}>~</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', fontSize: '13px' }} />
          </div>
          
          <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={groupByPartner} 
              onChange={() => setGroupByPartner(!groupByPartner)} 
            />
            <span>거래처별 묶어보기</span>
          </label>
        </div>

        {/* 서브 탭 분기 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <button 
            onClick={() => setSalesSubTab('PROFIT')} 
            style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: salesSubTab === 'PROFIT' ? '2px solid #3b82f6' : '2px solid transparent', color: salesSubTab === 'PROFIT' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            손익 분석
          </button>
          <button 
            onClick={() => setSalesSubTab('VOLUME')} 
            style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: salesSubTab === 'VOLUME' ? '2px solid #3b82f6' : '2px solid transparent', color: salesSubTab === 'VOLUME' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            매입매출 분석
          </button>
        </div>

        {/* 요약 대시보드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>총 매출액</div>
            <strong style={{ fontSize: '18px', color: '#10b981' }}>₩{totalSell.toLocaleString()}</strong>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>총 매입액(반품 포함)</div>
            <strong style={{ fontSize: '18px', color: '#ef4444' }}>₩{(totalBuy + totalReturn).toLocaleString()}</strong>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>순이익 (마진율)</div>
            <strong style={{ fontSize: '18px', color: '#1e293b' }}>
              ₩{netProfit.toLocaleString()} ({marginPercent}%)
            </strong>
          </div>
        </div>

        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
          {groupByPartner ? '거래처별 누적 매입매출 내역을 집계 중입니다.' : '품목별 매출 및 원가 비교 내역이 제공됩니다.'}
        </div>
      </div>
    );
  };

  // ==========================================
  // [6] 커스텀 리포트 렌더러 (SQL 에디터 구현)
  // ==========================================
  const renderCustomTab = () => {
    // 모의 SQL 실행 엔진
    const handleRunSQL = () => {
      setSqlError(null);
      setSqlResult([]);

      try {
        const query = sqlQuery.trim().toLowerCase();
        if (!query.startsWith('select')) {
          throw new Error('오직 SELECT 쿼리문만 지원됩니다. (e.g., SELECT * FROM products)');
        }

        // 가상 파싱
        let result = items.map(item => ({
          name: item.name,
          sku: item.sku,
          total_quantity: item.total_quantity,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price
        }));

        if (query.includes('where')) {
          if (query.includes('total_quantity < 20')) {
            result = result.filter(r => r.total_quantity < 20);
          } else if (query.includes('total_quantity > 50')) {
            result = result.filter(r => r.total_quantity > 50);
          }
        }

        setSqlResult(result);
      } catch (err: any) {
        setSqlError(err.message || 'SQL 문법 구문 오류가 발생했습니다.');
      }
    };

    if (!dbConnected) {
      return (
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>분석 &gt; 커스텀 리포트 (DuckDB)</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>커스텀 리포트</h2>

          {/* 박스히어로 데이터베이스 연결 실패 화면 모사 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
            <i className="fa-solid fa-database" style={{ fontSize: '56px', color: '#94a3b8', marginBottom: '16px' }}></i>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>데이터베이스 연결 실패</h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', lineHeight: 1.5, marginBottom: '20px' }}>
              로컬 브라우저 SQL 모듈과 동기화하는 도중 타임아웃이 발생했습니다. 안전하게 재연결을 시도해 보세요.
            </p>
            <button
              onClick={() => {
                setDbConnected(true);
                handleRunSQL();
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              다시 연결
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>분석 &gt; 커스텀 리포트 (DuckDB)</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>커스텀 리포트 SQL 콘솔</h2>

        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>SQL QUERY EDITOR (Table: products)</span>
            <button 
              onClick={handleRunSQL}
              style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              실행 (Run)
            </button>
          </div>
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none',
              resize: 'none'
            }}
          />
        </div>

        {/* 결과 뷰 */}
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>실행 결과</h3>
        
        {sqlError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontFamily: 'monospace' }}>
            ❌ {sqlError}
          </div>
        )}

        {!sqlError && sqlResult.length === 0 && (
          <div style={{ padding: '20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
            쿼리 결과가 비어 있습니다.
          </div>
        )}

        {!sqlError && sqlResult.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  {Object.keys(sqlResult[0]).map(key => (
                    <th key={key} style={{ padding: '8px 12px', color: '#475569' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sqlResult.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {Object.values(row).map((val: any, vidx) => (
                      <td key={vidx} style={{ padding: '8px 12px', color: '#1e293b' }}>
                        {typeof val === 'number' ? val.toLocaleString() : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // [메인 탭 선택 렌더 제어]
  // ==========================================
  const renderContent = () => {
    switch (currentPath) {
      case 'summary':
        return renderSummaryTab();
      case 'past-quantity':
        return renderPastQtyTab();
      case 'dashboard':
        return renderDashboardTab();
      case 'inventory':
        return renderInventoryTab();
      case 'sales':
        return renderSalesTab();
      case 'duckdb':
        return renderCustomTab();
      default:
        return renderDashboardTab();
    }
  };

  return (
    <div className="report-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      {renderContent()}
    </div>
  );
}
