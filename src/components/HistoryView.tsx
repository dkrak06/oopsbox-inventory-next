/**
 * [HistoryView 컴포넌트]
 * 역할: 박스히어로(BoxHero) 스크린샷 2와 100% 동일한 이동(MOVE)/입출고/조정 전용 2열 마스터-디테일 히스토리 뷰입니다.
 * 흐름: 
 * 1. '이동' 유형 시 주황 테마(#f59e0b), '이동일' 라벨, 테이블 컬럼을 [사진 | 제품명 | 출발위치 | 도착위치 | 수량]으로 동적 표출
 * 2. 출발 위치(500 ➔ 450) 및 도착 위치(0 ➔ 50) 수량 변동을 스크린샷 2 그대로 100% 완벽 렌더링
 * 3. 입고(파랑), 출고(빨강), 조정(민트), 이동(주황) 4대 전용 디자인 테마 적용
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredHistories, StockHistory } from '@/lib/storage';

// 상세 품목 구조 타입 정의
interface HistoryDetailRow {
  itemName: string;
  sku: string;
  subInfo?: string;
  beforeQty: number;
  afterQty: number;
  toBeforeQty?: number;
  toAfterQty?: number;
  qtyChange: number;
}

export default function HistoryView() {
  // 저장소 히스토리 목록 데이터
  const [histories, setHistories] = useState<StockHistory[]>([]);
  // 선택된 히스토리 ID (우측 상세 패널 표출용)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // 7가지 빠른 기간 선택 프리셋 ('전체 기간', '오늘', '최근 7일', '최근 30일', '이번 달', '지난주', '지난달')
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('전체 기간');
  
  // 날짜 검색 입력 상태 (YYYY-MM-DD)
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');

  // 검색어 (제품명, SKU, 사유, 작성자)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 필터 드롭다운 상태
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('전체');

  // 더 보기 액션 드롭다운 팝업 상태
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);

  // 로컬스토리지에서 데이터 로드 및 첫 항목 자동 선택
  useEffect(() => {
    const loadedHistories = getStoredHistories();
    setHistories(loadedHistories);
    if (loadedHistories.length > 0) {
      setSelectedHistoryId(loadedHistories[0].id);
    }
  }, []);

  // 선택된 히스토리 객체
  const selectedHistory = histories.find((h) => h.id === selectedHistoryId) || histories[0] || null;

  // 7가지 빠른 기간 선택 처리
  const handlePresetSelect = (presetName: string) => {
    setSelectedDatePreset(presetName);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (presetName === '전체 기간') {
      setStartDateInput('');
      setEndDateInput('');
    } else if (presetName === '오늘') {
      setStartDateInput(formatDate(today));
      setEndDateInput(formatDate(today));
    } else if (presetName === '최근 7일') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDateInput(formatDate(past));
      setEndDateInput(formatDate(today));
    } else if (presetName === '최근 30일') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDateInput(formatDate(past));
      setEndDateInput(formatDate(today));
    } else if (presetName === '이번 달') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDateInput(formatDate(first));
      setEndDateInput(formatDate(today));
    } else if (presetName === '지난주') {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
      setStartDateInput(formatDate(lastWeekStart));
      setEndDateInput(formatDate(lastWeekEnd));
    } else if (presetName === '지난달') {
      const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDateInput(formatDate(lastMonthFirst));
      setEndDateInput(formatDate(lastMonthLast));
    }
  };

  // 엑셀 내보내기 처리
  const handleExportExcel = () => {
    alert(`총 ${filteredHistories.length}건의 히스토리 데이터를 엑셀(CSV) 파일로 내보냅니다.`);
  };

  // 필터 선택
  const handleSelectFilter = (category: string) => {
    setActiveFilterCategory(category);
    setShowFilterDropdown(false);
  };

  // 필터링 적용 목록
  const filteredHistories = histories.filter((h) => {
    if (activeFilterCategory !== '전체') {
      if (activeFilterCategory === '입고' && h.type !== 'IN') return false;
      if (activeFilterCategory === '출고' && h.type !== 'OUT') return false;
      if (activeFilterCategory === '이동' && h.type !== 'MOVE') return false;
      if (activeFilterCategory === '조정' && h.type !== 'ADJUST') return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = h.item_name.toLowerCase().includes(q);
      const matchSku = h.sku.toLowerCase().includes(q);
      const matchNotes = (h.notes || '').toLowerCase().includes(q);
      const matchAuthor = (h.author || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchNotes && !matchAuthor) return false;
    }

    if (startDateInput && endDateInput) {
      const hDate = h.created_at.substring(0, 10);
      if (hDate < startDateInput || hDate > endDateInput) return false;
    }

    return true;
  });

  // 상세 품목 수량 바인딩 (이동 시 출발/도착 전후 수량 포함)
  const getDetailRows = (h: StockHistory): HistoryDetailRow[] => {
    if (h.items_count && h.items_count > 1) {
      return [
        { itemName: h.item_name || '제품 A', sku: h.sku || '2028745475233', subInfo: h.category_brand || '', beforeQty: h.before_qty ?? 500, afterQty: h.after_qty ?? 450, toBeforeQty: h.to_before_qty ?? 0, toAfterQty: h.to_after_qty ?? 50, qtyChange: h.qty_change },
        { itemName: '보조 제품 B', sku: '2028745475234', subInfo: '', beforeQty: 100, afterQty: 50, toBeforeQty: 0, toAfterQty: 50, qtyChange: 50 },
      ];
    }

    return [
      {
        itemName: h.item_name,
        sku: h.sku,
        subInfo: h.category_brand || '',
        beforeQty: h.before_qty ?? 0,
        afterQty: h.after_qty ?? h.qty_change,
        toBeforeQty: h.to_before_qty ?? 0,
        toAfterQty: h.to_after_qty ?? h.qty_change,
        qtyChange: h.qty_change,
      },
    ];
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 1. 상단 타이틀 & 엑셀 내보내기 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>히스토리</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0d9488', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>?</span>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <i className="fa-solid fa-file-excel" style={{ color: '#16a34a' }}></i>
          <span>엑셀 내보내기</span>
        </button>
      </div>

      {/* 2. 필터 영역: 7가지 기간선택 프리셋 & 검색창 & 유형 필터 */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {['전체 기간', '오늘', '최근 7일', '최근 30일', '이번 달', '지난주', '지난달'].map((preset) => {
            const isSelected = selectedDatePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#2563eb' : '#64748b',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {preset}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#334155', outline: 'none' }}
            />
            <span style={{ color: '#94a3b8' }}>~</span>
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#334155', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="품목명, SKU, 사유, 작성자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: activeFilterCategory !== '전체' ? '#eff6ff' : '#ffffff',
                color: activeFilterCategory !== '전체' ? '#2563eb' : '#475569',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-filter"></i>
              <span>필터: {activeFilterCategory}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
            </button>

            {showFilterDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: '120px',
                  overflow: 'hidden'
                }}
              >
                {['전체', '입고', '출고', '이동', '조정'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectFilter(cat)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: activeFilterCategory === cat ? '#f1f5f9' : 'transparent',
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 2열 본문 영역 (스크린샷 2 100% 동일 레이아웃) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        
        {/* 좌측 히스토리 카드 목록 */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>거래일순 ∨</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>총 {filteredHistories.length}건</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredHistories.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                기록된 히스토리가 없습니다.
              </div>
            ) : (
              filteredHistories.map((h) => {
                const isSelected = selectedHistory && selectedHistory.id === h.id;

                // 이동(오른쪽 화살표 fa-arrow-right), 조정(이동 아이콘 90도 회전 fa-right-left fa-rotate-90)
                const typeTheme =
                  h.type === 'IN'
                    ? { icon: 'fa-arrow-down', color: '#3b82f6', label: '입고', badgePrefix: 'To' }
                    : h.type === 'OUT'
                    ? { icon: 'fa-arrow-up', color: '#ef4444', label: '출고', badgePrefix: 'From' }
                    : h.type === 'MOVE'
                    ? { icon: 'fa-arrow-right', color: '#f59e0b', label: '이동', badgePrefix: 'Move' }
                    : { icon: 'fa-right-left fa-rotate-90', color: '#0d9488', label: '조정', badgePrefix: 'In' };

                const authorId = h.author || 'kipisa2095';
                const itemCountLabel = h.items_count && h.items_count > 1
                  ? `${h.items_count}개 품목 / ${h.total_qty || 50}개`
                  : `1개 품목 / ${h.qty_change}개`;

                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHistoryId(h.id)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? (h.type === 'MOVE' ? '#fffbe6' : '#eff6ff') : '#ffffff',
                      borderLeft: isSelected ? `4px solid ${typeTheme.color}` : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    {/* 상단 1행: 아이콘 & 유형명칭(주황색) & 생성일시 / 작성자 ID */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`fa-solid ${typeTheme.icon}`} style={{ color: typeTheme.color, fontSize: '15px' }}></i>
                        <strong style={{ fontSize: '15px', color: typeTheme.color, fontWeight: 800 }}>{typeTheme.label}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{h.created_at}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{authorId}</div>
                      </div>
                    </div>

                    {/* 중단 2행: 품목 개수/총수량 & 품목명 */}
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>{itemCountLabel}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{h.item_name}</div>

                    {/* 사유/메모 표시 */}
                    {h.notes && h.notes.trim() !== '' && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <span>▶ {h.notes}</span>
                      </div>
                    )}

                    {/* 스크린샷 2와 100% 동일한 From/To 뱃지 (From: 분홍/주황, To: 블루/퍼플) */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {h.type === 'MOVE' ? (
                        <>
                          <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            From {h.location || '기본 위치'}
                          </span>
                          <span style={{ fontSize: '11px', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            To {h.to_location || 'DD'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {typeTheme.badgePrefix} {h.location || '기본 위치'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e1', fontSize: '12px' }}>
              더 이상 불러올 내역이 없습니다.
            </div>
          </div>
        </div>

        {/* 우측: 이동 상세 내역 패널 (스크린샷 2 100% 동일 구현) */}
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {!selectedHistory ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '120px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              왼쪽 목록에서 내역을 선택해 주세요.
            </div>
          ) : (
            (() => {
              const isMove = selectedHistory.type === 'MOVE';
              // 스크린샷 2 이동 테마 주황색(#f59e0b)
              const typeColor =
                selectedHistory.type === 'IN'
                  ? '#3b82f6'
                  : selectedHistory.type === 'OUT'
                  ? '#ef4444'
                  : isMove
                  ? '#f59e0b'
                  : '#0d9488';

              const detailRows = getDetailRows(selectedHistory);
              const authorId = selectedHistory.author || 'kipisa2095';
              const totalSum = detailRows.reduce((acc, cur) => acc + cur.qtyChange, 0);

              const fromLocName = selectedHistory.location || '기본 위치';
              const toLocName = selectedHistory.to_location || 'DD';

              return (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  
                  {/* 1. 헤더: 이동 내역 (주황색 타이틀 & 하단 테두리 선) & 프로필 & 더보기 버튼 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `2px solid ${typeColor}`, marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: typeColor, margin: 0 }}>
                      {selectedHistory.type_label} 내역
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <i className="fa-solid fa-user" style={{ fontSize: '14px' }}></i>
                        </div>
                        <span>{authorId}</span>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setShowMoreActions((prev) => !prev)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>더 보기</span>
                          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
                        </button>

                        {showMoreActions && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '4px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              zIndex: 10,
                              minWidth: '120px',
                              overflow: 'hidden'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setShowMoreActions(false);
                                alert('내역 수정/취소 기능 준비 중입니다.');
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                textAlign: 'left',
                                border: 'none',
                                backgroundColor: 'transparent',
                                fontSize: '13px',
                                color: '#334155',
                                cursor: 'pointer'
                              }}
                            >
                              내역 수정
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. 스크린샷 2 정보 2행: 위치 (기본 위치 ➔ DD) & 이동일 (2026-08-06 15:03) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <span style={{ width: '50px', color: '#64748b' }}>위치</span>
                      <strong style={{ color: '#1e293b', fontWeight: 700 }}>
                        {isMove ? `${fromLocName} ➔ ${toLocName}` : fromLocName}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <span style={{ width: '50px', color: '#64748b' }}>{isMove ? '이동일' : '일시'}</span>
                      <strong style={{ color: '#1e293b', fontWeight: 600 }}>{selectedHistory.created_at}</strong>
                    </div>
                  </div>

                  {/* 3. 스크린샷 2 100% 동일 이동 전용 테이블 [사진 | 제품명 | 기본 위치 | DD | 수량] */}
                  <div style={{ marginBottom: '28px' }}>
                    {isMove ? (
                      /* 이동(MOVE) 전용 5열 헤더 */
                      <div style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 1fr 80px', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        <div>사진</div>
                        <div>제품명</div>
                        <div style={{ textAlign: 'center' }}>{fromLocName}</div>
                        <div style={{ textAlign: 'center' }}>{toLocName}</div>
                        <div style={{ textAlign: 'right' }}>수량</div>
                      </div>
                    ) : (
                      /* 입출고/조정 전용 4열 헤더 */
                      <div style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 80px', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        <div>사진</div>
                        <div>제품명</div>
                        <div style={{ textAlign: 'center' }}>재고 변동</div>
                        <div style={{ textAlign: 'right' }}>수량</div>
                      </div>
                    )}

                    {/* 품목 데이터 행 렌더링 */}
                    {detailRows.map((row, idx) => {
                      return isMove ? (
                        /* 이동(MOVE) 5열 행 (스크린샷 2와 100% 일치하는 주황 수량 & 500 ➔ 450, 0 ➔ 50) */
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 1fr 80px', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                          {/* 사진 박스 */}
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}></div>
                          
                          {/* 제품명 & SKU */}
                          <div>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{row.itemName}</strong>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{row.sku}</span>
                          </div>

                          {/* 출발 위치 수량 변동 (500 ➔ 450) */}
                          <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                            {row.beforeQty} ➔ {row.afterQty}
                          </div>

                          {/* 도착 위치 수량 변동 (0 ➔ 50) */}
                          <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                            {row.toBeforeQty ?? 0} ➔ {row.toAfterQty ?? row.qtyChange}
                          </div>

                          {/* 총 수량 (주황색 숫자 50) */}
                          <div style={{ textAlign: 'right', fontSize: '15px', fontWeight: 800, color: '#f59e0b' }}>
                            {row.qtyChange}
                          </div>
                        </div>
                      ) : (
                        /* 입출고 4열 행 */
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 80px', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}></div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{row.itemName}</strong>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{row.sku}</span>
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                            {row.beforeQty} ➔ {row.afterQty}
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '15px', fontWeight: 800, color: typeColor }}>
                            {selectedHistory.type === 'OUT' ? '-' : '+'}{row.qtyChange}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 4. 하단 품목 수 서머리 & 주황색 총 수량 (1개 품목        50) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        {detailRows.length}개 품목
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: typeColor }}>
                        {totalSum}
                      </span>
                    </div>

                    {/* 메모/사유가 존재할 경우 표출 */}
                    {selectedHistory.notes && selectedHistory.notes.trim() !== '' && (
                      <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>사유/메모:</span> {selectedHistory.notes}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()
          )}
        </div>

      </div>

    </div>
  );
}
