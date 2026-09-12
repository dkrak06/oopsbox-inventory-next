/**
 * [AttributeManagement 컴포넌트]
 * 역할: 데이터 관리 > 속성 메뉴에서 제품 속성의 이름, 종류, 표시 방식(고정/선택/숨김)을 설정하고 순서를 관리합니다.
 * 흐름: 표시 방식을 [고정|선택|숨김] 단일 세그먼트로 통합 제어하여 제품 등록 폼과의 연동성을 직관적으로 제공합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredAttributes,
  saveAttribute,
  updateAttribute,
  deleteAttribute,
  softDeleteAttribute,
  hardDeleteAttributeAndClearProductValues,
  toggleAttributeVisibility,
  saveAllAttributes,
  getStoredItems,
  CustomAttribute,
  AttributeType,
  AttributeMode,
} from '@/lib/storage';

interface AttributeManagementProps {
  isModal?: boolean;
  onClose?: () => void;
}

export default function AttributeManagement({ isModal, onClose }: AttributeManagementProps = {}) {
  // 1. 등록된 속성 목록 상태 (Soft Delete 되지 않은 속성만 표출)
  const [attributes, setAttributes] = useState<CustomAttribute[]>([]);

  // 2. 드래그 앤 드롭 순서 변경 관련 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 3. 신규 항목 추가 입력 폼 상태
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('선택하세요');
  const [selectedDisplayMode, setSelectedDisplayMode] = useState<'고정' | '선택' | '숨김'>('선택');

  // 4. 기존 항목 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editType, setEditType] = useState<AttributeType>('텍스트');
  const [editDisplayMode, setEditDisplayMode] = useState<'고정' | '선택' | '숨김'>('선택');

  // 5. 삭제 확인 모달 제어 상태 (요구사항 1, 2, 3 구현)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [targetAttr, setTargetAttr] = useState<CustomAttribute | null>(null);
  const [usedProductCount, setUsedProductCount] = useState<number>(0);
  const [deleteOption, setDeleteOption] = useState<'OPTION_A' | 'OPTION_B'>('OPTION_A');

  // 컴포넌트 마운트 시 LocalStorage에서 속성 데이터 로드 (Soft Delete된 속성은 목록에서 제외)
  const loadAttributes = () => {
    const loaded = getStoredAttributes();
    setAttributes(loaded.filter((attr) => !attr.is_deleted));
  };

  useEffect(() => {
    loadAttributes();
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

    const updated = saveAttribute({
      name: newName.trim(),
      type: selectedType as AttributeType,
      mode: selectedDisplayMode === '고정' ? '고정' : '선택',
    });
    let finalAttrs = updated;
    if (selectedDisplayMode === '숨김') {
      const createdId = updated[updated.length - 1]?.id;
      if (createdId) {
        finalAttrs = toggleAttributeVisibility(createdId, false);
      }
    }
    setAttributes(finalAttrs.filter((a) => !a.is_deleted));
    setNewName('');
    setSelectedType('선택하세요');
    setSelectedDisplayMode('선택');
    setIsAdding(false);
  };

  // 속성 수정 시작 처리 함수
  const handleStartEdit = (attr: CustomAttribute) => {
    setEditingId(attr.id);
    setEditName(attr.name);
    setEditType(attr.type || '텍스트');
    const currentMode: '고정' | '선택' | '숨김' =
      attr.is_visible === false ? '숨김' : (attr.mode || '선택');
    setEditDisplayMode(currentMode);
  };

  // 속성 수정 완료 함수
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      alert('속성 이름을 입력해 주세요.');
      return;
    }
    const newMode: AttributeMode = editDisplayMode === '고정' ? '고정' : '선택';
    const isVisible = editDisplayMode !== '숨김';

    // 1. 이름, 타입, 모드 업데이트
    updateAttribute(id, editName.trim(), editType, newMode);
    // 2. 가시성 업데이트
    const updated = toggleAttributeVisibility(id, isVisible);
    setAttributes(updated.filter((a) => !a.is_deleted));
    setEditingId(null);
  };

  // 속성 삭제 버튼 클릭 핸들러 (사용 중인 제품 0개 vs 1개 이상 분기 처리)
  const handleDeleteClick = (attr: CustomAttribute) => {
    const items = getStoredItems();
    
    // 사용 중인 제품 개수 연산:
    // 1) '고정' 속성: 제품 폼에 항상 기본 표출되므로 제품이 1개 이상 존재하면 모든 제품이 이 속성을 사용 중인 것으로 간주
    // 2) '선택' 속성: 제품 레코드의 attributes에 키(ID/이름)가 존재하거나 값이 할당되어 있는 제품 개수 집계
    let usedCount = 0;
    if (attr.mode === '고정') {
      usedCount = items.length;
    } else {
      usedCount = items.filter((item) => {
        if (!item.attributes) return false;
        const valById = item.attributes[attr.id];
        const valByName = item.attributes[attr.name];
        return valById !== undefined || valByName !== undefined;
      }).length;
    }

    if (usedCount === 0) {
      // 1. 해당 속성을 사용 중인 제품이 0개인 경우: 별도 모달 없이 즉시 삭제
      if (confirm(`'${attr.name}' 속성을 삭제하시겠습니까?`)) {
        const updated = deleteAttribute(attr.id);
        setAttributes(updated.filter((a) => !a.is_deleted));
      }
    } else {
      // 2. 해당 속성을 사용 중인 제품이 1개 이상인 경우: confirmation 모달 팝업 출현
      setTargetAttr(attr);
      setUsedProductCount(usedCount);
      setDeleteOption('OPTION_A'); // 기본값: 옵션 A("기존 제품 속성 유지 (신규 숨김)")
      setShowDeleteModal(true);
    }
  };

  // 모달 내 삭제 실행 버튼 클릭 핸들러
  const handleConfirmDelete = () => {
    if (!targetAttr) return;

    if (deleteOption === 'OPTION_A') {
      // 옵션 A: "기존 제품 속성 유지 (신규 숨김)" -> Soft Delete (is_deleted: true)
      softDeleteAttribute(targetAttr.id);
      alert(`'${targetAttr.name}' 속성이 신규 폼에서 숨김 처리되었습니다. (기존 제품 데이터는 보존됩니다)`);
    } else if (deleteOption === 'OPTION_B') {
      // 옵션 B: "모든 제품에서 속성 완벽 삭제" -> Hard Delete + 기존 제품 레코드 내 속성값 삭제
      hardDeleteAttributeAndClearProductValues(targetAttr.id, targetAttr.name);
      alert(`'${targetAttr.name}' 속성 및 기존 ${usedProductCount}개 제품 내 해당 속성 데이터가 완전히 삭제되었습니다.`);
    }

    loadAttributes();
    setShowDeleteModal(false);
    setTargetAttr(null);
  };

  // 표시 방식 (고정 / 선택 / 숨김) 원클릭 즉시 변경 핸들러
  const handleUpdateDisplayMode = (id: string, modeType: '고정' | '선택' | '숨김') => {
    const current = getStoredAttributes();
    const updated = current.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          mode: modeType === '고정' ? ('고정' as AttributeMode) : ('선택' as AttributeMode),
          is_visible: modeType !== '숨김',
        };
      }
      return a;
    });
    saveAllAttributes(updated);
    setAttributes(updated.filter((a) => !a.is_deleted));
  };

  return (
    <div style={{ padding: isModal ? '20px 24px' : '24px 32px', maxWidth: '960px', fontFamily: 'sans-serif' }}>
      {/* 모달 모드 전용 상단 헤더 */}
      {isModal ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>제품 속성 설정</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              속성을 추가, 수정하거나 순서를 변경하세요. 창을 닫으면 제품 등록 폼에 즉시 적용됩니다.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '22px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px' }}
              title="닫기"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <>
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
              title="'고정' 속성은 제품 추가 시 항상 표출되고, '선택' 속성은 필요할 때 선택해 입력할 수 있습니다. 노출 여부를 꺼두시면 등록 폼에서 숨김 처리됩니다."
            >
              ?
            </span>
          </div>
        </>
      )}

      {/* 속성 관리 테이블 메인 영역 */}
      <div style={{ width: '100%' }}>
        {/* 테이블 헤더 (드래그 | 이름 | 종류 | 표시 방식 | 삭제) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 220px 80px',
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
          <div>표시 방식</div>
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
                gridTemplateColumns: '40px 1fr 120px 220px 80px',
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

              {/* 4열: 표시 방식 [고정 | 선택 | 숨김] 세그먼트 버튼 그룹 */}
              <div>
                {editingId === attr.id ? (
                  <select
                    value={editDisplayMode}
                    onChange={(e) => setEditDisplayMode(e.target.value as '고정' | '선택' | '숨김')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="고정">고정 (기본 표출)</option>
                    <option value="선택">선택 (필요 시 표출)</option>
                    <option value="숨김">숨김 (표출 안 함)</option>
                  </select>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      backgroundColor: '#f1f5f9',
                      padding: '2px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      gap: '2px',
                    }}
                  >
                    {/* 고정 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleUpdateDisplayMode(attr.id, '고정')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: attr.is_visible !== false && attr.mode === '고정' ? '#2563eb' : 'transparent',
                        color: attr.is_visible !== false && attr.mode === '고정' ? '#ffffff' : '#64748b',
                        boxShadow: attr.is_visible !== false && attr.mode === '고정' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="제품 추가 시 항상 기본으로 표시됩니다."
                    >
                      고정
                    </button>

                    {/* 선택 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleUpdateDisplayMode(attr.id, '선택')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: attr.is_visible !== false && attr.mode === '선택' ? '#2563eb' : 'transparent',
                        color: attr.is_visible !== false && attr.mode === '선택' ? '#ffffff' : '#64748b',
                        boxShadow: attr.is_visible !== false && attr.mode === '선택' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="제품 추가 시 '+ 속성 추가'를 눌러 선택할 수 있습니다."
                    >
                      선택
                    </button>

                    {/* 숨김 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleUpdateDisplayMode(attr.id, '숨김')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: attr.is_visible === false ? '#64748b' : 'transparent',
                        color: attr.is_visible === false ? '#ffffff' : '#64748b',
                        boxShadow: attr.is_visible === false ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="제품 등록 폼에서 완전히 숨깁니다."
                    >
                      숨김
                    </button>
                  </div>
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
                    onClick={() => handleDeleteClick(attr)}
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
              gridTemplateColumns: '40px 1fr 120px 220px 80px',
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

            {/* 신규 표시 방식 선택 드롭다운 (고정 / 선택 / 숨김) */}
            <div>
              <select
                value={selectedDisplayMode}
                onChange={(e) => setSelectedDisplayMode(e.target.value as '고정' | '선택' | '숨김')}
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
                <option value="숨김" style={{ color: '#0f172a' }}>숨김 (표출 안 함)</option>
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
                  setSelectedDisplayMode('선택');
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

      {/* ---------------------------------------------------------------------- */}
      {/* 속성 삭제 확인 confirmation 모달 (요구사항 1, 2, 3 완전 충족) */}
      {/* ---------------------------------------------------------------------- */}
      {showDeleteModal && targetAttr && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '500px',
              maxWidth: '90%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* 모달 헤더 (요구사항 3: 모달 제목 "속성 삭제 확인") */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}>⚠️</span> 속성 삭제 확인
              </h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ border: 'none', background: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* 본문 문구 (요구사항 3: 현재 N개의 제품이 [속성명] 속성을 사용하고 있습니다. 처리 방식을 선택해 주세요.) */}
            <div
              style={{
                fontSize: '14px',
                color: '#334155',
                lineHeight: '1.6',
                marginBottom: '20px',
                backgroundColor: '#f8fafc',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              현재 <strong style={{ color: '#ef4444' }}>{usedProductCount}개</strong>의 제품이{' '}
              <strong style={{ color: '#2563eb' }}>[{targetAttr.name}]</strong> 속성을 사용하고 있습니다. 처리 방식을 선택해 주세요.
            </div>

            {/* 라디오 버튼 선택지 그룹 (요구사항 2: 3가지 선택지 중 A, B 라디오 옵션) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* 옵션 A (기본값 / Radio Option 1): "기존 제품 속성 유지 (신규 숨김)" */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${deleteOption === 'OPTION_A' ? '#3b82f6' : '#cbd5e1'}`,
                  backgroundColor: deleteOption === 'OPTION_A' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="delete_option"
                  value="OPTION_A"
                  checked={deleteOption === 'OPTION_A'}
                  onChange={() => setDeleteOption('OPTION_A')}
                  style={{ marginTop: '3px', accentColor: '#3b82f6', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: deleteOption === 'OPTION_A' ? '#1e40af' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    기존 제품 속성 유지 (신규 숨김)
                    <span style={{ fontSize: '11px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>권장 / 기본값</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    기존에 등록된 제품 상세 페이지에서는 속성 데이터가 그대로 보존되어 표기되며, 신규 제품 등록/수정 폼에서는 해당 속성이 더 이상 노출되지 않습니다.
                  </div>
                </div>
              </label>

              {/* 옵션 B (Radio Option 2): "모든 제품에서 속성 완벽 삭제" */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${deleteOption === 'OPTION_B' ? '#ef4444' : '#cbd5e1'}`,
                  backgroundColor: deleteOption === 'OPTION_B' ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="delete_option"
                  value="OPTION_B"
                  checked={deleteOption === 'OPTION_B'}
                  onChange={() => setDeleteOption('OPTION_B')}
                  style={{ marginTop: '3px', accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: deleteOption === 'OPTION_B' ? '#991b1b' : '#1e293b' }}>
                    모든 제품에서 속성 완벽 삭제
                  </div>
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', lineHeight: 1.4, fontWeight: 500 }}>
                    ⚠️ 경고: 속성 정의 삭제와 함께 기존 {usedProductCount}개 제품에 등록된 해당 속성값 레코드까지 완전히 삭제되며 복구할 수 없습니다.
                  </div>
                </div>
              </label>
            </div>

            {/* 모달 하단 버튼 그룹 (요구사항 2: 옵션 C 취소 버튼 포함) */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {/* 옵션 C (취소 버튼): "제거하지 않는다" */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                제거하지 않는다 (취소)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: deleteOption === 'OPTION_B' ? '#ef4444' : '#3b82f6',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                삭제 처리 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 모드 하단 완료 및 닫기 버튼 */}
      {isModal && onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
            }}
          >
            완료 및 닫기
          </button>
        </div>
      )}
    </div>
  );
}
