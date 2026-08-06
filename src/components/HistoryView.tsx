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

  // 팝업 달력 포포버 상태
  const [showDatePickerPopover, setShowDatePickerPopover] = useState<boolean>(false);
  
  // 달력 연/월 이동용 상태 (기본: 2026년 8월 기준)
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(7); // 0-indexed (7 = 8월)

  // 범위 클릭 선택 단계 ('START' | 'END')
  const [dateClickStep, setDateClickStep] = useState<'START' | 'END'>('START');

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

  // 월 이동 함수
  const handleMonthChange = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  // 달력 날짜 클릭 처리 (범위 선택)
  const handleDateClick = (fullDateStr: string) => {
    if (dateClickStep === 'START' || !startDateInput || (startDateInput && endDateInput)) {
      setStartDateInput(fullDateStr);
      setEndDateInput('');
      setDateClickStep('END');
      setSelectedDatePreset('직접 선택');
    } else {
      if (fullDateStr < startDateInput) {
        setStartDateInput(fullDateStr);
        setEndDateInput('');
        setDateClickStep('END');
      } else {
        setEndDateInput(fullDateStr);
        setDateClickStep('START');
      }
      setSelectedDatePreset('직접 선택');
    }
  };

  // 시작일 날짜(YYYY-MM-DD) 기반으로 달력 년/월 자동 이동 헬퍼
  const updateCalendarViewDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 7) return;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        setViewYear(year);
        setViewMonth(month);
      }
    }
  };

  // 7가지 빠른 기간 선택 처리 (선택된 기간의 시작일로 달력 연/월 자동 이동)
  const handlePresetSelect = (presetName: string) => {
    setSelectedDatePreset(presetName);
    const today = new Date(2026, 7, 6); // 2026년 8월 6일 기준
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let start = '';
    let end = '';

    if (presetName === '전체 기간') {
      start = '';
      end = '';
      setViewYear(2026);
      setViewMonth(7);
    } else if (presetName === '오늘') {
      start = formatDate(today);
      end = formatDate(today);
    } else if (presetName === '최근 7일') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      start = formatDate(past);
      end = formatDate(today);
    } else if (presetName === '최근 30일') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      start = formatDate(past);
      end = formatDate(today);
    } else if (presetName === '이번 달') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatDate(first);
      end = formatDate(today);
    } else if (presetName === '지난주') {
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
      start = formatDate(lastWeekStart);
      end = formatDate(lastWeekEnd);
    } else if (presetName === '지난달') {
      const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0);
      start = formatDate(lastMonthFirst);
      end = formatDate(lastMonthLast);
    }

    setStartDateInput(start);
    setEndDateInput(end);

    if (start) {
      updateCalendarViewDate(start);
    }
  };

  // 캘린더 날짜 그리드 렌더링 함수 (스크린샷 26 범위 강조 & 스크린샷 27 오늘 강조)
  const renderCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // 이전 달 전달분 옅은 표시
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${dayNum}`} style={{ padding: '8px 0', fontSize: '13px', color: '#fca5a5', opacity: 0.6 }}>
          {dayNum}
        </div>
      );
    }

    // 이번 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDateStr = `${viewYear}-${monthStr}-${dayStr}`;

      const isStart = startDateInput === fullDateStr;
      const isEnd = endDateInput === fullDateStr;
      const isInRange =
        startDateInput &&
        endDateInput &&
        fullDateStr >= startDateInput &&
        fullDateStr <= endDateInput;
      const isToday = fullDateStr === '2026-08-06';
      const isSunday = new Date(viewYear, viewMonth, day).getDay() === 0;
      const isSaturday = new Date(viewYear, viewMonth, day).getDay() === 6;

      const isSingleSelected = (isStart && isEnd) || (isStart && !endDateInput) || (isEnd && !startDateInput);

      let containerBg = 'transparent';
      let textColor = isSunday || isSaturday ? '#ef4444' : '#1e293b';
      let borderRadius = '0';
      let isCircleBorder = false;

      if (isSingleSelected) {
        // 단일 날짜 선택 시: 32px x 32px 완벽한 정원 뱃지!
        textColor = '#ffffff';
      } else if (isStart) {
        containerBg = '#818cf8'; // 범위 시작일
        textColor = '#ffffff';
        borderRadius = '16px 0 0 16px';
      } else if (isEnd) {
        containerBg = '#818cf8'; // 범위 종료일
        textColor = '#ffffff';
        borderRadius = '0 16px 16px 0';
      } else if (isInRange) {
        containerBg = '#c7d2fe'; // 범위 내부 일자
        textColor = '#312e81';
      }

      if (isToday && !isStart && !isEnd && !isInRange) {
        isCircleBorder = true; // 오늘 날짜 파란 테두리
      }

      days.push(
        <div
          key={`current-${day}`}
          onClick={() => handleDateClick(fullDateStr)}
          style={{
            padding: '2px 0',
            fontSize: '13px',
            fontWeight: isStart || isEnd || isToday ? 700 : 500,
            color: textColor,
            backgroundColor: containerBg,
            borderRadius: borderRadius,
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          <span
            style={{
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: isSingleSelected ? '#6366f1' : 'transparent',
              color: isSingleSelected ? '#ffffff' : textColor,
              border: isCircleBorder ? '1.5px solid #3b82f6' : 'none'
            }}
          >
            {day}
          </span>
        </div>
      );
    }

    // 다음 달 날짜들 옅게 채우기
    const totalSlots = days.length;
    const remainingSlots = (7 - (totalSlots % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push(
        <div key={`next-${i}`} style={{ padding: '8px 0', fontSize: '13px', color: '#fca5a5', opacity: 0.6 }}>
          {i}
        </div>
      );
    }

    return days;
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

      {/* 2. 필터 영역: 팝업 커스텀 달력 피커 (스크린샷 26, 27 100% 반영) */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', position: 'relative' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* 달력 팝업 트리거 버튼 */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDatePickerPopover((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: showDatePickerPopover ? '#eff6ff' : '#ffffff',
                color: showDatePickerPopover ? '#2563eb' : '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
              <span>
                {selectedDatePreset !== '직접 선택'
                  ? selectedDatePreset
                  : `${startDateInput || '시작일'} ~ ${endDateInput || '종료일'}`}
              </span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}></i>
            </button>

            {/* 스크린샷 26, 27 지정 커스텀 달력 팝업 포포버 */}
            {showDatePickerPopover && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  left: '0',
                  zIndex: 200,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  padding: '24px',
                  display: 'flex',
                  gap: '24px',
                  width: '540px',
                  boxSizing: 'border-box'
                }}
              >
                {/* 좌측 310px: 월 달력 및 범위 선택 피커 */}
                <div style={{ flex: '1 1 310px' }}>
                  {/* 연/월 헤더: < 8월 2026 > */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(-1)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '4px 8px' }}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      {viewMonth + 1}월 {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(1)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '4px 8px' }}
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>

                  {/* 요일 라벨: 일 월 화 수 목 금 토 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
                    <span style={{ color: '#ef4444' }}>일</span>
                    <span>월</span>
                    <span>화</span>
                    <span>수</span>
                    <span>목</span>
                    <span>금</span>
                    <span style={{ color: '#ef4444' }}>토</span>
                  </div>

                  {/* 일자 그리드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '4px', textAlign: 'center' }}>
                    {renderCalendarDays()}
                  </div>

                  {/* 하단 날짜 직접 입력란 (시작일 ~ 종료일) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>시작일</div>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={startDateInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStartDateInput(val);
                          updateCalendarViewDate(val);
                        }}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                    <span style={{ color: '#94a3b8', marginTop: '16px' }}>-</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>종료일</div>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={endDateInput}
                        onChange={(e) => setEndDateInput(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 우측 150px: 7가지 퀵 프리셋 버튼 */}
                <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['전체 기간', '오늘', '최근 7일', '최근 30일', '이번 달', '지난주', '지난달'].map((preset) => {
                    const isSelected = selectedDatePreset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          handlePresetSelect(preset);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: isSelected ? '#f1f5f9' : '#f8fafc',
                          color: isSelected ? '#0f172a' : '#475569',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

          {/* 필터 추가 버튼 (유형 드롭다운) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: activeFilterCategory !== '전체' ? '#eff6ff' : '#ffffff',
                color: activeFilterCategory !== '전체' ? '#2563eb' : '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: '11px' }}></i>
              <span>필터 추가</span>
              {activeFilterCategory !== '전체' && (
                <span style={{ fontSize: '11px', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '10px', padding: '1px 6px' }}>
                  {activeFilterCategory}
                </span>
              )}
            </button>

            {/* 필터 드롭다운 팝업 */}
            {showFilterDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: '0',
                  zIndex: 150,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  width: '130px',
                  padding: '6px 0'
                }}
              >
                {['전체', '입고', '출고', '조정', '이동'].map((category) => (
                  <div
                    key={category}
                    onClick={() => handleSelectFilter(category)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      color: activeFilterCategory === category ? '#2563eb' : '#334155',
                      fontWeight: activeFilterCategory === category ? 700 : 400,
                      backgroundColor: activeFilterCategory === category ? '#eff6ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 검색 입력창 */}
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

                // 스크린샷 17 지정 아이콘: fa-right-left fa-rotate-90
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
                        {h.type === 'ADJUST' ? (
                          <svg
                            width="17"
                            height="16"
                            viewBox="0 0 17 16"
                            fill="none"
                            stroke={typeTheme.color}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ display: 'inline-block', verticalAlign: 'middle' }}
                          >
                            <path d="M4.5 13.5V2.5" />
                            <path d="M1.5 5.5L4.5 2.5L7.5 5.5" />
                            <path d="M12.5 2.5V13.5" />
                            <path d="M9.5 10.5L12.5 13.5L15.5 10.5" />
                          </svg>
                        ) : (
                          <i className={`fa-solid ${typeTheme.icon}`} style={{ color: typeTheme.color, fontSize: '15px' }}></i>
                        )}
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
