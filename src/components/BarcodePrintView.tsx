/**
 * [BarcodePrintView 컴포넌트]
 * 역할: 바코드 인쇄 페이지로 등록된 제품의 바코드 카드 및 인쇄 준비 화면을 렌더링합니다.
 * 흐름: getStoredItems()에서 데이터를 로드하고 각 제품별 라벨 인쇄 뷰를 제공합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredItems, Item } from '@/lib/storage';

interface BarcodePrintViewProps {
  isBundle?: boolean;
}

export default function BarcodePrintView({ isBundle = false }: BarcodePrintViewProps) {
  // 제품 목록 및 묶음제품 목록 상태 관리
  const [items, setItems] = useState<Item[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    if (isBundle) {
      // 묶음제품 데이터 로드
      const { getStoredBundles } = require('@/lib/storage');
      setBundles(getStoredBundles());
    } else {
      // 일반 제품 데이터 로드
      setItems(getStoredItems());
    }
  }, [isBundle]);

  const handlePrint = () => {
    window.print();
  };

  const listData = isBundle ? bundles : items;
  const titleText = isBundle ? '묶음제품 바코드 인쇄' : '제품 바코드 인쇄';

  return (
    <div className="boxhero-style-form" style={{ maxWidth: '1000px' }}>
      <header className="form-header">
        <span className="sub-title">바코드 관리</span>
        <div className="title-row">
          <h1 className="main-title">{titleText} ({listData.length})</h1>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <i className="fa-solid fa-print" style={{ marginRight: '6px' }}></i> 인쇄하기
          </button>
        </div>
      </header>

      {listData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
          바코드를 인쇄할 등록 {isBundle ? '묶음제품' : '제품'}이 없습니다. 먼저 등록을 완료해 주세요.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {listData.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px', color: '#1e293b' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{item.sku}</div>

              {/* 바코드 비주얼 모의 바코드 표시 */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 8px',
                  borderRadius: '6px',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <i className="fa-solid fa-barcode" style={{ fontSize: '38px', color: '#1e293b' }}></i>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                  {item.barcode || item.sku}
                </span>
              </div>

              <div style={{ marginTop: '12px', fontSize: '13px', color: '#334155' }}>
                {isBundle ? '가치 단가' : '판매가'}: ₩{item.selling_price.toLocaleString()}
              </div>

              {isBundle && item.components && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  구성: {item.components.length}개 품목 조합
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
