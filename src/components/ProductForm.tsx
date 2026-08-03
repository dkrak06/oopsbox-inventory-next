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
  quantity: number;
}

export default function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  // 제품 폼 입력값을 관리하는 React 상태(State)
  const [sku, setSku] = useState<string>('SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [productName, setProductName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  
  // 위치별 수량 배열 상태 (기본 위치 보유)
  const [locations, setLocations] = useState<LocationStock[]>([
    { id: '1', name: '기본 위치', quantity: 0 },
  ]);

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
  const handleQuantityChange = (id: string, newQty: number) => {
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
      locMap[loc.name] = loc.quantity;
      totalQty += loc.quantity;
    });

    saveItem({
      sku,
      name: productName,
      barcode,
      category,
      brand,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
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
    setPurchasePrice(0);
    setSellingPrice(0);
    setLocations([{ id: '1', name: '기본 위치', quantity: 0 }]);
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
                  className="form-input"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">판매가</label>
              <div className="input-currency">
                <span className="currency-unit">₩</span>
                <input
                  type="number"
                  className="form-input"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 4: 초기 수량 및 위치 설정 */}
        <section className="form-section">
          <h2 className="section-title">초기 수량</h2>
          <div className="section-content">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #E5E7EB',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              <span className="form-label">위치</span>
              <span className="form-label">수량</span>
            </div>

            {/* 동적 위치 및 수량 목록 레더링 */}
            {locations.map((loc) => (
              <div
                key={loc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{loc.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    className="form-input align-right"
                    style={{ width: '90px' }}
                    value={loc.quantity}
                    onChange={(e) => handleQuantityChange(loc.id, Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
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
