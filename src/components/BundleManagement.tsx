/**
 * [BundleManagement 컴포넌트]
 * 역할: 데이터 관리 > 묶음제품 메뉴에서 여러 단품을 조합한 세트/묶음 상품 목록을 조회, 추가, 정렬, 삭제 및 묶음 가능 수량을 관리합니다.
 * 흐름: 구성 단품들의 보유 재고 수량을 실시간 추적하여 생성 가능한 최댓값(묶음 가능 수량)을 계산해 표출합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredBundles,
  saveBundle,
  deleteBundle,
  calculateBundleAvailableQty,
  getStoredItems,
  BundleItem,
  BundleItemComponent,
  Item,
} from '@/lib/storage';

export default function BundleManagement() {
  // 묶음제품 목록 데이터 및 검색어 상태
  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 단품 마스터 목록 상태 (묶음 구성품 선택용)
  const [dbItems, setDbItems] = useState<Item[]>([]);

  // 체크박스 선택 목록 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 정렬 상태 (모든 컬럼 지원)
  const [sortField, setSortField] = useState<'name' | 'sku' | 'barcode' | 'available_qty' | 'purchase_price' | 'selling_price' | 'memo' | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 신규 묶음제품 추가 모달 팝업 및 폼 입력 상태
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addSku, setAddSku] = useState<string>('');
  const [addBarcode, setAddBarcode] = useState<string>('');
  const [addPurchasePrice, setAddPurchasePrice] = useState<number | string>('');
  const [addSellingPrice, setAddSellingPrice] = useState<number | string>('');
  const [addMemo, setAddMemo] = useState<string>('');

  // 묶음 구성 단품 리스트 상태 [{ itemId, itemName, qty }]
  const [components, setComponents] = useState<BundleItemComponent[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [componentQty, setComponentQty] = useState<number>(1);

  // 마운트 시 저장소 데이터 로드
  const loadData = () => {
    setBundles(getStoredBundles());
    const loadedItems = getStoredItems();
    setDbItems(loadedItems);
    if (loadedItems.length > 0) {
      setSelectedItemId(loadedItems[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 컬럼 헤더 클릭 시 2단계 무한 반복 정렬 토글
  const handleSort = (field: 'name' | 'sku' | 'barcode' | 'available_qty' | 'purchase_price' | 'selling_price' | 'memo') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 구성 단품 추가 처리
  const handleAddComponent = () => {
    if (!selectedItemId) return;
    const targetItem = dbItems.find(i => i.id === selectedItemId);
    if (!targetItem) return;

    setComponents(prev => {
      const idx = prev.findIndex(c => c.itemId === targetItem.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + componentQty };
        return next;
      }
      return [...prev, { itemId: targetItem.id, itemName: targetItem.name, qty: componentQty }];
    });
  };

  // 구성 단품 삭제 처리
  const handleRemoveComponent = (itemId: string) => {
    setComponents(prev => prev.filter(c => c.itemId !== itemId));
  };

  // 묶음제품 저장 제출 처리
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      alert('묶음제품명을 입력해 주세요.');
      return;
    }

    if (components.length === 0) {
      alert('최소 1개 이상의 구성 단품을 추가해 주세요.');
      return;
    }

    const autoSku = addSku.trim() || 'SKU-BDL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const pPrice = Number(addPurchasePrice) || 0;
    const sPrice = Number(addSellingPrice) || 0;

    const updated = saveBundle({
      name: addName.trim(),
      sku: autoSku,
      barcode: addBarcode.trim(),
      purchase_price: pPrice,
      selling_price: sPrice,
      memo: addMemo.trim(),
      components,
    });

    setBundles(updated);
    setAddName('');
    setAddSku('');
    setAddBarcode('');
    setAddPurchasePrice('');
    setAddSellingPrice('');
    setAddMemo('');
    setComponents([]);
    setShowAddModal(false);
    alert(`'${addName.trim()}' 묶음제품이 등록되었습니다!`);
  };

  // 선택 묶음제품 일괄 삭제 처리 (하단 플로팅 바)
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개 묶음제품을 삭제하시겠습니까?`)) {
      selectedIds.forEach(id => deleteBundle(id));
      setSelectedIds([]);
      setBundles(getStoredBundles());
      alert('삭제되었습니다.');
    }
  };

  // 전체 체크박스 선택/해제
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredBundles.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 검색 필터링 로직
  const filteredBundles = bundles.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.barcode.includes(searchQuery) ||
    b.memo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 모든 컬럼 정렬 수행
  const sortedBundles = [...filteredBundles].sort((a, b) => {
    if (!sortField) return 0;

    if (sortField === 'name') {
      const res = a.name.localeCompare(b.name, 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'sku') {
      const res = a.sku.localeCompare(b.sku);
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'barcode') {
      const res = (a.barcode || '').localeCompare(b.barcode || '');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'available_qty') {
      const qtyA = calculateBundleAvailableQty(a);
      const qtyB = calculateBundleAvailableQty(b);
      return sortDirection === 'asc' ? qtyA - qtyB : qtyB - qtyA;
    }
    if (sortField === 'purchase_price') {
      return sortDirection === 'asc' ? a.purchase_price - b.purchase_price : b.purchase_price - a.purchase_price;
    }
    if (sortField === 'selling_price') {
      return sortDirection === 'asc' ? a.selling_price - b.selling_price : b.selling_price - a.selling_price;
    }
    if (sortField === 'memo') {
      const res = (a.memo || '').localeCompare(b.memo || '', 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    return 0;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '80px', position: 'relative' }}>
      {/* 0. 상단 서브 시스템 알림 배너 (스크린샷 2 100% 동일) */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fa-solid fa-circle-info" style={{ color: '#3b82f6', fontSize: '15px' }}></i>
        <span>묶음제품은 구매 및 판매에서만 사용 가능합니다.</span>
      </div>

      {/* 1. 상단 경로 네비게이션 및 헤더 타이틀 영역 */}
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
        데이터 관리
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>묶음제품</h1>
          <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
        </div>

        {/* 액션 버튼 그룹 (+ 묶음제품 추가, 엑셀 가져오기) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-plus"></i> 묶음제품 추가
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => alert('엑셀 가져오기 기능 준비 중')}
            style={{
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '9px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-regular fa-file-excel" style={{ color: '#16a34a' }}></i> 엑셀 가져오기
          </button>
        </div>
      </div>

      {/* 2. 검색 인풋 및 내보내기 / 컬럼설정 우측 링크 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}></i>
          <input
            type="text"
            placeholder="묶음제품명, 바코드, 구매가, 판매가, 메모 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => alert('엑셀 내보내기 기능 준비 중')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-arrow-up-from-bracket"></i> 엑셀 내보내기
          </button>
          <button
            type="button"
            onClick={() => alert('컬럼 설정 준비 중')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-gear"></i> 컬럼 설정
          </button>
        </div>
      </div>

      {/* 3. 묶음제품 데이터 테이블 (관리는 제거, 모든 컬럼 정렬 구현) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', minWidth: '1000px', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredBundles.length > 0 && selectedIds.length === filteredBundles.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 14px', width: '60px' }}>사진</th>

              <th onClick={() => handleSort('name')} style={{ padding: '12px 14px', width: '200px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>묶음제품명</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'name' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('sku')} style={{ padding: '12px 14px', width: '140px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>SKU</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'sku' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('barcode')} style={{ padding: '12px 14px', width: '130px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>바코드</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'barcode' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('available_qty')} style={{ padding: '12px 14px', width: '110px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <span>묶음 가능 수량</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'available_qty' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('purchase_price')} style={{ padding: '12px 14px', width: '100px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>구매가</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'purchase_price' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('selling_price')} style={{ padding: '12px 14px', width: '100px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>판매가</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'selling_price' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('memo')} style={{ padding: '12px 14px', width: '140px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>메모</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'memo' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBundles.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                  등록된 묶음제품이 없습니다.
                </td>
              </tr>
            ) : (
              sortedBundles.map(bundle => {
                const availQty = calculateBundleAvailableQty(bundle);
                const isChecked = selectedIds.includes(bundle.id);
                return (
                  <tr
                    key={bundle.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="search-item-hover"
                  >
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(bundle.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <i className="fa-solid fa-boxes-stacked"></i>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {bundle.name}
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                        구성: {bundle.components.map(c => `${c.itemName} × ${c.qty}`).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{bundle.sku}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{bundle.barcode || '-'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: availQty > 0 ? '#2563eb' : '#ef4444' }}>
                      {availQty.toLocaleString()} 개
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>₩{bundle.purchase_price.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>₩{bundle.selling_price.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{bundle.memo || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. 묶음제품 선택 시 하단 표출 블루 플로팅 바 (스크린샷 2 100% 동일) */}
      {selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '55%',
            transform: 'translateX(-50%)',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 28px -6px rgba(37, 99, 235, 0.45)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: 700,
            animation: 'fadeInPure 0.2s ease-out forwards',
          }}
        >
          {/* 선택 수량 텍스트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '18px' }}>
            <span>{selectedIds.length}개 선택됨</span>
          </div>

          {/* 하단 메뉴 액션 버튼 4개 (수정, 라벨 인쇄, 내보내기, 삭제) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => alert('선택 수정 옵션')}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <i className="fa-solid fa-pen"></i> 수정 <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
            </button>

            <button
              type="button"
              onClick={() => alert('선택 바코드 라벨 인쇄')}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <i className="fa-solid fa-barcode"></i> 라벨 인쇄
            </button>

            <button
              type="button"
              onClick={() => alert('선택 내보내기')}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <i className="fa-solid fa-arrow-up-from-bracket"></i> 내보내기 <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <i className="fa-regular fa-trash-can"></i> 삭제
            </button>
          </div>
        </div>
      )}

      {/* 4. 신규 묶음제품 등록 모달 */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>새 묶음제품 추가</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    묶음제품명 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 2종 선물세트"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    SKU (미입력 시 자동생성)
                  </label>
                  <input
                    type="text"
                    placeholder="SKU 입력"
                    value={addSku}
                    onChange={(e) => setAddSku(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>바코드</label>
                  <input
                    type="text"
                    placeholder="바코드"
                    value={addBarcode}
                    onChange={(e) => setAddBarcode(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>구매가 (원)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={addPurchasePrice}
                    onChange={(e) => setAddPurchasePrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>판매가 (원)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={addSellingPrice}
                    onChange={(e) => setAddSellingPrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 구성 단품 지정 영역 */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  📦 묶음 구성 단품 조합 설정
                </label>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    {dbItems.length === 0 ? (
                      <option value="">등록된 단품이 없습니다</option>
                    ) : (
                      dbItems.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))
                    )}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={componentQty}
                    onChange={(e) => setComponentQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center' }}
                  />

                  <button
                    type="button"
                    onClick={handleAddComponent}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    + 구성품 추가
                  </button>
                </div>

                {/* 현재 추가된 구성 단품 칩 목록 */}
                {components.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                    묶음에 포함할 단품을 선택하고 추가해 주세요.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {components.map(comp => (
                      <div key={comp.itemId} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{comp.itemName}</span>
                        <span style={{ color: '#2563eb', fontWeight: 800 }}>× {comp.qty}</span>
                        <i className="fa-solid fa-xmark" style={{ color: '#ef4444', cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleRemoveComponent(comp.itemId)}></i>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>메모</label>
                <textarea
                  rows={2}
                  placeholder="묶음 상품 설명 및 메모"
                  value={addMemo}
                  onChange={(e) => setAddMemo(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
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
