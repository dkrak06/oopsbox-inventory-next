/**
 * [MasterItemsManagement 컴포넌트]
 * 역할: 데이터 관리 > 제품 목록 마스터 테이블 화면으로 전체 제품의 마스터 정보를 일목요연하게 조회/정렬/관리합니다.
 * 흐름: LocalStorage(hb_items)에서 전체 단품 데이터를 로드하여 테이블 형태로 렌더링하며 오름차순/내림차순 정렬을 지원합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredItems, deleteItem, Item } from '@/lib/storage';

interface MasterItemsManagementProps {
  onAddNew?: () => void;
}

export default function MasterItemsManagement({ onAddNew }: MasterItemsManagementProps) {
  // 제품 데이터 및 검색어 상태 관리
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 정렬 상태 (모든 컬럼 지원)
  const [sortField, setSortField] = useState<'name' | 'sku' | 'barcode' | 'purchase_price' | 'selling_price' | 'category' | 'brand' | 'total_quantity' | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 체크박스 선택 관리 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 초기 마운트 시 저장소에서 제품 로드
  const loadData = () => {
    const loaded = getStoredItems();
    setItems(loaded);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 정렬 핸들러 (2단계 asc ↔ desc 무한 반복)
  const handleSort = (field: 'name' | 'sku' | 'barcode' | 'purchase_price' | 'selling_price' | 'category' | 'brand' | 'total_quantity') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 개별 항목 선택 토글
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 선택된 항목 일괄 삭제 처리 (하단 플로팅 바)
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개 제품을 삭제하시겠습니까?`)) {
      selectedIds.forEach(id => deleteItem(id));
      setSelectedIds([]);
      loadData();
      alert('삭제되었습니다.');
    }
  };

  // 검색 필터링 로직
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.includes(searchQuery) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 모든 컬럼 정렬 수행
  const sortedItems = [...filteredItems].sort((a, b) => {
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
    if (sortField === 'purchase_price') {
      return sortDirection === 'asc' ? a.purchase_price - b.purchase_price : b.purchase_price - a.purchase_price;
    }
    if (sortField === 'selling_price') {
      return sortDirection === 'asc' ? a.selling_price - b.selling_price : b.selling_price - a.selling_price;
    }
    if (sortField === 'category') {
      const res = (a.category || '').localeCompare(b.category || '', 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'brand') {
      const res = (a.brand || '').localeCompare(b.brand || '', 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'total_quantity') {
      return sortDirection === 'asc' ? a.total_quantity - b.total_quantity : b.total_quantity - a.total_quantity;
    }
    return 0;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '80px', position: 'relative' }}>
      {/* 1. 상단 브레드크럼 및 헤더 타이틀 영역 */}
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
        데이터 관리
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>제품</h1>
          <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
        </div>

        {/* 오른쪽 상단 액션 버튼 그룹 (+ 제품 추가, 엑셀 가져오기, 더보기) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={onAddNew}
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
            <i className="fa-solid fa-plus"></i> 제품 추가
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

          <button
            type="button"
            className="btn"
            onClick={() => alert('기타 설정 옵션')}
            style={{
              backgroundColor: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '9px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-ellipsis"></i>
          </button>
        </div>
      </div>

      {/* 2. 검색창 및 내보내기/컬럼설정 우측 상단 유틸리티 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}></i>
          <input
            type="text"
            placeholder="이름, 바코드, 속성 검색"
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

      {/* 3. 전체 제품 마스터 데이터 테이블 (관리는 제거, 모든 컬럼 정렬 기능 구현) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', minWidth: '1000px', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 14px', width: '60px' }}>사진</th>

              {/* 모든 컬럼 오름차순/내림차순 연동 */}
              <th onClick={() => handleSort('name')} style={{ padding: '12px 14px', width: '180px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>제품명</span>
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

              <th onClick={() => handleSort('purchase_price')} style={{ padding: '12px 14px', width: '110px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
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

              <th onClick={() => handleSort('selling_price')} style={{ padding: '12px 14px', width: '110px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
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

              <th onClick={() => handleSort('category')} style={{ padding: '12px 14px', width: '110px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>카테고리</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'category' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('brand')} style={{ padding: '12px 14px', width: '110px', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>브랜드</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'brand' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>

              <th onClick={() => handleSort('total_quantity')} style={{ padding: '12px 14px', width: '100px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }} className="search-item-hover">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <span>총 수량</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>
                    {sortField === 'total_quantity' && (
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
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                  등록된 제품 마스터 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedItems.map(item => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
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
                        onChange={() => handleToggleSelect(item.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <i className="fa-regular fa-image"></i>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{item.sku}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{item.barcode || '-'}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>₩{item.purchase_price.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>₩{item.selling_price.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.category || '-'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.brand || '-'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: item.total_quantity > 0 ? '#0f172a' : '#94a3b8' }}>
                      {item.total_quantity.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. 제품 선택 시 하단에 표출되는 블루 플로팅 아일랜드 바 (스크린샷 1 100% 동일) */}
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
    </div>
  );
}
