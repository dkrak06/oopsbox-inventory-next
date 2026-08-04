/**
 * [ItemList 컴포넌트]
 * 역할: 박스히어로 스타일의 2단 마스터-디테일(좌 측 목록, 우 측 상세) 제품 관리 화면입니다.
 * 흐름: 좌측 제품 선택에 따라 우측에 제품 상세(바코드, 가격, 주거래처, 수량)를 표시하고 수정/삭제를 처리합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredItems, deleteItem, Item } from '@/lib/storage';

interface ItemListProps {
  onAddNew: () => void;
}

export default function ItemList({ onAddNew }: ItemListProps) {
  // 제품 목록 상태
  const [items, setItems] = useState<Item[]>([]);
  // 선택된 제품 ID 상태
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 위치 필터 상태
  const [locationFilter, setLocationFilter] = useState<string>('all');
  // 재고 보유만 보기 체크 상태
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  // 제품 추가 드롭다운 토글 상태
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState<boolean>(false);

  // 마운트 시 저장소에서 제품 데이터 로드
  const loadData = () => {
    const loaded = getStoredItems();
    setItems(loaded);
    // [사용자 요청 반영]: 첫 화면 진입 시 아무런 제품도 선택되어 있지 않도록 자동 첫 번째 제품 선택 로직을 제거합니다.
  };

  useEffect(() => {
    loadData();
  }, []);

  // 검색어 및 재고 보유 체크 필터링 로직
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);

    const matchesStock = inStockOnly ? item.total_quantity > 0 : true;

    return matchesSearch && matchesStock;
  });

  // 전체 총 재고 수량 계산
  const totalStockSum = filteredItems.reduce((acc, cur) => acc + cur.total_quantity, 0);

  // 선택된 제품 객체 가져오기
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. 상단 타이틀 및 제품 추가 / 데이터 관리 버튼 영역 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a202c' }}>제품목록</h1>
          <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
        </div>

        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          {/* 분할 드롭다운 버튼: + 제품 추가 */}
          <div style={{ display: 'flex', position: 'relative' }}>
            <button
              className="btn btn-primary"
              onClick={onAddNew}
              style={{
                borderRadius: '6px 0 0 6px',
                padding: '10px 18px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + 제품 추가
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsAddDropdownOpen((prev) => !prev)}
              style={{
                borderRadius: '0 6px 6px 0',
                padding: '10px 10px',
                borderLeft: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }}></i>
            </button>

            {/* 제품 추가 드롭다운 팝업 */}
            {isAddDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  zIndex: 100,
                  width: '180px',
                  padding: '6px 0',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    setIsAddDropdownOpen(false);
                    onAddNew();
                  }}
                >
                  <i className="fa-solid fa-plus"></i> 단일 제품 추가
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    setIsAddDropdownOpen(false);
                    alert('묶음 제품 추가 기능으로 이동합니다.');
                  }}
                >
                  <i className="fa-solid fa-boxes-packing"></i> 묶음 제품 추가
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    setIsAddDropdownOpen(false);
                    alert('옵션 일괄 추가 기능으로 이동합니다.');
                  }}
                >
                  <i className="fa-solid fa-list-check"></i> 옵션 일괄 추가
                </div>
              </div>
            )}
          </div>

          {/* 데이터 관리 버튼 */}
          <button
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            onClick={() => alert('데이터 관리 화면으로 이동합니다.')}
          >
            <i className="fa-solid fa-database"></i> 데이터 관리
          </button>
        </div>
      </div>

      {/* 2. 검색 및 위치 필터 바 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <select
          className="form-input"
          style={{ width: '150px' }}
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="all">모든 위치</option>
          <option value="default">기본창고</option>
        </select>

        <div style={{ flex: 1, position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          ></i>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="이름, 바코드, 속성 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 바코드 스캐너 버튼 */}
        <button
          className="btn"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '8px 12px',
          }}
          title="바코드 스캔"
        >
          <i className="fa-solid fa-barcode" style={{ fontSize: '18px', color: '#475569' }}></i>
        </button>

        {/* 재고 보유 체크박스 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#475569',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          재고 보유
        </label>
      </div>

      {/* 3. 2열 마스터-디테일 본문 영역 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* 좌측: 제품 목록 카드 패널 */}
        <div style={{ width: '380px', flexShrink: 0 }}>
          {/* 목록 조율바 (묶어보기 & 정렬 & 수량) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <select className="form-input" style={{ width: '110px', fontSize: '13px', padding: '4px 8px' }}>
              <option>묶어보기</option>
            </select>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '16px',
              }}
              title="정렬"
            >
              <i className="fa-solid fa-arrow-down-up-across-line"></i>
            </button>
          </div>

          {/* 수량 카운트 요약 바 */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#475569',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
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
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    style={{
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* 이미지 자리 */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <i className="fa-regular fa-image" style={{ fontSize: '18px' }}></i>
                      </div>

                      {/* 제품명 & 서브텍스트 */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>-</div>
                      </div>
                    </div>

                    {/* 수량 표시 */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#3b82f6' }}>
                        {item.total_quantity} 개
                      </span>
                      {/* 오해의 소지가 있는 '잔여' 텍스트를 실시간 거래 이력 건수를 뜻하는 '거래'로 변경 및 초기값 0 대응 */}
                      <span style={{ fontSize: '12px', color: '#3b82f6', marginLeft: '4px' }}>
                        (거래: {item.history_count || 0} 회)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 상세 정보 패널 */}
        <div style={{ flex: 1 }}>
          {!selectedItem ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '80px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '14px',
              }}
            >
              왼쪽 목록에서 제품을 속성별로 묶거나 선택할 수 있습니다.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              {/* 상단 Header: 제품명, SKU 및 수정/삭제 버튼 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
                    {selectedItem.name}
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    SKU: {selectedItem.sku}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      padding: '6px 14px',
                      fontSize: '13px',
                    }}
                    onClick={() => alert(`'${selectedItem.name}' 수정 화면으로 이동합니다.`)}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    className="btn"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #fee2e2',
                      color: '#ef4444',
                      padding: '6px 14px',
                      fontSize: '13px',
                    }}
                    onClick={() => handleDelete(selectedItem.id, selectedItem.name)}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>

              {/* 상세 본문: 좌측 대형 이미지Placeholder + 우측 상세 그리드 */}
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* 대형 이미지 박스 */}
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cbd5e1',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-regular fa-image" style={{ fontSize: '48px' }}></i>
                </div>

                {/* 2열 상세 정보 그리드 */}
                <div
                  style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px 24px',
                    fontSize: '14px',
                  }}
                >
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

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>기본 보관위치</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>기본창고</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>총 재고량</div>
                    <div style={{ fontWeight: 700, color: '#3b82f6' }}>
                      {selectedItem.total_quantity} 개
                      {/* 제품 상세 뷰에서도 거래 횟수로 표시를 통합 조정 */}
                      <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                        (거래: {selectedItem.history_count || 0} 회)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>주 거래처</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedItem.partner || '(주)영웅유통'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>구매가</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>
                      ₩{selectedItem.purchase_price.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>판매가</div>
                    <div style={{ fontWeight: 700, color: '#22c55e' }}>
                      ₩{selectedItem.selling_price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
