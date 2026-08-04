/**
 * [PriceTemplateManagement 컴포넌트]
 * 역할: 도매 공급가, 대량 판매 할인가 등 다중 가격 템플릿을 정의하고 간이 시뮬레이션을 제공합니다.
 * 흐름: LocalStorage의 hb_price_templates 데이터를 제어하고, 선택된 품목 가격에 템플릿을 대입한 가상 계산 결과를 계산합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredPriceTemplates, 
  savePriceTemplate, 
  deletePriceTemplate, 
  getStoredItems, 
  PriceTemplate, 
  Item 
} from '@/lib/storage';

export default function PriceTemplateManagement() {
  const [templates, setTemplates] = useState<PriceTemplate[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // 신규 템플릿 등록 폼 상태
  const [name, setName] = useState('');
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // 시뮬레이터 연동 상태
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [simulatedPrice, setSimulatedPrice] = useState<{ original: number; simulated: number } | null>(null);

  useEffect(() => {
    setTemplates(getStoredPriceTemplates());
    setItems(getStoredItems());
  }, []);

  // 템플릿 등록 핸들러
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = savePriceTemplate({
      name: name.trim(),
      markup_percent: markupPercent,
      discount_percent: discountPercent
    });
    setTemplates(updated);
    
    // 폼 리셋
    setName('');
    setMarkupPercent(0);
    setDiscountPercent(0);
    alert('가격 정책 템플릿이 등록되었습니다.');
  };

  // 템플릿 삭제 핸들러
  const handleDelete = (id: string) => {
    if (confirm('이 가격 템플릿을 삭제하시겠습니까?')) {
      const updated = deletePriceTemplate(id);
      setTemplates(updated);
      if (selectedTemplateId === id) {
        setSelectedTemplateId('');
        setSimulatedPrice(null);
      }
    }
  };

  // 가격 시뮬레이션 계산 핸들러
  const handleSimulate = () => {
    if (!selectedItemId || !selectedTemplateId) {
      alert('품목과 적용할 템플릿을 모두 선택해주세요.');
      return;
    }

    const item = items.find(i => i.id === selectedItemId);
    const temp = templates.find(t => t.id === selectedTemplateId);

    if (!item || !temp) return;

    const originalVal = item.selling_price;
    let simulatedVal = originalVal;

    // 마크업 비율 적용 (가산)
    if (temp.markup_percent > 0) {
      simulatedVal = simulatedVal * (1 + temp.markup_percent / 100);
    }
    // 할인 비율 적용 (차감)
    if (temp.discount_percent > 0) {
      simulatedVal = simulatedVal * (1 - temp.discount_percent / 100);
    }

    setSimulatedPrice({
      original: originalVal,
      simulated: Math.round(simulatedVal)
    });
  };

  return (
    <div className="price-template-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>가격 템플릿 관리</h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
        품목 판매 시 대량 할인, 도매 공급, 멤버십 우대가 등 자주 쓰는 가격 산정 템플릿을 정의하고 간이 시뮬레이션을 수행합니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* 좌측: 가격 템플릿 등록 및 목록 */}
        <div style={{ display: 'grid', gap: '20px' }}>
          
          {/* 등록 폼 */}
          <form 
            onSubmit={handleAddTemplate}
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              display: 'grid',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              새 템플릿 등록
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>템플릿 정책명</label>
              <input
                type="text"
                placeholder="예: VIP 우대 (10% 할인)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>마크업 가산비율 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={markupPercent || ''}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                  placeholder="0"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>할인 차감비율 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  placeholder="0"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '9px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                marginTop: '6px'
              }}
            >
              템플릿 추가
            </button>
          </form>

          {/* 목록 표시 */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>정책 템플릿 목록</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '12px' }}>
                  등록된 템플릿이 없습니다.
                </div>
              ) : (
                templates.map(t => (
                  <div 
                    key={t.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{t.name}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {t.markup_percent > 0 && `인상률: +${t.markup_percent}% `}
                        {t.discount_percent > 0 && `할인율: -${t.discount_percent}%`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 우측: 시뮬레이션 계산기 */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
            가격 변동 시뮬레이터
          </h3>

          <div style={{ display: 'grid', gap: '14px' }}>
            {/* 품목 선택 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>테스트할 제품 선택</label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setSimulatedPrice(null);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="">-- 제품 선택 --</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (정가: {i.selling_price.toLocaleString()}원)</option>
                ))}
              </select>
            </div>

            {/* 템플릿 선택 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>적용할 가격 정책 선택</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setSimulatedPrice(null);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="">-- 정책 선택 --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSimulate}
              style={{
                padding: '10px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                marginTop: '6px'
              }}
            >
              변동 가격 산출하기
            </button>

            {/* 결과창 */}
            {simulatedPrice && (
              <div 
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '10px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', color: '#166534', marginBottom: '6px' }}>적용 결과</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>
                    {simulatedPrice.original.toLocaleString()}원
                  </span>
                  <span style={{ fontSize: '18px', color: '#15803d' }}>➔</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>
                    {simulatedPrice.simulated.toLocaleString()}원
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
