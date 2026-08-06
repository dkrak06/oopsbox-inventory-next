/**
 * [ItemList 컴포넌트]
 * 역할: 한눈에 보는 2단 마스터-디테일 제품 관리 화면입니다.
 * 흐름:
 * 1. 우측 상세 패널에서 바로 [입고|출고|조정|이동] 4개 퀵 액션 버튼 및 위치별 뱃지 클릭 팝업 지원
 * 2. 상단 '모든 위치' 셀렉트 필터 연동 (기본위치, DD, FFF 등 위치별 필터링)
 * 3. '묶어보기' 커스텀 드롭다운 팝업 연동 (없음, 제품명, 바코드, 구매가, 판매가, 카테고리, 브랜드 그룹핑)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredItems, deleteItem, updateItem, Item } from '@/lib/storage';

interface ItemListProps {
  onAddNew: () => void;
  onNavigate?: (path: string, item?: Item, loc?: string, partner?: string) => void;
  onSelectProduct?: (item: Item) => void;
}

export default function ItemList({ onAddNew, onNavigate, onSelectProduct }: ItemListProps) {
  // 제품 목록 상태
  const [items, setItems] = useState<Item[]>([]);
  // 선택된 제품 ID 상태
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 위치 필터 상태 (스크린샷 2 연동)
  const [locationFilter, setLocationFilter] = useState<string>('all');
  // 묶어보기 그룹핑 기준 상태 (스크린샷 3 연동)
  const [groupBy, setGroupBy] = useState<string>('none');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);

  // 재고 보유만 보기 체크 상태
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  // 제품 추가 드롭다운 토글 상태
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState<boolean>(false);

  // 위치 퀵 액션 모달 제어 상태 (스크린샷 2 연동)
  const [activeLocModal, setActiveLocModal] = useState<{ locName: string; qty: number } | null>(null);

  // 제품 수정 모달 제어 상태 (스크린샷 피드백 구현)
  const [showProductEditModal, setShowProductEditModal] = useState<boolean>(false);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editItemSku, setEditItemSku] = useState<string>('');
  const [editItemBarcode, setEditItemBarcode] = useState<string>('');
  const [editItemCategory, setEditItemCategory] = useState<string>('');
  const [editItemBrand, setEditItemBrand] = useState<string>('');
  const [editItemPurchasePrice, setEditItemPurchasePrice] = useState<number | string>('');
  const [editItemSellingPrice, setEditItemSellingPrice] = useState<number | string>('');
  const [editItemPartner, setEditItemPartner] = useState<string>('');

  // 마운트 시 저장소에서 제품 데이터 로드 (강제 고정 선택 제거)
  const loadData = () => {
    const loaded = getStoredItems();
    setItems(loaded);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 외부 영역 클릭 시 드롭다운 팝업 자동 닫힘 이펙트 (제품추가 & 묶어보기)
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-add-dropdown-wrapper')) {
        setIsAddDropdownOpen(false);
      }
      if (!target.closest('.group-by-dropdown-wrapper')) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 저장된 모든 위치 목록 수집 (스크린샷 2 연동: 모든 위치, 기본 위치, DD, FFF 등)
  const availableLocations = Array.from(
    new Set([
      '기본 위치',
      'DD',
      'FFF',
      ...items.flatMap((item) => (item.locations ? Object.keys(item.locations) : [])),
    ])
  );

  // 정렬 오름차순/내림차순 상태 (기본 ASC: 오름차순 가나다순)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // 위치 필터링 및 검색어, 재고 보유 필터링 로직
  const filteredItems = items
    .filter((item) => {
      // 1. 검색어 필터
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.includes(searchQuery);

      // 2. 재고 보유 필터
      const matchesStock = inStockOnly ? item.total_quantity > 0 : true;

      // 3. 위치 필터 (스크린샷 2)
      let matchesLocation = true;
      if (locationFilter !== 'all') {
        matchesLocation =
          item.locations && item.locations[locationFilter] !== undefined
            ? item.locations[locationFilter] > 0
            : locationFilter === '기본 위치' && item.total_quantity > 0;
      }

      return matchesSearch && matchesStock && matchesLocation;
    })
    .sort((a, b) => {
      // 오름차순(ASC: 가나다순/A-Z) vs 내림차순(DESC: 다나가순/Z-A) 정렬
      if (sortOrder === 'ASC') {
        return a.name.localeCompare(b.name, 'ko');
      } else {
        return b.name.localeCompare(a.name, 'ko');
      }
    });

  // 전체 총 재고 수량 계산
  const totalStockSum = filteredItems.reduce((acc, cur) => acc + cur.total_quantity, 0);

  // 선택된 제품 객체 가져오기 (유저가 선택하지 않았을 경우 null)
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // 제품 수정 모달 오픈 핸들러
  const handleOpenProductEdit = (item: Item) => {
    setEditItemName(item.name || '');
    setEditItemSku(item.sku || '');
    setEditItemBarcode(item.barcode || '');
    setEditItemCategory(item.category || '');
    setEditItemBrand(item.brand || '');
    setEditItemPurchasePrice(item.purchase_price ?? '');
    setEditItemSellingPrice(item.selling_price ?? '');
    setEditItemPartner(item.partner || '(주)영웅유통');
    setShowProductEditModal(true);
  };

  // 제품 수정 완료 제출 처리 핸들러
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!editItemName.trim()) {
      alert('제품명을 입력해 주세요.');
      return;
    }

    const pPrice = typeof editItemPurchasePrice === 'number' ? editItemPurchasePrice : Number(editItemPurchasePrice) || 0;
    const sPrice = typeof editItemSellingPrice === 'number' ? editItemSellingPrice : Number(editItemSellingPrice) || 0;

    const updated = updateItem(selectedItem.id, {
      name: editItemName.trim(),
      sku: editItemSku.trim(),
      barcode: editItemBarcode.trim(),
      category: editItemCategory.trim(),
      brand: editItemBrand.trim(),
      purchase_price: pPrice,
      selling_price: sPrice,
      partner: editItemPartner.trim(),
    });

    setItems(updated);
    setShowProductEditModal(false);
    alert(`'${editItemName.trim()}' 제품 정보가 수정되었습니다!`);
  };

  // 제품 삭제 핸들러
  const handleDelete = (id: string, name: string) => {
    if (confirm(`'${name}' 제품을 삭제하시겠습니까?`)) {
      deleteItem(id);
      alert('삭제되었습니다.');
      const updated = getStoredItems();
      setItems(updated);
      setSelectedItemId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // 퀵 액션 이동 핸들러 ([입고 | 출고 | 조정 | 이동])
  // 우측 퀵 바 버튼 클릭 시 → 제품 + 거래처 전달
  const handleQuickAction = (actionType: string) => {
    const pathMap: { [key: string]: string } = {
      IN: 'stock-in',
      OUT: 'stock-out',
      ADJUST: 'stock-adjust',
      MOVE: 'stock-move',
    };
    const targetPath = pathMap[actionType] || 'stock-in';
    // 선택 제품의 첫 번째 위치 또는 '기본 위치'를 기본 위치로 자동 추출
    const autoLoc = selectedItem?.locations && Object.keys(selectedItem.locations).length > 0
      ? Object.keys(selectedItem.locations)[0]
      : '기본 위치';
    const autoPartner = selectedItem?.partner || undefined;
    if (onNavigate) {
      onNavigate(targetPath, selectedItem || undefined, autoLoc, autoPartner);
    } else {
      alert(`[${actionType}] 입출고 이동 화면으로 연동됩니다.`);
    }
  };

  // 위치 뱃지 팝업 내 [입고|출고|조정|이동] 버튼 클릭 시 → 클릭한 위치명 + 거래처 전달
  const handleLocModalAction = (actionType: string) => {
    const pathMap: { [key: string]: string } = {
      IN: 'stock-in',
      OUT: 'stock-out',
      ADJUST: 'stock-adjust',
      MOVE: 'stock-move',
    };
    const targetPath = pathMap[actionType] || 'stock-in';
    const loc = activeLocModal?.locName || '기본 위치';
    const autoPartner = selectedItem?.partner || undefined;
    setActiveLocModal(null);
    if (onNavigate) {
      onNavigate(targetPath, selectedItem || undefined, loc, autoPartner);
    } else {
      alert(`[${actionType}] ${loc} 위치에서 연동됩니다.`);
    }
  };

  // 묶어보기 라벨 매핑 (스크린샷 3)
  const groupLabelMap: { [key: string]: string } = {
    none: '없음(전체 보기)',
    name: '제품명',
    barcode: '바코드',
    purchase_price: '구매가',
    selling_price: '판매가',
    category: '카테고리',
    brand: '브랜드',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '60px' }}>
      {/* 1. 상단 타이틀 및 제품 추가 / 데이터 관리 버튼 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>제품목록</h1>
          <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
        </div>

        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          {/* 분할 드롭다운 버튼: + 제품 추가 (외부 클릭 감지 래퍼) */}
          <div className="product-add-dropdown-wrapper" style={{ display: 'flex', position: 'relative' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAddNew}
              style={{ borderRadius: '6px 0 0 6px', padding: '10px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              + 제품 추가
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddDropdownOpen((prev) => !prev)}
              style={{ borderRadius: '0 6px 6px 0', padding: '10px 10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderLeft: '1px solid #1d4ed8', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }}></i>
            </button>

            {/* 제품 추가 드롭다운 팝업 */}
            {isAddDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, width: '180px', padding: '6px 0' }}>
                <div style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setIsAddDropdownOpen(false); onAddNew(); }} className="search-item-hover">
                  <i className="fa-solid fa-plus"></i> 단일 제품 추가
                </div>
                <div style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setIsAddDropdownOpen(false); onAddNew(); }} className="search-item-hover">
                  <i className="fa-solid fa-boxes-stacked"></i> 묶음 제품 추가
                </div>
                <div style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setIsAddDropdownOpen(false); alert('옵션 일괄 추가 기능 준비 중'); }} className="search-item-hover">
                  <i className="fa-solid fa-list-check"></i> 옵션 일괄 추가
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px' }}
            onClick={() => onNavigate ? onNavigate('partners') : alert('데이터 관리 화면으로 이동합니다.')}
          >
            <i className="fa-solid fa-database"></i> 데이터 관리
          </button>
        </div>
      </div>

      {/* 2. 검색 및 위치 필터 바 (스크린샷 2 구현: 동적 모든 위치 필터 셀렉트) */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        {/* 모든 위치 셀렉트 드롭다운 (스크린샷 2 100% 반영) */}
        <select
          className="form-input"
          style={{ width: '160px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', fontWeight: 600 }}
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="all">모든 위치</option>
          {availableLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* 검색창 */}
        <div style={{ flex: 1, position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', fontSize: '13px' }}
            placeholder="이름, 바코드, 속성 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 바코드 스캐너 버튼 */}
        <button className="btn" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', height: '40px', padding: '0 14px', borderRadius: '8px', cursor: 'pointer' }} title="바코드 스캔">
          <i className="fa-solid fa-barcode" style={{ fontSize: '18px', color: '#475569' }}></i>
        </button>

        {/* 재고 보유 체크박스 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} /> 재고 보유
        </label>
      </div>

      {/* 3. 2열 마스터-디테일 본문 영역 (스크린샷 1, 3 한눈에 보는 레이아웃) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* 좌측: 제품 목록 카드 패널 */}
        <div>
          {/* 묶어보기 커스텀 드롭다운 행 (스크린샷 3 100% 반영) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="group-by-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>묶어보기</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px', color: '#64748b' }}></i>
              </button>

              {/* 묶어보기 드롭다운 팝업 (스크린샷 3 동일) */}
              {isGroupDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '200px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                    zIndex: 200,
                    padding: '8px 0',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '6px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>묶어보기</div>
                  {Object.entries(groupLabelMap).map(([key, label]) => {
                    const isSelected = groupBy === key;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setGroupBy(key);
                          setIsGroupDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          color: isSelected ? '#3b82f6' : '#1e293b',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        className="search-item-hover"
                      >
                        <span style={{ width: '14px' }}>{isSelected ? '✓' : ''}</span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 오름차순/내림차순 정렬 토글 버튼 */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
              style={{
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title={sortOrder === 'ASC' ? '현재 오름차순 (가나다순) - 클릭 시 내림차순 전환' : '현재 내림차순 (다나가순) - 클릭 시 오름차순 전환'}
            >
              <i className={`fa-solid ${sortOrder === 'ASC' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'}`} style={{ fontSize: '13px' }}></i>
              <span>{sortOrder === 'ASC' ? '오름차순' : '내림차순'}</span>
            </button>
          </div>

          {/* 품목 요약 바 */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '12px' }}>
            <span>{filteredItems.length}개 품목</span>
            <span>총 {totalStockSum}</span>
          </div>

          {/* 제품 카드 가로 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                등록된 제품이 없습니다.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                const locNames = item.locations && Object.keys(item.locations).length > 0
                  ? Object.keys(item.locations).join(', ')
                  : '기본 위치';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      if (onSelectProduct) onSelectProduct(item);
                    }}
                    style={{
                      border: '2px solid',
                      borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '11px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <i className="fa-regular fa-image" style={{ fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {locNames}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#3b82f6' }}>{item.total_quantity} 개</span>
                      <div style={{ fontSize: '11px', color: '#3b82f6' }}>(거래: {item.history_count || 0} 회)</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 한눈에 보는 상세 정보 패널 + 입출고조정이동 퀵 버튼 (스크린샷 1 최적화!) */}
        <div>
          {!selectedItem ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '80px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              왼쪽 목록에서 제품을 선택해 보세요.
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

              {/* 1. 상단: [이미지 + 제품명/SKU] + [수정/삭제] */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                {/* 이미지 + 제품명/SKU 좌측 배치 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* 이미지 박스 — 제품명 왼쪽 */}
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', flexShrink: 0 }}>
                    <i className="fa-regular fa-image" style={{ fontSize: '28px' }}></i>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedItem.name}</h2>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>SKU: {selectedItem.sku}</div>
                  </div>
                </div>

                {/* 수정/삭제 버튼 */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenProductEdit(selectedItem)}
                    style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedItem.id, selectedItem.name)}
                    style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#ffffff', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>

              {/* 2. [입고 | 출고 | 조정 | 이동] 퀵 액션 버튼 — 수정/삭제 바로 아래 */}
              <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>빠른 입출고 / 재고 관리</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('IN')}
                    style={{ padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    입고
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('OUT')}
                    style={{ padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    출고
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('ADJUST')}
                    style={{ padding: '10px 0', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    조정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('MOVE')}
                    style={{ padding: '10px 0', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    이동
                  </button>
                </div>
              </div>

              {/* 3. 바코드/카테고리/브랜드 — 2열 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>바코드</div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedItem.barcode || '-'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>카테고리</div>
                  <div style={{ color: '#1e293b' }}>{selectedItem.category || '-'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>브랜드</div>
                  <div style={{ color: '#1e293b' }}>{selectedItem.brand || '-'}</div>
                </div>
              </div>

              {/* 4. 바코드 아래: 위치별 총 재고량 현황 (full width) */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-location-dot" style={{ color: '#3b82f6' }}></i>
                  <span>총 재고량</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6', marginLeft: '4px' }}>
                    {selectedItem.total_quantity} 개
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    (거래: {selectedItem.history_count || 0} 회)
                  </span>
                </div>
                {selectedItem.locations && Object.keys(selectedItem.locations).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(selectedItem.locations).map(([locName, qty]) => (
                      <div
                        key={locName}
                        onClick={() => setActiveLocModal({ locName, qty })}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                        className="search-item-hover"
                      >
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>📍 {locName}</span>
                        <span style={{ fontWeight: 800, color: '#3b82f6' }}>{qty}개</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setActiveLocModal({ locName: '기본 위치', qty: selectedItem.total_quantity })}
                    style={{ fontSize: '13px', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    📍 기본 위치: <strong style={{ color: '#3b82f6' }}>{selectedItem.total_quantity}개</strong>
                  </div>
                )}
              </div>

              {/* 5. 구매가 / 판매가 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: '14px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>구매가</div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>₩{(selectedItem.purchase_price || 0).toLocaleString()}</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>판매가</div>
                  <div style={{ fontWeight: 700, color: '#22c55e' }}>₩{(selectedItem.selling_price || 0).toLocaleString()}</div>
                </div>
              </div>

            </div>

          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* 위치 클릭 시 팝업 퀵 액션 모달 (스크린샷 2 구현) */}
      {/* ========================================== */}
      {activeLocModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '380px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            
            {/* 모달 헤더: 위치명 & 닫기 X */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{activeLocModal.locName}</h3>
              <button type="button" onClick={() => setActiveLocModal(null)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>

            {/* 메인 재고 수량 */}
            <div style={{ textAlign: 'center', margin: '20px 0 28px 0' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#3b82f6' }}>{activeLocModal.qty}</span>
            </div>

            {/* 하단 4개 입출고조정이동 버튼 그룹 — 위치 팝업이므로 handleLocModalAction 사용! */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <button type="button" onClick={() => handleLocModalAction('IN')} style={{ padding: '10px 0', border: 'none', borderRight: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>입고</button>
              <button type="button" onClick={() => handleLocModalAction('OUT')} style={{ padding: '10px 0', border: 'none', borderRight: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>출고</button>
              <button type="button" onClick={() => handleLocModalAction('ADJUST')} style={{ padding: '10px 0', border: 'none', borderRight: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>조정</button>
              <button type="button" onClick={() => handleLocModalAction('MOVE')} style={{ padding: '10px 0', border: 'none', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>이동</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 제품 수정 모달 팝업 (사용자 요청 구현) */}
      {/* ========================================== */}
      {showProductEditModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>제품 수정</h2>
              <button type="button" onClick={() => setShowProductEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleSaveProductEdit}>
              {/* SKU & 제품명 2열 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>SKU <span style={{ color: '#ff4d4f' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editItemSku}
                    onChange={(e) => setEditItemSku(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>제품명 <span style={{ color: '#ff4d4f' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    autoFocus
                  />
                </div>
              </div>

              {/* 바코드 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>바코드</label>
                <input
                  type="text"
                  className="form-input"
                  value={editItemBarcode}
                  onChange={(e) => setEditItemBarcode(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 카테고리 & 브랜드 2열 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>카테고리</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>브랜드</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editItemBrand}
                    onChange={(e) => setEditItemBrand(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 구매가 & 판매가 2열 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>구매가 (₩)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editItemPurchasePrice}
                    onChange={(e) => setEditItemPurchasePrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>판매가 (₩)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editItemSellingPrice}
                    onChange={(e) => setEditItemSellingPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 주 거래처 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>주 거래처</label>
                <input
                  type="text"
                  className="form-input"
                  value={editItemPartner}
                  onChange={(e) => setEditItemPartner(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 하단 취소 / 저장 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowProductEditModal(false)}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
