/**
 * [LocationManagement 컴포넌트]
 * 역할: 데이터 관리 > 위치 메뉴에서 보관 위치(창고)의 목록 조회, 추가, 수정, 삭제 및 실시간 위치별 총 재고 수량을 관리합니다.
 * 흐름: LocalStorage(hb_location_objects)에서 위치 데이터를 로드하고, 제품별 저장소(hb_items)에서 각 위치의 재고 합산을 계산하여 표출합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredLocationObjects,
  saveLocationObject,
  updateLocationObject,
  deleteLocationObject,
  getLocationTotalStock,
  LocationItem,
} from '@/lib/storage';

export default function LocationManagement() {
  // 위치 데이터 및 검색어 상태 관리
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 위치 추가 모달 개폐 및 입력 상태
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addMemo, setAddMemo] = useState<string>('');

  // 위치 수정 모달 개폐 및 입력 상태
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editMemo, setEditMemo] = useState<string>('');

  // 초기 마운트 시 위치 목록 데이터 불러오기
  const loadData = () => {
    const data = getStoredLocationObjects();
    setLocations(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 신규 위치 저장 처리 함수
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      alert('위치 이름을 입력해 주세요.');
      return;
    }

    // 중복 이름 체크
    if (locations.some(loc => loc.name.trim() === addName.trim())) {
      alert('이미 존재하는 위치 이름입니다.');
      return;
    }

    const updated = saveLocationObject({
      name: addName.trim(),
      memo: addMemo.trim(),
    });

    setLocations(updated);
    setAddName('');
    setAddMemo('');
    setShowAddModal(false);
    alert(`'${addName.trim()}' 위치가 추가되었습니다!`);
  };

  // 위치 수정 저장 처리 함수
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    if (!editName.trim()) {
      alert('위치 이름을 입력해 주세요.');
      return;
    }

    // 다른 위치와 중복 이름 체크
    if (locations.some(loc => loc.id !== editingLocation.id && loc.name.trim() === editName.trim())) {
      alert('이미 존재하는 위치 이름입니다.');
      return;
    }

    const updated = updateLocationObject(editingLocation.id, {
      name: editName.trim(),
      memo: editMemo.trim(),
    });

    setLocations(updated);
    setEditingLocation(null);
    alert(`'${editName.trim()}' 위치 정보가 수정되었습니다!`);
  };

  // 위치 삭제 처리 함수
  const handleDelete = (loc: LocationItem) => {
    if (loc.name === '기본 위치') {
      alert('\'기본 위치\'는 시스템 기본값이므로 삭제할 수 없습니다.');
      return;
    }

    const currentStock = getLocationTotalStock(loc.name);
    if (currentStock > 0) {
      if (!confirm(`'${loc.name}' 위치에 현재 ${currentStock}개의 재고가 존재합니다. 정말 삭제하시겠습니까?`)) {
        return;
      }
    } else {
      if (!confirm(`'${loc.name}' 위치를 삭제하시겠습니까?`)) {
        return;
      }
    }

    const updated = deleteLocationObject(loc.id);
    setLocations(updated);
    alert('삭제되었습니다.');
  };

  // 정렬 상태 관리 (sortField: 'name' | 'memo' | 'stock' | null, sortDirection: 'asc' | 'desc')
  const [sortField, setSortField] = useState<'name' | 'memo' | 'stock' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 컬럼 헤더 클릭 시 오름차순(asc)과 내림차순(desc) 2단계 무한 반복 토글 (초기에는 안 보이다가 클릭 시 위/아래 반복)
  const handleSort = (field: 'name' | 'memo' | 'stock') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 검색어에 따른 위치 필터링 로직
  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.memo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 정렬 옵션이 적용된 최종 위치 목록 데이터
  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (!sortField) return 0;

    if (sortField === 'name') {
      const res = a.name.localeCompare(b.name, 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'memo') {
      const res = (a.memo || '').localeCompare(b.memo || '', 'ko');
      return sortDirection === 'asc' ? res : -res;
    }
    if (sortField === 'stock') {
      const stockA = getLocationTotalStock(a.name);
      const stockB = getLocationTotalStock(b.name);
      return sortDirection === 'asc' ? stockA - stockB : stockB - stockA;
    }
    return 0;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '60px' }}>
      {/* 1. 상단 경로 네비게이션 및 헤더 타이틀 영역 */}
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
        데이터 관리
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>위치</h1>
          <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
        </div>

        {/* 액션 버튼 그룹 (+ 위치 추가, 엑셀 가져오기, 더보기) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowAddModal(true)}
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
            <i className="fa-solid fa-plus"></i> 위치 추가
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

      {/* 2. 위치 검색 인풋 및 엑셀 내보내기 링크 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}></i>
          <input
            type="text"
            placeholder="위치 검색"
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

        <button
          type="button"
          onClick={() => alert('엑셀 내보내기 기능 준비 중')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i> 엑셀 내보내기
        </button>
      </div>

      {/* 3. 위치 목록 데이터 테이블 (tableLayout: fixed 로 클릭 시 컬럼 폭 및 텍스트 위치 완전 고정) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: '14px 20px', width: '30%', cursor: 'pointer', userSelect: 'none' }}
                className="search-item-hover"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>이름</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                    {sortField === 'name' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '11px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>
              <th
                onClick={() => handleSort('memo')}
                style={{ padding: '14px 20px', width: '40%', cursor: 'pointer', userSelect: 'none' }}
                className="search-item-hover"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>메모</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                    {sortField === 'memo' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '11px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>
              <th
                onClick={() => handleSort('stock')}
                style={{ padding: '14px 20px', width: '15%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                className="search-item-hover"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <span>재고 수량</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                    {sortField === 'stock' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className={`fa-solid ${sortDirection === 'asc' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'}`} style={{ fontSize: '11px' }}></i>
                      </span>
                    )}
                  </span>
                </div>
              </th>
              <th style={{ padding: '14px 20px', width: '15%', textAlign: 'right' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedLocations.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                  등록된 위치 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedLocations.map((loc) => {
                const totalStock = getLocationTotalStock(loc.name);
                return (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }} className="search-item-hover">
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a' }}>
                      {loc.name}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>
                      {loc.memo || '-'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: totalStock > 0 ? '#0f172a' : '#94a3b8' }}>
                      {totalStock.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocation(loc);
                            setEditName(loc.name);
                            setEditMemo(loc.memo);
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(loc)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. 신규 위치 추가 모달 */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>새 위치 추가</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  위치 이름 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: B창고, 1번 선반"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  메모
                </label>
                <textarea
                  rows={3}
                  placeholder="위치 관련 메모 입력"
                  value={addMemo}
                  onChange={(e) => setAddMemo(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 위치 정보 수정 모달 */}
      {editingLocation && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>위치 정보 수정</h2>
              <button type="button" onClick={() => setEditingLocation(null)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  위치 이름 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  메모
                </label>
                <textarea
                  rows={3}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
