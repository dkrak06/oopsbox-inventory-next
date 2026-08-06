/**
 * [ProductForm 컴포넌트]
 * 역할: 신규 제품 등록 및 기존 제품의 상세 정보/속성을 전체 수정하는 박스히어로 스타일 제품 등록/수정 폼입니다.
 * 흐름: initialItem 전달 시 기존 제품 정보(SKU, 제품명, 바코드, 구매가, 판매가, 속성, 위치 재고)를 폼에 로드하고 수정 저장합니다.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { saveItem, updateItem, getStoredAttributes, CustomAttribute, Item } from '@/lib/storage';

// 위치별 재고 데이터 타입 정의
interface LocationStock {
  id: string;
  name: string;
  quantity: number | string;
}

// 입고출고 메뉴와 100% 동일한 커스텀 달력 피커 컴포넌트
function CustomDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const calendarRef = useRef<HTMLDivElement>(null);

  // 외부 영역 클릭 시 달력 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfCurrentMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarCells = [];
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);

  for (let i = firstDayOfCurrentMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: prevMonthIndex,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  const remainingCells = 42 - calendarCells.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: nextMonthIndex,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const handleSelectDay = (cell: { day: number; month: number; year: number }) => {
    const m = String(cell.month + 1).padStart(2, '0');
    const d = String(cell.day).padStart(2, '0');
    const dateStr = `${cell.year}-${m}-${d}`;
    onChange(dateStr);
    setShowCalendar(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${m}-${d}`;
    onChange(dateStr);
    setShowCalendar(false);
  };

  return (
    <div ref={calendarRef} style={{ position: 'relative', flex: 1 }}>
      <div
        onClick={() => setShowCalendar((prev) => !prev)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          fontSize: '14px',
          color: value ? '#0f172a' : '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span>{value || '연도-월-일'}</span>
        <span style={{ color: '#64748b', fontSize: '14px' }}>📅</span>
      </div>

      {showCalendar && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            width: '320px',
            padding: '16px',
            zIndex: 300,
          }}
        >
          {/* 달력 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((prev) => prev - 1);
                } else {
                  setCurrentMonth((prev) => prev - 1);
                }
              }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', padding: '4px 8px' }}
            >
              &lt;
            </button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              {currentYear}년 {currentMonth + 1}월
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((prev) => prev + 1);
                } else {
                  setCurrentMonth((prev) => prev + 1);
                }
              }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', padding: '4px 8px' }}
            >
              &gt;
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
            <span style={{ color: '#ef4444' }}>일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span style={{ color: '#3b82f6' }}>토</span>
          </div>

          {/* 일자 격자 (이미지 1 파란 원형 선택 뱃지 100% 동일) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {calendarCells.map((cell, idx) => {
              const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isSelected = value === cellDateStr;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDay(cell)}
                  style={{
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                      color: isSelected ? '#ffffff' : !cell.isCurrentMonth ? '#cbd5e1' : '#1e293b',
                      fontWeight: isSelected ? 800 : 400,
                    }}
                  >
                    {cell.day}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 이미지 1 하단 오늘 선택 버튼 */}
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleSelectToday}
              style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductForm({
  initialItem,
  onSuccess,
  onEditAttributes,
  isModal = false,
  onCancel,
}: {
  initialItem?: Item | null;
  onSuccess?: () => void;
  onEditAttributes?: () => void;
  isModal?: boolean;
  onCancel?: () => void;
}) {
  // 기본 제품 정보 상태 (수정 모드일 경우 initialItem 값으로 설정, 신규 등록이면 기본값 생성)
  const [sku, setSku] = useState<string>(initialItem?.sku || 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [productName, setProductName] = useState<string>(initialItem?.name || '');
  const [barcode, setBarcode] = useState<string>(initialItem?.barcode || '');
  const [purchasePrice, setPurchasePrice] = useState<number | string>(initialItem?.purchase_price ?? '');
  const [sellingPrice, setSellingPrice] = useState<number | string>(initialItem?.selling_price ?? '');

  // 등록된 속성 전체 목록
  const [allAttributes, setAllAttributes] = useState<CustomAttribute[]>([]);

  // 현재 제품 폼에 표출할 선택된 속성 ID 목록 (고정/선택 구분없이 개별 폼 단위 필드 추가/제거 지원)
  const [activeFormAttrIds, setActiveFormAttrIds] = useState<string[]>([]);

  // 속성별 입력값 저장 상태 ({ [attrId]: value })
  const [dynamicAttrValues, setDynamicAttrValues] = useState<{ [attrId: string]: string }>({
    '카테고리': initialItem?.category || '',
    '브랜드': initialItem?.brand || '',
  });

  // 선택 속성 추가 팝업/드롭다운 상태
  const [isAttrDropdownOpen, setIsAttrDropdownOpen] = useState<boolean>(false);

  // 위치별 수량 배열 상태
  const [locations, setLocations] = useState<LocationStock[]>(
    initialItem?.locations
      ? Object.entries(initialItem.locations).map(([name, quantity]) => ({
          id: Math.random().toString(),
          name,
          quantity,
        }))
      : []
  );

  // 위치 검색 드롭다운 상태
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState<boolean>(false);
  const [locSearchQuery, setLocSearchQuery] = useState<string>('');
  const availableLocationPresets = ['기본 위치', 'DD', 'FFF', 'A창고', 'B창고'];

  // 컴포넌트 마운트 및 initialItem 변경 시 저장소에서 속성 로드 및 폼 데이터 갱신
  useEffect(() => {
    const stored = getStoredAttributes();
    // Soft Delete(is_deleted) 및 노출 꺼짐(is_visible: false) 속성은 등록/수정 폼 노출 목록에서 제외합니다.
    const activeStored = stored.filter((attr) => !attr.is_deleted && attr.is_visible !== false);
    setAllAttributes(activeStored);

    const attrVals: { [attrId: string]: string } = {};

    if (initialItem) {
      setSku(initialItem.sku || '');
      setProductName(initialItem.name || '');
      setBarcode(initialItem.barcode || '');
      setPurchasePrice(initialItem.purchase_price ?? '');
      setSellingPrice(initialItem.selling_price ?? '');

      // 기존 속성 데이터 복원 (동일한 이름을 가진 속성도 ID 기반으로 각각 상이하게 매핑)
      stored.forEach((attr) => {
        let val = '';
        if (initialItem.attributes) {
          val = initialItem.attributes[attr.id] || initialItem.attributes[attr.name] || '';
        }
        if (!val) {
          if (attr.name === '카테고리') val = initialItem.category || '';
          if (attr.name === '브랜드') val = initialItem.brand || '';
          if (attr.name === '주 거래처') val = initialItem.partner || '';
        }
        if (val) {
          attrVals[attr.id] = val;
        }
      });

      setDynamicAttrValues(attrVals);

      // 위치별 수량 로드
      if (initialItem.locations) {
        const locs: LocationStock[] = Object.entries(initialItem.locations).map(([name, qty]) => ({
          id: Math.random().toString(),
          name,
          quantity: qty,
        }));
        setLocations(locs);
      }
    }

    // 폼 초기 활성 속성 ID 설정 (고정 속성 + 기존 입력값이 존재하는 속성)
    const initialActiveIds: string[] = [];
    activeStored.forEach((attr) => {
      if (attr.mode === '고정' || (initialItem && attrVals[attr.id])) {
        initialActiveIds.push(attr.id);
      }
    });
    setActiveFormAttrIds(initialActiveIds);
  }, [initialItem]);

  // 동적 속성 값 변경 핸들러 (오직 고유한 attrId만을 Key로 다루어 중복 이름 동시 반응 버그 완벽 방지)
  const handleAttrValueChange = (attrId: string, val: string) => {
    setDynamicAttrValues((prev) => ({
      ...prev,
      [attrId]: val,
    }));
  };

  // 속성 항목 폼에 추가 함수 (제거했던 고정 속성 및 미사용 선택 속성 모두 재추가 가능)
  const handleAddFormAttr = (attrId: string) => {
    if (!activeFormAttrIds.includes(attrId)) {
      setActiveFormAttrIds((prev) => [...prev, attrId]);
    }
    setIsAttrDropdownOpen(false);
  };

  // 개별 속성 폼에서 제거 함수 (고정/선택 구분 없이 개별 제품 폼 단위 제거 지원)
  const handleRemoveFormAttr = (attrId: string) => {
    setActiveFormAttrIds((prev) => prev.filter((id) => id !== attrId));
    setDynamicAttrValues((prev) => {
      const next = { ...prev };
      delete next[attrId];
      return next;
    });
  };

  // 위치 선택 추가 처리 함수
  const handleSelectLocation = (locName: string) => {
    if (locations.some((loc) => loc.name === locName)) {
      alert(`'${locName}'은(는) 이미 추가된 위치입니다.`);
      return;
    }
    const newLoc: LocationStock = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: locName,
      quantity: '',
    };
    setLocations((prev) => [...prev, newLoc]);
    setIsLocDropdownOpen(false);
    setLocSearchQuery('');
  };

  // SKU 자동 생성 함수
  const generateSku = () => {
    const randomCode = 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setSku(randomCode);
  };

  // 바코드 자동 생성 함수
  const generateBarcode = () => {
    const randomBarcode = '880' + Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(randomBarcode);
  };

  // 동적 바코드 속성 자동 생성 함수
  const generateAttrBarcode = (attrId: string) => {
    const randomBc = '880' + Math.floor(100000000 + Math.random() * 900000000);
    handleAttrValueChange(attrId, randomBc);
  };

  // 위치별 수량 변경 함수
  const handleQuantityChange = (id: string, newQty: number | string) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, quantity: newQty } : loc))
    );
  };

  // 특정 위치 제거 함수
  const handleRemoveLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  // 폼 제출 이벤트 핸들러 (수정 모드이면 updateItem, 신규 모드이면 saveItem 수행)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const locMap: { [key: string]: number } = {};
    let totalQty = 0;
    locations.forEach((loc) => {
      const parsedQty = typeof loc.quantity === 'number' ? loc.quantity : Number(loc.quantity) || 0;
      locMap[loc.name] = parsedQty;
      totalQty += parsedQty;
    });

    const pPrice = typeof purchasePrice === 'number' ? purchasePrice : Number(purchasePrice) || 0;
    const sPrice = typeof sellingPrice === 'number' ? sellingPrice : Number(sellingPrice) || 0;

    // 전체 동적 속성 맵 구성 (현재 폼에 활성화되어 포함된 activeFormAttrIds 속성만 저장)
    const attributesObj: { [key: string]: string } = {};
    let categoryVal = '';
    let brandVal = '';
    let partnerVal = '';

    allAttributes.forEach((attr) => {
      // 폼에서 ✕ 버튼으로 제외된 속성은 수집에서 빠져 DB 레코드가 삭제 처리됩니다.
      if (activeFormAttrIds.includes(attr.id)) {
        const val = dynamicAttrValues[attr.id] || '';
        attributesObj[attr.id] = val;
        attributesObj[attr.name] = val; // 하위 호환성 유지용 이름 키 병행
        if (attr.name === '카테고리') categoryVal = val;
        if (attr.name === '브랜드') brandVal = val;
        if (attr.name === '주 거래처') partnerVal = val;
      }
    });

    const itemPayload = {
      sku,
      name: productName,
      barcode,
      category: categoryVal,
      brand: brandVal,
      partner: partnerVal,
      purchase_price: pPrice,
      selling_price: sPrice,
      locations: locMap,
      total_quantity: totalQty,
      attributes: attributesObj,
    };

    if (initialItem) {
      // 1. 기존 제품 수정 처리
      updateItem(initialItem.id, itemPayload);
      alert(`'${productName}' 제품 정보가 성공적으로 수정되었습니다!`);
    } else {
      // 2. 신규 제품 추가 처리
      saveItem(itemPayload);
      alert(`'${productName}' 제품이 성공적으로 등록되었습니다!`);
    }

    if (onSuccess) onSuccess();
  };

  // 폼 초기화 함수
  const handleReset = () => {
    generateSku();
    setProductName('');
    setBarcode('');
    setDynamicAttrValues({});
    setActiveFormAttrIds(allAttributes.filter((attr) => attr.mode === '고정').map((a) => a.id));
    setPurchasePrice('');
    setSellingPrice('');
    setLocations([]);
    setIsLocDropdownOpen(false);
    setLocSearchQuery('');
  };

  // 현재 제품 폼에 포함되어 표출되는 속성 목록
  const visibleAttributes = allAttributes.filter((attr) => activeFormAttrIds.includes(attr.id));

  // 현재 폼에 포함되지 않은 추가 가능 속성 목록 (제거한 고정 속성 + 미사용 선택 속성 모두 포함)
  const availableAddAttributes = allAttributes.filter((attr) => !activeFormAttrIds.includes(attr.id));

  return (
    <div
      className="boxhero-style-form product-add-container"
      style={{
        padding: isModal ? '0px' : '24px 32px',
        maxWidth: isModal ? '100%' : '960px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 일반 페이지일 때만 서브 타이틀 및 메인 폼 헤더 표시 (모달일 때는 이중 헤더 방지를 위해 숨김) */}
      {!isModal && (
        <header className="form-header" style={{ marginBottom: '24px' }}>
          <span className="sub-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>제품목록 &gt; {initialItem ? '제품 수정' : '제품 추가'}</span>
          <div className="title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <h1 className="main-title" style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {initialItem ? '제품 수정' : '제품 추가'}
            </h1>
            <button type="button" className="btn-text" onClick={handleReset} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
              초기화
            </button>
          </div>
        </header>
      )}

      <form onSubmit={handleSubmit}>
        {/* ==================================================================== */}
        {/* 섹션 1: 제품 정보 (히어로 박스 스타일 - 좌측 라벨 수평 옆 배치) */}
        {/* ==================================================================== */}
        <section className="form-section" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '28px', marginBottom: '28px' }}>
          <h2 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>제품 정보</h2>
          
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* 좌측: 수평 라벨 폼 필드 컬럼 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: SKU */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  SKU<span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ color: '#0d9488', fontSize: '12px', cursor: 'pointer', borderRadius: '50%', border: '1px solid #cbd5e1', width: '15px', height: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>?</span>
                </label>
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    style={{ padding: '0 16px', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    자동 생성
                  </button>
                </div>
              </div>

              {/* Row 2: 제품명 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  제품명<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="제품명"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 3: 바코드 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  바코드
                </label>
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="바코드가 없어도 자동 생성할 수 있습니다."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    style={{ padding: '0 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
                    title="바코드 스캔"
                  >
                    🔲
                  </button>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    style={{ padding: '0 16px', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    자동 생성
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 이미지 업로드 박스 */}
            <div style={{ width: '100px', height: '100px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #cbd5e1' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} />
                <span style={{ fontSize: '24px', color: '#64748b' }}>📷</span>
              </label>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 섹션 2: 제품 속성 (입고출고 메뉴와 100% 동일한 커스텀 달력 연동) */}
        {/* ==================================================================== */}
        <section className="form-section" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>제품 속성</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #cbd5e1', color: '#0d9488', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>?</span>
            </div>
            {onEditAttributes && (
              <button
                type="button"
                onClick={onEditAttributes}
                style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                제품 속성 편집 <span style={{ fontSize: '10px' }}>&gt;</span>
              </button>
            )}
          </div>

          {/* 속성 목록 - 좌측 라벨 수평 옆 배치 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {visibleAttributes.map((attr) => {
              const currentVal = dynamicAttrValues[attr.id] || '';
              return (
                <div key={attr.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {/* 좌측 라벨 영역 (150px 고정 폭) */}
                  <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                    {attr.name}
                    {attr.mode === '선택' && (
                      <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500, marginLeft: '4px' }}>(선택)</span>
                    )}
                  </label>

                  {/* 우측 입력 필드 영역 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 1. 텍스트 종류 */}
                    {attr.type === '텍스트' && (
                      <input
                        type="text"
                        className="form-input"
                        placeholder="텍스트 입력"
                        value={currentVal}
                        onChange={(e) => handleAttrValueChange(attr.id, e.target.value)}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      />
                    )}

                    {/* 2. 숫자 종류 (숫자 전용 + 스피너 화살표 활성화) */}
                    {attr.type === '숫자' && (
                      <input
                        type="number"
                        className="form-input"
                        placeholder="숫자 입력"
                        value={currentVal}
                        onChange={(e) => handleAttrValueChange(attr.id, e.target.value)}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', appearance: 'auto' }}
                      />
                    )}

                    {/* 3. 날짜 종류 (입고출고 메뉴와 100% 동일한 커스텀 달력 연동) */}
                    {attr.type === '날짜' && (
                      <CustomDatePicker
                        value={currentVal}
                        onChange={(dateStr) => handleAttrValueChange(attr.id, dateStr)}
                      />
                    )}

                    {/* 4. 바코드 종류 */}
                    {attr.type === '바코드' && (
                      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="바코드 입력"
                          value={currentVal}
                          onChange={(e) => handleAttrValueChange(attr.id, e.target.value)}
                          style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                        <button
                          type="button"
                          onClick={() => generateAttrBarcode(attr.id)}
                          style={{ padding: '0 16px', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          자동 생성
                        </button>
                      </div>
                    )}

                  {/* 5. 파일 종류 */}
                  {attr.type === '파일' && (
                    <div style={{ width: '64px', height: '64px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' }}>
                      <span style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 300 }}>+</span>
                    </div>
                  )}

                  {/* 개별 필드 제거 (✕) 버튼 (고정/선택 구분 없이 개별 폼 단위 필드 제거) */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFormAttr(attr.id)}
                    style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', padding: '0 4px' }}
                    title="폼에서 이 속성 필드 제거"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          </div>

          {/* 속성 추가 버튼 드롭다운 (제거했던 고정 속성 + 미사용 선택 속성 목록) */}
          {availableAddAttributes.length > 0 && (
            <div style={{ marginTop: '16px', marginLeft: '150px', position: 'relative', maxWidth: '300px' }}>
              <button
                type="button"
                onClick={() => setIsAttrDropdownOpen((prev) => !prev)}
                style={{ border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>+ 속성 추가</span>
                <span style={{ fontSize: '10px' }}>{isAttrDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {isAttrDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)', zIndex: 200, overflow: 'hidden' }}>
                  {availableAddAttributes.map((attr) => (
                    <div
                      key={attr.id}
                      onClick={() => handleAddFormAttr(attr.id)}
                      style={{ padding: '10px 14px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ fontWeight: 600 }}>{attr.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>({attr.type} · {attr.mode})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* 섹션 3: 가격 정보 */}
        {/* ==================================================================== */}
        <section className="form-section" style={{ borderBottom: isModal ? 'none' : '1px solid #f1f5f9', paddingBottom: '28px', marginBottom: isModal ? '0' : '28px' }}>
          <h2 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>가격 정보</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 구매가 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                구매가
              </label>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', backgroundColor: '#ffffff' }}>
                <span style={{ color: '#64748b', fontSize: '14px', marginRight: '8px' }}>₩</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPurchasePrice(val === '' ? '' : Math.max(0, Number(val)));
                  }}
                  style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a' }}
                />
              </div>
            </div>

            {/* 판매가 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '150px', minWidth: '150px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                판매가
              </label>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', backgroundColor: '#ffffff' }}>
                <span style={{ color: '#64748b', fontSize: '14px', marginRight: '8px' }}>₩</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSellingPrice(val === '' ? '' : Math.max(0, Number(val)));
                  }}
                  style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 섹션 4: 초기 수량 (일반 제품 추가 페이지에서만 표시, 모달일 때는 숨김) */}
        {/* ==================================================================== */}
        {!isModal && (
          <section className="form-section">
            <h2 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>초기 수량</h2>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>위치</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>수량</span>
              </div>
            </div>

            {locations.map((loc) => (
              <div key={loc.id} style={{ display: 'flex', gap: '16px', marginBottom: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#0f172a', padding: '10px 12px' }}>
                    {loc.name}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    style={{ width: '50%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}
                    value={loc.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleQuantityChange(loc.id, val === '' ? '' : Math.max(0, Number(val)));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc.id)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', width: '38px', height: '38px', fontSize: '14px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="위치 삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '6px', position: 'relative', maxWidth: '300px' }}>
              <div
                onClick={() => setIsLocDropdownOpen((prev) => !prev)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>+</span>
                  <span>위치 검색</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{isLocDropdownOpen ? '▲' : '▼'}</span>
              </div>

              {isLocDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      type="text"
                      placeholder="위치 이름 검색..."
                      value={locSearchQuery}
                      onChange={(e) => setLocSearchQuery(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px', width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                    {availableLocationPresets
                      .filter((name) => name.toLowerCase().includes(locSearchQuery.toLowerCase()))
                      .map((presetName) => {
                        const isAdded = locations.some((loc) => loc.name === presetName);
                        return (
                          <div
                            key={presetName}
                            onClick={() => !isAdded && handleSelectLocation(presetName)}
                            style={{ padding: '10px 16px', fontSize: '14px', color: isAdded ? '#94a3b8' : '#1e293b', backgroundColor: isAdded ? '#f8fafc' : 'transparent', cursor: isAdded ? 'default' : 'pointer', fontWeight: isAdded ? 400 : 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span>{presetName}</span>
                            {isAdded && <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700 }}>추가됨</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 폼 하단 제출 버튼 영역 */}
        <footer style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: isModal ? 'flex-end' : 'flex-start' }}>
          <button
            type="submit"
            style={{
              padding: '10px 28px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            저장
          </button>
          <button
            type="button"
            onClick={onCancel || handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </footer>
      </form>
    </div>
  );
}
