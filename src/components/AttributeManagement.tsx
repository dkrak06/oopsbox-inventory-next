/**
 * [AttributeManagement 컴포넌트]
 * 역할: 품목 속성(색상, 사이즈, 재질 등) 및 하위 옵션값들을 정의하고 관리하는 화면입니다.
 * 흐름: LocalStorage의 hb_attributes 데이터를 로드하여 신규 속성을 등록하거나 기존 속성의 옵션 항목을 추가/삭제합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredAttributes, 
  saveAttribute, 
  updateAttribute, 
  deleteAttribute, 
  CustomAttribute 
} from '@/lib/storage';

export default function AttributeManagement() {
  const [attributes, setAttributes] = useState<CustomAttribute[]>([]);
  
  // 신규 속성 생성을 위한 입력 상태
  const [newAttrName, setNewAttrName] = useState('');
  
  // 속성 내 개별 옵션(옵션 태그) 추가를 위한 입력 상태
  const [newOptionValues, setNewOptionValues] = useState<{ [attrId: string]: string }>({});

  useEffect(() => {
    setAttributes(getStoredAttributes());
  }, []);

  // 속성 추가 핸들러
  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    if (attributes.some(a => a.name === newAttrName.trim())) {
      alert('이미 존재하는 속성명입니다.');
      return;
    }

    const updated = saveAttribute({
      name: newAttrName.trim(),
      values: []
    });
    setAttributes(updated);
    setNewAttrName('');
  };

  // 속성 내 옵션값 추가 핸들러
  const handleAddOption = (attrId: string) => {
    const optionVal = newOptionValues[attrId]?.trim();
    if (!optionVal) return;

    const targetAttr = attributes.find(a => a.id === attrId);
    if (!targetAttr) return;

    if (targetAttr.values.includes(optionVal)) {
      alert('이미 등록된 옵션값입니다.');
      return;
    }

    const newValues = [...targetAttr.values, optionVal];
    const updated = updateAttribute(attrId, newValues);
    setAttributes(updated);

    // 입력 필드 초기화
    setNewOptionValues(prev => ({ ...prev, [attrId]: '' }));
  };

  // 속성 내 옵션값 삭제 핸들러
  const handleRemoveOption = (attrId: string, valueToRemove: string) => {
    const targetAttr = attributes.find(a => a.id === attrId);
    if (!targetAttr) return;

    const newValues = targetAttr.values.filter(v => v !== valueToRemove);
    const updated = updateAttribute(attrId, newValues);
    setAttributes(updated);
  };

  // 속성 전체 삭제 핸들러
  const handleDeleteAttribute = (id: string) => {
    if (confirm('이 속성 정보 전체를 삭제하시겠습니까? 관련 품목 옵션 설정에 영향을 줄 수 있습니다.')) {
      const updated = deleteAttribute(id);
      setAttributes(updated);
    }
  };

  return (
    <div className="attribute-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>제품 속성 설정</h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
        품목 등록 시 할당할 수 있는 공통 속성(예: 색상, 사이즈, 재질)과 그 세부 옵션값들을 정의합니다.
      </p>

      {/* 신규 속성 추가 폼 */}
      <form 
        onSubmit={handleAddAttribute}
        style={{
          display: 'flex',
          gap: '12px',
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          alignItems: 'flex-end'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>새 속성 이름</label>
          <input
            type="text"
            placeholder="예: 용량, 재질, 규격 등"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            required
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '9px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          속성 생성
        </button>
      </form>

      {/* 속성 목록 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {attributes.map(attr => (
          <div 
            key={attr.id}
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              position: 'relative'
            }}
          >
            <button
              onClick={() => handleDeleteAttribute(attr.id)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              속성 제거
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              {attr.name}
            </h3>

            {/* 현재 등록된 옵션값 태그 리스트 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {attr.values.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>등록된 옵션값이 없습니다.</span>
              ) : (
                attr.values.map(val => (
                  <span 
                    key={val}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(attr.id, val)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '0 2px'
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* 개별 옵션값 추가 입력 필드 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="옵션 추가 (예: Red, XL)"
                value={newOptionValues[attr.id] || ''}
                onChange={(e) => setNewOptionValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption(attr.id);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddOption(attr.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px'
                }}
              >
                추가
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
