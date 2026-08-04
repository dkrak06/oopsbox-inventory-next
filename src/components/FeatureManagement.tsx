/**
 * [FeatureManagement 컴포넌트]
 * 역할: 재고 부족 알림, 재고 공유 링크, 재고 조사 기능을 제공하며, 실제 박스히어로(BoxHero)의 명칭 및 Empty State 텍스트와 100% 동일하게 구성합니다.
 * 흐름: LocalStorage 연동 데이터 제어 -> 재고 조사 테이블 컬럼 동기화 -> 조사 내역 비어있을 시 박스히어로 전용 공지 문구 노출.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredItems, 
  updateItem, 
  getStoredShareLinks, 
  saveShareLink, 
  toggleShareLinkActive, 
  deleteShareLink, 
  getStoredInventoryCounts, 
  saveInventoryCount, 
  updateInventoryCountStatus, 
  deleteInventoryCount, 
  recordStockMovement, 
  Item, 
  ShareLink, 
  InventoryCount 
} from '@/lib/storage';

interface FeatureManagementProps {
  currentPath: 'low-stock' | 'inventory-link' | 'inventory-count' | string;
}

export default function FeatureManagement({ currentPath }: FeatureManagementProps) {
  // 메인 데이터 상태 관리
  const [items, setItems] = useState<Item[]>([]);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);

  // 1. 재고 부족 알림 관련 상태
  const [safetyThresholds, setSafetyThresholds] = useState<{ [itemId: string]: number }>({});

  // 2. 공유 링크 관련 상태
  const [newLinkName, setNewLinkName] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // 3. 재고 조사 관련 상태
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyQtys, setSurveyQtys] = useState<{ [itemId: string]: number }>({});

  // 데이터 동기화 로드
  useEffect(() => {
    const storedItems = getStoredItems();
    setItems(storedItems);
    setLinks(getStoredShareLinks());
    setCounts(getStoredInventoryCounts());

    // 기본 안전 재고 한계치 설정 (기본값 5)
    const thresholds: { [itemId: string]: number } = {};
    storedItems.forEach(item => {
      thresholds[item.id] = 5;
    });
    setSafetyThresholds(thresholds);
  }, [currentPath]);

  // 안전 재고 한계값 수정 핸들러
  const handleThresholdChange = (itemId: string, val: number) => {
    setSafetyThresholds(prev => ({ ...prev, [itemId]: val }));
  };

  // 재고 공유 링크 생성 핸들러
  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim()) return;

    const updated = saveShareLink({
      name: newLinkName,
      item_ids: selectedItemIds,
      is_active: true
    });
    setLinks(updated);
    setNewLinkName('');
    setSelectedItemIds([]);
    alert('재고 공유 링크가 신규로 활성화되었습니다.');
  };

  // 공유 활성화 토글 핸들러
  const handleToggleLink = (id: string) => {
    const updated = toggleShareLinkActive(id);
    setLinks(updated);
  };

  // 클립보드에 외부 재고 공유 URL 복사 핸들러
  const handleCopyLink = (token: string) => {
    const mockUrl = `https://app.boxhero.io/share/${token}`;
    navigator.clipboard.writeText(mockUrl)
      .then(() => alert(`클립보드에 공유 URL이 복사되었습니다:\n${mockUrl}`))
      .catch(() => alert('클립보드 복사 에러'));
  };

  // 공유 링크 삭제 핸들러
  const handleDeleteLink = (id: string) => {
    if (confirm('이 공유 링크를 정말 삭제하시겠습니까?')) {
      const updated = deleteShareLink(id);
      setLinks(updated);
    }
  };

  // 재고 조사 세션 생성 핸들러
  const handleStartSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle.trim()) return;

    // 현재 저장된 전산 재고 상태를 복제하여 시작
    const surveyItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      sku: item.sku,
      system_qty: item.total_quantity,
      actual_qty: item.total_quantity
    }));

    const updated = saveInventoryCount({
      title: surveyTitle,
      status: 'PROGRESS',
      items: surveyItems
    });

    setCounts(updated);
    setSurveyTitle('');
    setShowSurveyForm(false);

    // 조사 세션 임시 수량 바인딩
    const surveyInputs: { [itemId: string]: number } = {};
    surveyItems.forEach(i => {
      surveyInputs[i.item_id] = i.system_qty;
    });
    setSurveyQtys(surveyInputs);
  };

  // 조사 수량 수동 입력 핸들러
  const handleSurveyQtyChange = (itemId: string, qty: number) => {
    setSurveyQtys(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
  };

  // 실물 조사 수량 실사 조정값 최종 시스템 반영 핸들러 (ADJUST)
  const handleApplySurvey = (countId: string) => {
    const targetSurvey = counts.find(c => c.id === countId);
    if (!targetSurvey) return;

    if (confirm('실제 수량 조사 결과를 시스템 재고에 반영하고 조사를 완료하시겠습니까?')) {
      targetSurvey.items.forEach(sItem => {
        const inputQty = surveyQtys[sItem.item_id] !== undefined ? surveyQtys[sItem.item_id] : sItem.system_qty;
        const difference = inputQty - sItem.system_qty;

        if (difference !== 0) {
          recordStockMovement(sItem.item_id, 'ADJUST', inputQty, '기본 위치');
        }
      });

      const updated = updateInventoryCountStatus(countId, 'COMPLETED');
      setCounts(updated);
      setItems(getStoredItems());
      alert('실사 재고 조정 사항이 시스템에 반영되었으며 조사가 완료되었습니다.');
    }
  };

  // 조사 내역 삭제 핸들러
  const handleDeleteSurvey = (id: string) => {
    if (confirm('이 조사 내역을 정말 삭제하시겠습니까?')) {
      const updated = deleteInventoryCount(id);
      setCounts(updated);
    }
  };

  // 다중 품목 개별 선택 토글
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="feature-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      
      {/* 탭 1: 재고 부족 알림 뷰 (low-stock-alerts) */}
      {currentPath === 'low-stock' && (
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            추가기능 &gt; 재고 부족 알림
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>재고 부족 알림</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            설정된 안전 재고 기준 이하로 떨어진 제품들을 신속히 확인하여 부족 사태를 방지합니다.
          </p>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>바코드/SKU</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>제품명</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>현재고</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>안전재고 기준</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      등록된 제품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const threshold = safetyThresholds[item.id] || 5;
                    const isLow = item.total_quantity < threshold;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? '#fff5f5' : '#ffffff' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{item.sku}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.barcode}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                        <td style={{ padding: '12px 16px', color: isLow ? '#ef4444' : '#334155', fontWeight: 700 }}>
                          {item.total_quantity} 개
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="number"
                            min="0"
                            value={threshold}
                            onChange={(e) => handleThresholdChange(item.id, Number(e.target.value))}
                            style={{
                              width: '60px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: isLow ? '#fee2e2' : '#d1fae5',
                              color: isLow ? '#991b1b' : '#065f46'
                            }}
                          >
                            {isLow ? '⚠️ 재고 부족' : '✅ 안전'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 탭 2: 재고 공유 링크 뷰 (inventory-link/list) */}
      {currentPath === 'inventory-link' && (
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            추가기능 &gt; 재고 공유 링크
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>재고 공유 링크</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            외부 협력업체 또는 고객사에 실시간 재고 현황을 안전하게 공유할 수 있는 임시 외부 링크를 생성합니다.
          </p>

          <form 
            onSubmit={handleCreateLink}
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              display: 'grid',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>새로운 공유 링크 만들기</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>공유명</label>
              <input
                type="text"
                placeholder="예: 바이어 공유 전용 링크"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>공유할 품목 선택 (미선택 시 전체 공유)</label>
              <div 
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {items.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => handleToggleSelectItem(item.id)}
                    />
                    <span>{item.name} ({item.sku})</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                alignSelf: 'start'
              }}
            >
              공유 링크 생성
            </button>
          </form>

          <div style={{ display: 'grid', gap: '16px' }}>
            {links.map(l => (
              <div 
                key={l.id} 
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{l.name}</h4>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
                    <span>생성일: {l.created_at}</span>
                    <span>대상 품목: {l.item_ids.length === 0 ? '전체 품목' : `${l.item_ids.length}개 품목`}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleToggleLink(l.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: l.is_active ? '#d1fae5' : '#f1f5f9',
                      color: l.is_active ? '#065f46' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {l.is_active ? '활성 상태' : '비활성'}
                  </button>

                  <button
                    onClick={() => handleCopyLink(l.token)}
                    disabled={!l.is_active}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      backgroundColor: l.is_active ? '#3b82f6' : '#cbd5e1',
                      color: '#fff',
                      cursor: l.is_active ? 'pointer' : 'not-allowed'
                    }}
                  >
                    링크 복사
                  </button>

                  <button
                    onClick={() => handleDeleteLink(l.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #fca5a5',
                      fontSize: '12px',
                      backgroundColor: '#fef2f2',
                      color: '#991b1b',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 3: 재고 조사 뷰 (inventory-counts) - 박스히어로 실제 UI 문구 및 컬럼 100% 매칭 */}
      {currentPath === 'inventory-count' && (
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            추가기능 &gt; 재고 조사
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>재고 조사</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                창고에 실제로 보관된 품목들을 실사하여 전산상 재고 수량과의 편차를 맞추는 세션을 생성합니다.
              </p>
            </div>
            <button
              onClick={() => setShowSurveyForm(!showSurveyForm)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)'
              }}
            >
              <i className="fa-solid fa-clipboard-check"></i>
              {showSurveyForm ? '목록 보기' : '재고 조사 시작'}
            </button>
          </div>

          {/* 새 실사 생성 폼 */}
          {showSurveyForm && (
            <form 
              onSubmit={handleStartSurvey}
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>조사 세션 이름</label>
                <input
                  type="text"
                  placeholder="예: 2026년 8월 정기 재고 조사"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  required
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                조사 개시
              </button>
            </form>
          )}

          {/* 조사 진행 목록 - 박스히어로 실제 컬럼 및 비어있을 시 엠프티 스테이트 텍스트 이식 */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {counts.length === 0 ? (
              <div 
                style={{ 
                  padding: '60px 20px', 
                  background: '#fff', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  color: '#475569',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <i className="fa-solid fa-clipboard-list" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '16px' }}></i>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  등록된 재고 조사가 없습니다.
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  팀 멤버와 함께 실물 재고를 확인하고 수량을 정확하게 유지해 보세요.
                </div>
              </div>
            ) : (
              counts.map(survey => (
                <div 
                  key={survey.id} 
                  style={{
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <span 
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: survey.status === 'COMPLETED' ? '#f1f5f9' : '#dbeafe',
                          color: survey.status === 'COMPLETED' ? '#475569' : '#1d4ed8',
                          marginRight: '8px'
                        }}
                      >
                        {survey.status === 'COMPLETED' ? '조사 완료' : '조사 진행 중'}
                      </span>
                      <strong style={{ fontSize: '16px', color: '#1e293b' }}>{survey.title}</strong>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '12px' }}>{survey.created_at}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {survey.status === 'PROGRESS' && (
                        <button
                          onClick={() => handleApplySurvey(survey.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          실사 조정값 반영하기
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSurvey(survey.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#64748b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 조사 대상 아이템 목록 테이블 (실제 박스히어로 컬럼 동기화) */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>제품</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '100px' }}>위치</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '100px' }}>전산 수량</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '120px' }}>실사 수량</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '100px' }}>오차</th>
                      </tr>
                    </thead>
                    <tbody>
                      {survey.items.map(sItem => {
                        const inputVal = surveyQtys[sItem.item_id] !== undefined ? surveyQtys[sItem.item_id] : sItem.actual_qty;
                        const errorQty = inputVal - sItem.system_qty;
                        return (
                          <tr key={sItem.item_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{sItem.item_name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sItem.sku}</div>
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#475569' }}>
                              기본 위치
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#475569' }}>
                              {sItem.system_qty} 개
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                              {survey.status === 'PROGRESS' ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={inputVal}
                                  onChange={(e) => handleSurveyQtyChange(sItem.item_id, Number(e.target.value))}
                                  style={{
                                    width: '60px',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    textAlign: 'center'
                                  }}
                                />
                              ) : (
                                <span>{sItem.actual_qty} 개</span>
                              )}
                            </td>
                            <td 
                              style={{ 
                                padding: '10px 8px', 
                                textAlign: 'center', 
                                fontWeight: 700,
                                color: errorQty > 0 ? '#10b981' : errorQty < 0 ? '#ef4444' : '#64748b'
                              }}
                            >
                              {errorQty > 0 ? `+${errorQty}` : errorQty === 0 ? '0' : errorQty}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
