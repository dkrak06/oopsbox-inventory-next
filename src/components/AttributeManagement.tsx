/**
 * [AttributeManagement 컴포넌트]
 * 역할: 데이터 관리 > 속성 메뉴에서 제품 속성의 이름, 종류(텍스트/숫자 등), 방식(고정/선택)을 정의하고 ≡ 아이콘으로 순서를 변경합니다.
 * 흐름: '고정' 속성은 제품 등록 시 기본 표출되고, '선택' 속성은 제품 등록 폼에서 사용자가 필요 시 골라서 추가할 수 있습니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredAttributes,
  saveAttribute,
  updateAttribute,
  deleteAttribute,
  saveAllAttributes,
  CustomAttribute,
  AttributeType,
  AttributeMode,
} from '@/lib/storage';

export default function AttributeManagement() {
  // 1. 등록된 속성 목록 상태
  const [attributes, setAttributes] = useState<CustomAttribute[]>([]);

  // 2. 드래그 앤 드롭 순서 변경 관련 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 3. 신규 항목 추가 입력 폼 상태
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('선택하세요');
  const [selectedMode, setSelectedMode] = useState<AttributeMode>('선택');

  // 4. 기존 항목 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editType, setEditType] = useState<AttributeType>('텍스트');
  const [editMode, setEditMode] = useState<AttributeMode>('선택');

  // 컴포넌트 마운트 시 LocalStorage에서 속성 데이터 로드
  useEffect(() => {
    setAttributes(getStoredAttributes());
  }, []);

  // ---------------- 드래그 앤 드롭 (Drag & Drop) 핸들러 ---------------- //
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...attributes];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setAttributes(updated);
    saveAllAttributes(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  // ------------------------------------------------------------------ //

  // 신규 속성 저장 처리 함수
  const handleSaveNew = () => {
    if (!newName.trim()) {
      alert('속성 이름을 입력해 주세요.');
      return;
    }
    if (selectedType === '선택하세요') {
      alert('속성 종류를 선택해 주세요.');
      return;
    }
    // 동일한 이름의 속성도 제한 없이 문제없이 생성할 수 있도록 허용합니다.

    const updated = saveAttribute({
      name: newName.trim(),
      type: selectedType as AttributeType,
      mode: selectedMode,
    });
    setAttributes(updated);
    setNewName('');
    setSelectedType('선택하세요');
    setSelectedMode('선택');
    setIsAdding(false);
  };

  // 속성 수정 시작 처리 함수
  const handleStartEdit = (attr: CustomAttribute) => {
    setEditingId(attr.id);
    setEditName(attr.name);
    setEditType(attr.type || '텍스트');
    setEditMode(attr.mode || '선택');
  };

  // 속성 수정 완료 함수
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      alert('속성 이름을 입력해 주세요.');
      return;
    }
    const updated = updateAttribute(id, editName.trim(), editType, editMode);
    setAttributes(updated);
    setEditingId(null);
  };

  // 속성 삭제 처리 함수
  const handleDelete = (id: string, name: string) => {
    if (confirm(`'${name}' 속성을 삭제하시겠습니까?`)) {
      const updated = deleteAttribute(id);
      setAttributes(updated);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '960px', fontFamily: 'sans-serif' }}>
      {/* 상단 서브 헤더 */}
      <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
        데이터 관리
      </div>

      {/* 페이지 타이틀 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>속성</h1>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: '1px solid #cbd5e1',
            color: '#0d9488',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          title="'고정' 속성은 제품 추가 시 항상 표출되고, '선택' 속성은 필요할 때 선택해 입력할 수 있습니다."
        >
          ?
        </span>
      </div>

      {/* 속성 관리 테이블 메인 영역 */}
      <div style={{ width: '100%' }}>
        {/* 테이블 헤더 (이름 | 종류 | 방식 | 기능버튼) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 140px 140px 90px',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '14px',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <div></div>
          <div>이름</div>
          <div>종류</div>
          <div>방식</div>
          <div style={{ textAlign: 'right' }}></div>
        </div>

        {/* 속성 목록 행(Row) */}
        {attributes.map((attr, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={attr.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 140px 140px 90px',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: isDragOver ? '2px solid #3b82f6' : '1px solid #f1f5f9',
                backgroundColor: isDragging ? '#f1f5f9' : '#ffffff',
                opacity: isDragging ? 0.5 : 1,
                fontSize: '14px',
                color: '#1e293b',
                transition: 'background-color 0.15s ease, border 0.15s ease',
              }}
            >
              {/* 1열: 드래그 ≡ 아이콘 */}
              <div
                style={{
                  color: '#94a3b8',
                  cursor: 'grab',
                  fontSize: '16px',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="드래그하여 순서 변경"
              >
                ≡
              </div>

              {/* 2열: 속성 이름 */}
              <div>
                {editingId === attr.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      width: '80%',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 400, color: '#0f172a' }}>{attr.name}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(attr)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '13px',
                        padding: '2px',
                      }}
                      title="이름 수정"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>

              {/* 3열: 속성 종류 */}
              <div>
                {editingId === attr.id ? (
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AttributeType)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="텍스트" style={{ color: '#0f172a' }}>텍스트</option>
                    <option value="숫자" style={{ color: '#0f172a' }}>숫자</option>
                    <option value="날짜" style={{ color: '#0f172a' }}>날짜</option>
                    <option value="바코드" style={{ color: '#0f172a' }}>바코드</option>
                    <option value="파일" style={{ color: '#0f172a' }}>파일</option>
                  </select>
                ) : (
                  <span style={{ color: '#475569', fontWeight: 400 }}>{attr.type || '텍스트'}</span>
                )}
              </div>

              {/* 4열: 표출 방식 (고정 / 선택) */}
              <div>
                {editingId === attr.id ? (
                  <select
                    value={editMode}
                    onChange={(e) => setEditMode(e.target.value as AttributeMode)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="고정" style={{ color: '#0f172a' }}>고정 (기본 표출)</option>
                    <option value="선택" style={{ color: '#0f172a' }}>선택 (필요 시 표출)</option>
                  </select>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: (attr.mode || '선택') === '고정' ? '#eff6ff' : '#f1f5f9',
                      color: (attr.mode || '선택') === '고정' ? '#2563eb' : '#64748b',
                      border: (attr.mode || '선택') === '고정' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    }}
                  >
                    {attr.mode || '선택'}
                  </span>
                )}
              </div>

              {/* 5열: 삭제 및 완료 버튼 */}
              <div style={{ textAlign: 'right' }}>
                {editingId === attr.id ? (
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(attr.id)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    완료
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelete(attr.id, attr.name)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 항목 추가 신규 등록 폼 */}
        {isAdding && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px 140px 140px',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              gap: '12px',
            }}
          >
            <div></div>

            {/* 신규 이름 입력 필드 */}
            <div>
              <input
                type="text"
                placeholder="예) 사이즈, 컬러, 제조사..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>

            {/* 신규 종류 선택 드롭다운 */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: selectedType === '선택하세요' ? '#64748b' : '#0f172a',
                  backgroundColor: '#ffffff',
                  width: '100%',
                }}
              >
                <option value="선택하세요" style={{ color: '#64748b' }}>선택하세요</option>
                <option value="텍스트" style={{ color: '#0f172a' }}>텍스트</option>
                <option value="숫자" style={{ color: '#0f172a' }}>숫자</option>
                <option value="날짜" style={{ color: '#0f172a' }}>날짜</option>
                <option value="바코드" style={{ color: '#0f172a' }}>바코드</option>
                <option value="파일" style={{ color: '#0f172a' }}>파일</option>
              </select>
            </div>

            {/* 신규 방식 선택 드롭다운 (고정 / 선택) */}
            <div>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as AttributeMode)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  width: '100%',
                }}
              >
                <option value="선택" style={{ color: '#0f172a' }}>선택 (필요 시 표출)</option>
                <option value="고정" style={{ color: '#0f172a' }}>고정 (기본 표출)</option>
              </select>
            </div>

            {/* 저장 / 취소 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveNew}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                  setSelectedType('선택하세요');
                  setSelectedMode('선택');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* '+ 항목 추가' 버튼 */}
        {!isAdding && (
          <div style={{ padding: '16px 0 0 16px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              style={{
                border: 'none',
                background: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 700 }}>+</span> 항목 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
