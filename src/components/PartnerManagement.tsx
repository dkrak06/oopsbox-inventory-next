/**
 * [PartnerManagement 컴포넌트]
 * 역할: 데이터 관리 -> 거래처 설정 화면을 제공합니다.
 * 흐름: 거래처 목록 조회, 실시간 검색, 즐겨찾기, 삭제, 신규 등록 모달 및 거래처 클릭 시 수정 모달(삭제/완료)을 처리합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredPartnerObjects, savePartnerObject, updatePartnerObject, deletePartnerObject, togglePartnerFavorite, PartnerItem } from '@/lib/storage';

export default function PartnerManagement() {
  const [partnerList, setPartnerList] = useState<PartnerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 체크박스 다중 선택 상태 (스크린샷 4 하단 액션바 연동)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 툴팁 팝업 상태 (스크린샷 2: '거래처 선택 목록에서 우선 정렬됩니다.')
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // 등록 모달 제어 상태
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDropdownAction, setShowDropdownAction] = useState<boolean>(false);

  // 수정 모달 제어 상태 (스크린샷 2 구현)
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);

  // 거래처 수정 폼 필드 상태
  const [editType, setEditType] = useState<'공급자' | '고객'>('공급자');
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editMemo, setEditMemo] = useState<string>('');
  const [editLanguage, setEditLanguage] = useState<string>('ko');

  // 거래처 등록 폼 상태
  const [partnerType, setPartnerType] = useState<'공급자' | '고객'>('공급자');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [language, setLanguage] = useState<string>('ko');

  // 마운트 시 저장소에서 데이터 로드
  useEffect(() => {
    setPartnerList(getStoredPartnerObjects());
  }, []);

  // 외부 클릭 시 엑셀 대량 추가 드롭다운 자동 닫힘 이펙트
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.excel-add-dropdown-wrapper')) {
        setShowDropdownAction(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 개별 체크박스 토글
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 전체 선택 / 해제 토글
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredPartners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPartners.map(p => p.id));
    }
  };

  // 선택된 항목 일괄 삭제
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개 거래처를 삭제하시겠습니까?`)) {
      let current = partnerList;
      selectedIds.forEach(id => {
        current = deletePartnerObject(id);
      });
      setPartnerList(current);
      setSelectedIds([]);
    }
  };

  // 거래처 클릭 시 수정 모달 오픈 핸들러 (스크린샷 2 구현)
  const handleOpenEditModal = (item: PartnerItem) => {
    setEditingPartner(item);
    setEditType(item.type || '공급자');
    setEditName(item.name || '');
    setEditPhone(item.phone || '');
    setEditEmail(item.email || '');
    setEditAddress(item.address || '');
    setEditMemo(item.memo || '');
    setEditLanguage(item.language || 'ko');
    setShowEditModal(true);
  };

  // 거래처 정보 수정 완료 제출 처리
  const handleUpdatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    if (!editName.trim()) {
      alert('거래처 이름을 입력해 주세요.');
      return;
    }

    const updated = updatePartnerObject(editingPartner.id, {
      type: editType,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      address: editAddress.trim(),
      memo: editMemo.trim(),
      language: editLanguage,
      isFavorite: editingPartner.isFavorite
    });

    setPartnerList(updated);
    setShowEditModal(false);
    setEditingPartner(null);
    alert(`'${editName.trim()}' 거래처 정보가 수정되었습니다!`);
  };

  // 신규 거래처 등록 처리 함수
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('거래처 이름을 입력해 주세요.');
      return;
    }

    const updated = savePartnerObject({
      type: partnerType,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      memo: memo.trim(),
      language
    });

    setPartnerList(updated);
    setShowAddModal(false);
    
    // 폼 셋팅 초기화
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setMemo('');
    setPartnerType('공급자');
    alert(`'${name.trim()}' 거래처가 성공적으로 등록되었습니다!`);
  };

  // 거래처 삭제 처리
  const handleDeletePartner = (id: string, partnerName: string) => {
    if (confirm(`'${partnerName}' 거래처를 삭제하시겠습니까?`)) {
      const updated = deletePartnerObject(id);
      setPartnerList(updated);
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // 특정 거래처 즐겨찾기 토글
  const handleToggleFavorite = (id: string) => {
    const updated = togglePartnerFavorite(id);
    setPartnerList(updated);
  };

  // 검색 키워드 필터링 및 즐겨찾기 상단 정렬
  const filteredPartners = partnerList
    .filter(p => {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) ||
             p.phone.toLowerCase().includes(q) ||
             p.email.toLowerCase().includes(q) ||
             p.address.toLowerCase().includes(q) ||
             p.memo.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '80px' }}>
      {/* 하얀색 대형 카드 박스 패널 (모든 요소 통합) */}
      <div className="boxhero-style-form" style={{ width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* 1. 하얀 카드 내부 최상단: 제목 경로 & + 거래처 추가 메인 버튼 행 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>데이터 관리</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>거래처 설정</h1>
              <i className="fa-regular fa-circle-question" style={{ color: '#3b82f6', fontSize: '18px', cursor: 'pointer' }}></i>
            </div>
          </div>

          {/* 우측 상단: + 거래처 추가 메인 버튼 (외부 클릭 감지 래퍼) */}
          <div className="excel-add-dropdown-wrapper" style={{ position: 'relative', display: 'flex' }}>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px 0 0 8px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i> 거래처 추가
            </button>
            <button
              type="button"
              onClick={() => setShowDropdownAction(prev => !prev)}
              style={{
                padding: '9px 10px',
                borderRadius: '0 8px 8px 0',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderLeft: '1px solid #1d4ed8',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }}></i>
            </button>

            {/* 드롭다운 옵션 (공급자/고객 엑셀 대량 추가) */}
            {showDropdownAction && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: '180px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                  zIndex: 200,
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => {
                    setShowDropdownAction(false);
                    alert('공급자 엑셀 대량 추가 모달 연동');
                  }}
                  style={{ padding: '10px 14px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}
                  className="search-item-hover"
                >
                  공급자 엑셀 대량 추가
                </div>
                <div
                  onClick={() => {
                    setShowDropdownAction(false);
                    alert('고객 엑셀 대량 추가 모달 연동');
                  }}
                  style={{ padding: '10px 14px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}
                  className="search-item-hover"
                >
                  고객 엑셀 대량 추가
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. 하얀 카드 내부 두번째 행: 검색창 & 엑셀 내보내기 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          {/* 검색창 */}
          <div style={{ position: 'relative', width: '380px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              className="form-input"
              placeholder="이름, 전화번호, 이메일, 주소, 메모 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', height: '40px', borderRadius: '8px', fontSize: '13px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* 우측 엑셀 내보내기 버튼 */}
          <button
            type="button"
            className="btn search-item-hover"
            onClick={() => alert('엑셀 파일 내보내기 기능이 실행되었습니다.')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize: '13px' }}></i> 엑셀 내보내기
          </button>
        </div>

        {/* 3. 시원시원한 거래처 목록 데이터 테이블 */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filteredPartners.length > 0 && selectedIds.length === filteredPartners.length}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>종류 <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px' }}></i></th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>이름</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>전화번호</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>이메일</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>주소</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>메모</th>
                {/* 헤더 툴팁 (스크린샷 2: '거래처 선택 목록에서 우선 정렬됩니다.') */}
                <th style={{ padding: '12px 16px', fontWeight: 700, width: '50px', textAlign: 'center', position: 'relative' }}>
                  <span
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fa-regular fa-circle-question" style={{ fontSize: '14px', color: '#94a3b8' }}></i>
                  </span>

                  {/* 블랙 캡슐 호버 툴팁 */}
                  {showTooltip && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-36px',
                        right: 0,
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 500
                      }}
                    >
                      거래처 선택 목록에서 우선 정렬됩니다.
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    등록된 거래처가 없습니다. 상단의 '+ 거래처 추가' 버튼을 눌러 새 거래처를 등록해 보세요!
                  </td>
                </tr>
              ) : (
                filteredPartners.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        color: '#1e293b',
                        backgroundColor: isChecked ? '#eff6ff' : 'transparent'
                      }}
                      className="search-item-hover"
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                        />
                      </td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>{item.type}</td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>{item.name}</td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', color: '#475569', cursor: 'pointer' }}>{item.phone || '-'}</td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', color: '#475569', cursor: 'pointer' }}>{item.email || '-'}</td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', color: '#475569', cursor: 'pointer' }}>{item.address || '-'}</td>
                      <td onClick={() => handleOpenEditModal(item)} style={{ padding: '12px 16px', color: '#475569', cursor: 'pointer' }}>{item.memo || '-'}</td>
                      {/* 별(★/☆) 즐겨찾기 토글 버튼 */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item.id);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                          title={item.isFavorite ? '우선정렬 해제' : '우선정렬 지정'}
                        >
                          <i className={`fa-${item.isFavorite ? 'solid' : 'regular'} fa-star`} style={{ color: item.isFavorite ? '#eab308' : '#cbd5e1' }}></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 하단 푸터 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>보기</span>
              <select style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                <option>30</option>
              </select>
            </div>
            <div>
              <span>1 - {filteredPartners.length} / {filteredPartners.length}</span>
            </div>
          </div>
        </div>

        {/* 하얀 카드 박스 내부 하단 중앙 고정 선택 액션 바 (위치 이동 0.00초 정중앙 고정 & 은은한 그라데이션 페이드인) */}
        {selectedIds.length > 0 && (
          <div
            className="fade-in-pure"
            style={{
              position: 'absolute',
              bottom: '-22px',
              left: 0,
              right: 0,
              margin: '0 auto',
              width: 'fit-content',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              zIndex: 900,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '12px 20px', fontWeight: 700, fontSize: '13px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              {selectedIds.length}개 선택됨
            </div>
            <button
              type="button"
              onClick={() => alert(`선택된 ${selectedIds.length}개 거래처 엑셀 내보내기`)}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRight: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <i className="fa-solid fa-arrow-up-from-bracket"></i> 엑셀 내보내기
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-trash-can"></i> 삭제
            </button>
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* 거래처 추가 모달 팝업 */}
      {/* ========================================== */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            
            {/* 모달 타이틀 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>거래처 추가</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleCreatePartner}>
              {/* 종류 (공급자 / 고객 라디오 버튼) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>종류</label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="partnerType"
                      value="공급자"
                      checked={partnerType === '공급자'}
                      onChange={() => setPartnerType('공급자')}
                    />
                    <span>공급자</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="partnerType"
                      value="고객"
                      checked={partnerType === '고객'}
                      onChange={() => setPartnerType('고객')}
                    />
                    <span>고객</span>
                  </label>
                </div>
              </div>

              {/* 이름 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>이름 <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="거래처 이름을 입력해 주세요."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>

              {/* 전화번호 & 이메일 2열 가로 정렬 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>전화번호</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="전화번호를 입력해 주세요."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>이메일</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="이메일 주소를 입력해 주세요."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 주소 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>주소</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="거래처 주소를 입력해 주세요."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 메모 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>메모</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="거래처 관련 메모를 입력해 주세요."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* 언어 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>언어</label>
                <select
                  className="form-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="ko">기본값</option>
                  <option value="en">영어</option>
                  <option value="es">스페인어</option>
                  <option value="fr">프랑스어</option>
                  <option value="pt">포르투갈어</option>
                  <option value="ru">러시아어</option>
                  <option value="id">인도네시아어</option>
                  <option value="ko_kr">한국어</option>
                  <option value="zh_cn">중국어(간체)</option>
                  <option value="zh_tw">중국어(번체)</option>
                  <option value="ja">일본어</option>
                  <option value="de">독일어</option>
                  <option value="vi">베트남어</option>
                  <option value="th">태국어</option>
                </select>
              </div>

              {/* 하단 취소 / 추가 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 거래처 수정 모달 팝업 (스크린샷 2 구현) */}
      {/* ========================================== */}
      {showEditModal && editingPartner && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.15s ease-out' }}>
            
            {/* 모달 타이틀 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>거래처 수정</h2>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleUpdatePartner}>
              {/* 이름 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>이름 <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>

              {/* 전화번호 & 이메일 2열 가로 정렬 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>전화번호</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>이메일</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 주소 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>주소</label>
                <input
                  type="text"
                  className="form-input"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 메모 */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>메모</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* 언어 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>언어</label>
                <select
                  className="form-input"
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="ko">기본값</option>
                  <option value="en">영어</option>
                  <option value="es">스페인어</option>
                  <option value="fr">프랑스어</option>
                  <option value="pt">포르투갈어</option>
                  <option value="ru">러시아어</option>
                  <option value="id">인도네시아어</option>
                  <option value="ko_kr">한국어</option>
                  <option value="zh_cn">중국어(간체)</option>
                  <option value="zh_tw">중국어(번체)</option>
                  <option value="ja">일본어</option>
                  <option value="de">독일어</option>
                  <option value="vi">베트남어</option>
                  <option value="th">태국어</option>
                </select>
              </div>

              {/* 하단 버튼 영역 (스크린샷 2: 좌측 빨간색 삭제, 우측 취소/완료) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleDeletePartner(editingPartner.id, editingPartner.name);
                    setShowEditModal(false);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    backgroundColor: '#ffffff',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    완료
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
