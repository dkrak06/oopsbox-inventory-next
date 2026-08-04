/**
 * [ProductForm 컴포넌트]
 * 역할: 제품 추가 및 수정 폼을 제공합니다.
 * 흐름: SKU/바코드 자동 생성, 이미지 뷰, 가격 설정 및 위치별 수량 입력을 관리합니다.
 */

'use client';

import React, { useState } from 'react';
import { saveItem } from '@/lib/storage';

// 위치별 재고 데이터 타입 정의
interface LocationStock {
  id: string;
  name: string;
  quantity: number | string;
}

export default function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  // 제품 폼 입력값을 관리하는 React 상태(State)
  const [sku, setSku] = useState<string>('SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [productName, setProductName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number | string>('');
  const [sellingPrice, setSellingPrice] = useState<number | string>('');
  
  // 위치별 수량 배열 상태 (사용자가 바로 확인할 수 있도록 '기본 위치'를 기본 셋팅!)
  const [locations, setLocations] = useState<LocationStock[]>([
    { id: 'default-loc-1', name: '기본 위치', quantity: '' }
  ]);
  
  // 위치 검색 및 선택 드롭다운 상태
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState<boolean>(false);
  const [locSearchQuery, setLocSearchQuery] = useState<string>('');
  
  // 등록 가능한 기본 위치 프리셋 목록
  const availableLocationPresets = ['기본 위치', 'DD', 'FFF', 'A창고', 'B창고'];

  // 위치 선택 추가 처리 함수
  // 위치 선택 추가 처리 함수 (수량 기본값은 빈값이며 placeholder="0"으로 예시 안내)
  const handleSelectLocation = (locName: string) => {
    if (locations.some(loc => loc.name === locName)) {
      alert(`'${locName}'은(는) 이미 추가된 위치입니다.`);
      return;
    }
    const newLoc: LocationStock = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: locName,
      quantity: '', // 0 대신 빈값으로 지정해 placeholder 0 예시 표출!
    };
    setLocations(prev => [...prev, newLoc]);
    setIsLocDropdownOpen(false);
    setLocSearchQuery('');
  };

  // SKU 자동 생성 함수
  const generateSku = () => {
    const randomCode = 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setSku(randomCode);
  };

  // 바코드 13자리 숫자 자동 생성 함수
  const generateBarcode = () => {
    const randomBarcode = '880' + Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(randomBarcode);
  };

  // 위치별 수량 변경 처리 함수
  const handleQuantityChange = (id: string, newQty: number | string) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, quantity: newQty } : loc))
    );
  };

  // 특정 위치 제거 함수
  const handleRemoveLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  // 폼 제출 이벤트 핸들러: 실제 LocalStorage에 저장
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

    saveItem({
      sku,
      name: productName,
      barcode,
      category,
      brand,
      purchase_price: pPrice,
      selling_price: sPrice,
      locations: locMap,
      total_quantity: totalQty,
    });

    alert(`'${productName}' 제품이 실제로 등록되었습니다!`);
    if (onSuccess) onSuccess();
  };

  // 폼 초기화 함수
  const handleReset = () => {
    generateSku();
    setProductName('');
    setBarcode('');
    setCategory('');
    setBrand('');
    setPurchasePrice('');
    setSellingPrice('');
    setLocations([]);
    setIsLocDropdownOpen(false);
    setLocSearchQuery('');
  };

  return (
    <div className="boxhero-style-form product-add-container">
      <header className="form-header">
        <span className="sub-title">제품목록</span>
        <div className="title-row">
          <h1 className="main-title">제품 추가</h1>
          <button type="button" className="btn-text" onClick={handleReset}>
            초기화
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        {/* 섹션 1: 제품 기본 정보 */}
        <section className="form-section">
          <h2 className="section-title">제품 정보</h2>
          <div className="section-content row-layout">
            <div className="inputs-col">
              {/* SKU 입력 및 자동 생성 */}
              <div className="form-group">
                <label className="form-label">
                  SKU<span className="required">*</span>
                </label>
                <div className="input-btn-group">
                  <input
                    type="text"
                    className="form-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                  <button type="button" className="btn btn-action" onClick={generateSku}>
                    자동 생성
                  </button>
                </div>
              </div>

              {/* 제품명 입력 */}
              <div className="form-group">
                <label className="form-label">
                  제품명<span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="제품명을 입력하세요"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              {/* 바코드 입력 및 자동 생성 */}
              <div className="form-group">
                <label className="form-label">바코드</label>
                <div className="input-btn-group">
                  <div className="input-with-icon">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="바코드가 없어도 자동 생성할 수 있습니다."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                    <button type="button" className="btn-inner-icon">
                      <i className="fa-solid fa-qrcode"></i>
                    </button>
                  </div>
                  <button type="button" className="btn btn-action" onClick={generateBarcode}>
                    자동 생성
                  </button>
                </div>
              </div>
            </div>

            {/* 이미지 업로드 박스 */}
            <div className="image-upload-box">
              <label className="image-label" style={{ textAlign: 'center' }}>
                <input type="file" accept="image/*" className="hidden-file-input" />
                <div className="image-placeholder">
                  <i className="fa-solid fa-camera"></i>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* 섹션 2: 제품 속성 (카테고리/브랜드) */}
        <section className="form-section">
          <div className="section-title-row">
            <h2 className="section-title">제품 속성</h2>
            <a href="#" className="link-text">
              제품 속성 편집 <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            </a>
          </div>
          <div className="section-content row-layout">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">카테고리</label>
              <input
                type="text"
                className="form-input"
                placeholder="카테고리 입력"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">브랜드</label>
              <input
                type="text"
                className="form-input"
                placeholder="브랜드 입력"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 섹션 3: 가격 정보 */}
        <section className="form-section">
          <h2 className="section-title">가격 정보</h2>
          <div className="section-content row-layout">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">구매가</label>
              <div className="input-currency">
                <span className="currency-unit">₩</span>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPurchasePrice(val === '' ? '' : Math.max(0, Number(val)));
                  }}
                />
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">판매가</label>
              <div className="input-currency">
                <span className="currency-unit">₩</span>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSellingPrice(val === '' ? '' : Math.max(0, Number(val)));
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 4: 초기 수량 및 위치 설정 (상단 카테고리/브랜드 및 가격 정보와 동일한 2열 row-layout 대칭 정렬) */}
        <section className="form-section">
          <h2 className="section-title">초기 수량</h2>
          
          {/* 상단 2열 컬럼 타이틀 */}
          <div className="section-content row-layout" style={{ marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <span className="form-label" style={{ fontWeight: 700, color: '#475569' }}>위치</span>
            </div>
            <div style={{ flex: 1 }}>
              <span className="form-label" style={{ fontWeight: 700, color: '#475569' }}>수량</span>
            </div>
          </div>

          {/* 1. 추가 완료된 위치 및 수량 목록 (상단 인풋들과 가로 폭이 100% 대칭 정렬됨) */}
          {locations.map((loc) => (
            <div key={loc.id} className="section-content row-layout" style={{ marginBottom: '10px', alignItems: 'center' }}>
              {/* 1열: 위치 명칭 박스 (상단 카테고리/브랜드 인풋과 폰트, 테두리, 배경색 100% 동일 통일) */}
              <div style={{ flex: 1 }}>
                <div
                  className="form-input"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    height: '42px',
                    boxSizing: 'border-box'
                  }}
                >
                  {loc.name}
                </div>
              </div>

              {/* 2열: 위치 설정 완료로 활성화된 수량 입력 박스 (placeholder="0" 예시 표출) + 삭제 버튼 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  style={{
                    width: '50%',
                    height: '42px',
                    textAlign: 'left',
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    paddingLeft: '12px'
                  }}
                  value={loc.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleQuantityChange(loc.id, val === '' ? '' : Math.max(0, Number(val)));
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc.id)}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    width: '42px',
                    height: '42px',
                    fontSize: '15px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  className="search-item-hover"
                  title="위치 삭제"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          ))}

          {/* 2. 위치 선택 및 검색 드롭다운 컴포넌트 (1열 크기에 맞춘 2열 수평 정렬) */}
          <div className="section-content row-layout" style={{ marginTop: '6px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                onClick={() => setIsLocDropdownOpen(prev => !prev)}
                className="form-input search-item-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748b',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-plus" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
                  <span>위치 검색</span>
                </div>
                <i className={`fa-solid fa-chevron-${isLocDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '11px', color: '#94a3b8' }}></i>
              </div>

              {/* 위치 선택 팝업 드롭다운 리스트 */}
              {isLocDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="위치 이름 검색..."
                      value={locSearchQuery}
                      onChange={(e) => setLocSearchQuery(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px', width: '100%', height: '36px' }}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                    {availableLocationPresets
                      .filter(name => name.toLowerCase().includes(locSearchQuery.toLowerCase()))
                      .map((presetName) => {
                        const isAdded = locations.some(loc => loc.name === presetName);
                        return (
                          <div
                            key={presetName}
                            onClick={() => !isAdded && handleSelectLocation(presetName)}
                            style={{
                              padding: '10px 16px',
                              fontSize: '14px',
                              color: isAdded ? '#94a3b8' : '#1e293b',
                              backgroundColor: isAdded ? '#f8fafc' : 'transparent',
                              cursor: isAdded ? 'default' : 'pointer',
                              fontWeight: isAdded ? 400 : 600,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            className={!isAdded ? 'search-item-hover' : ''}
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

            {/* 오른쪽 2열 빈 공백 영역 (좌측 1열 위치 검색과의 가로 대칭 유지) */}
            <div style={{ flex: 1 }}></div>
          </div>
        </section>

        {/* 폼 하단 제출 버튼 영역 */}
        <footer className="form-footer">
          <button type="submit" className="btn btn-submit">
            입력 완료
          </button>
          <button type="button" className="btn btn-cancel" onClick={handleReset}>
            취소
          </button>
        </footer>
      </form>
    </div>
  );
}
