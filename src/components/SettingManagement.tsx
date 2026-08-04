/**
 * [SettingManagement 컴포넌트]
 * 역할: 팀 설정, 멤버 권한, 시스템 알림, 구매/판매 룰, 서비스 연동, 가상 청구 결제를 처리합니다.
 * 흐름: currentPath 분기를 통해 각 환경 설정 인터페이스를 노출하며, 로컬 상태를 활용해 설정 변경 및 모의 결제/멤버 초대를 시뮬레이션합니다.
 */

'use client';

import React, { useState } from 'react';

interface SettingManagementProps {
  currentPath: 'team-settings' | 'members' | 'notifications' | 'order-settings' | 'integrations' | 'billing' | string;
}

interface Member {
  id: string;
  email: string;
  role: 'Admin' | 'Member' | 'Read-Only';
  status: '활성' | '초대중';
}

export default function SettingManagement({ currentPath }: SettingManagementProps) {
  
  // 1. 팀 설정 상태
  const [teamName, setTeamName] = useState('웁스박스 재고관리팀');
  const [teamDescription, setTeamDescription] = useState('개인 및 소규모 비즈니스를 위한 스마트 재고 스페이스');

  // 2. 멤버 설정 상태 (가상 리스트)
  const [members, setMembers] = useState<Member[]>([
    { id: 'M-1', email: 'master@oopsbox.io', role: 'Admin', status: '활성' },
    { id: 'M-2', email: 'tutor@nextdev.co.kr', role: 'Member', status: '활성' },
    { id: 'M-3', email: 'guest@sample.com', role: 'Read-Only', status: '초대중' }
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member' | 'Read-Only'>('Member');

  // 3. 알림 설정 상태
  const [alertLowStock, setAlertLowStock] = useState(true);
  const [alertNewOrder, setAlertNewOrder] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/...');

  // 4. 구매/판매 설정 상태
  const [currency, setCurrency] = useState('KRW');
  const [vatRate, setVatRate] = useState<number>(10); // 기본 부가세 10%
  const [autoBarcode, setAutoBarcode] = useState(true);

  // 5. 결제 요금제 선택 상태
  const [billingPlan, setBillingPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  // 멤버 초대 핸들러
  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (members.some(m => m.email === inviteEmail.trim())) {
      alert('이미 등록되었거나 초대 중인 이메일입니다.');
      return;
    }

    const newMem: Member = {
      id: 'M-' + Date.now(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: '초대중'
    };

    setMembers(prev => [...prev, newMem]);
    setInviteEmail('');
    alert(`${inviteEmail}님에게 초대 메일을 발송했습니다.`);
  };

  // 멤버 역할 변경 핸들러
  const handleRoleChange = (id: string, role: 'Admin' | 'Member' | 'Read-Only') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    alert('권한 역할이 변경되었습니다.');
  };

  // 멤버 삭제 핸들러
  const handleDeleteMember = (id: string) => {
    if (confirm('이 멤버의 권한을 회수하고 제거하시겠습니까?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="setting-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      
      {/* 탭 1: 팀 설정 */}
      {currentPath === 'team-settings' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
            팀 정보 관리
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>재고 관리 팀 이름</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>팀 설명 / 메모</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
            <button
              onClick={() => alert('팀 설정 정보가 저장되었습니다.')}
              style={{
                padding: '9px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                alignSelf: 'start',
                fontSize: '14px'
              }}
            >
              팀 정보 저장
            </button>
          </div>
        </div>
      )}

      {/* 탭 2: 멤버 설정 */}
      {currentPath === 'members' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* 멤버 초대 폼 */}
          <form 
            onSubmit={handleInviteMember}
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>초대할 멤버 이메일</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>권한 등급</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="Admin">Admin (모든 권한)</option>
                <option value="Member">Member (수정 권한)</option>
                <option value="Read-Only">Read-Only (조회 전용)</option>
              </select>
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
                fontSize: '14px',
                height: '38px'
              }}
            >
              초대 발송
            </button>
          </form>

          {/* 멤버 목록 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>사용자 이메일</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>상태</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>권한 역할 설정</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>{m.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: m.status === '활성' ? '#d1fae5' : '#fef9c3',
                          color: m.status === '활성' ? '#065f46' : '#854d0e'
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as any)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                        <option value="Read-Only">Read-Only</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        제외
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 탭 3: 알림 설정 */}
      {currentPath === 'notifications' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            알림 트리거 및 외부 협업 툴 연동
          </h2>

          {/* 슬랙 연동 토글 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>안전 재고 부족 알림</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>품목이 안전재고 수준 미만으로 떨어졌을 때 대시보드 및 연동 채널에 경고를 보냅니다.</div>
            </div>
            <input
              type="checkbox"
              checked={alertLowStock}
              onChange={() => setAlertLowStock(!alertLowStock)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>신규 구매/판매 발송 메일 알림</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>협력업체 전표가 완료 상태로 전환될 시 자동 확인 메일을 전송합니다.</div>
            </div>
            <input
              type="checkbox"
              checked={alertNewOrder}
              onChange={() => setAlertNewOrder(!alertNewOrder)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* 슬랙 Webhook */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Slack Webhook URL</label>
            <input
              type="text"
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155' }}
            />
          </div>

          <button
            onClick={() => alert('알림 설정 정보가 저장되었습니다.')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              alignSelf: 'start',
              fontSize: '14px'
            }}
          >
            설정 저장
          </button>
        </div>
      )}

      {/* 탭 4: 구매/판매 환경 설정 */}
      {currentPath === 'order-settings' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'grid', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
            업무 환경 및 전표 룰 설정
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>전산 기준 화폐 단위</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="KRW">KRW (₩) - 대한민국 원</option>
                <option value="USD">USD ($) - 미국 달러</option>
                <option value="JPY">JPY (¥) - 일본 엔</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>세율 설정 (%)</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>신규 품목 추가 시 바코드 자동 생성</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>품목 등록 폼에서 바코드를 미입력할 시 자체 표준 바코드 난수를 자동 채움합니다.</div>
            </div>
            <input
              type="checkbox"
              checked={autoBarcode}
              onChange={() => setAutoBarcode(!autoBarcode)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={() => alert('업무 환경 설정이 성공적으로 반영되었습니다.')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              alignSelf: 'start',
              fontSize: '14px'
            }}
          >
            설정 저장
          </button>
        </div>
      )}

      {/* 탭 5: 외부 서비스 연동 설정 */}
      {currentPath === 'integrations' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            API 및 외부 마켓플레이스 연동
          </h2>

          <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>
            외부 연동 모듈을 활성화하면 네이버 스마트스토어, 쿠팡 등 온/오프라인 쇼핑몰 주문과 실시간으로 연계하여 출고 전표를 자동 발행해 줍니다.
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div>
                <strong>네이버 스마트스토어 연동 모듈</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>스마트스토어 주문 자동 수집 및 출고 등록</div>
              </div>
              <button 
                onClick={() => alert('네이버 쇼핑 API 연동 인증 모달이 열립니다.')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                연동 연결
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div>
                <strong>쿠팡 윙 (Coupang Wing) API 연동</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>매 10분 간격 쿠팡 결제완료 주문 자동 수입</div>
              </div>
              <button 
                onClick={() => alert('쿠팡 API Key 등록 페이지로 이동합니다.')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                연동 연결
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 6: 결제 정보 설정 */}
      {currentPath === 'billing' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          
          {/* 요금제 카드 구성 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* 무료 요금제 */}
            <div style={{ 
              background: '#ffffff', 
              padding: '24px', 
              borderRadius: '12px', 
              border: billingPlan === 'free' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
              textAlign: 'center',
              position: 'relative'
            }}>
              {billingPlan === 'free' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>사용 중</span>}
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>무료 스타터 (Free)</h3>
              <div style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0', color: '#1e293b' }}>0 원</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>품목수 100개 제한, 단일 관리자 등 재고관리 기초 기능 체험 가능</p>
              <button 
                onClick={() => setBillingPlan('free')}
                disabled={billingPlan === 'free'}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: billingPlan === 'free' ? 'default' : 'pointer', fontWeight: 600 }}
              >
                {billingPlan === 'free' ? '사용 중' : '무료 전환'}
              </button>
            </div>

            {/* 프로 요금제 */}
            <div style={{ 
              background: '#ffffff', 
              padding: '24px', 
              borderRadius: '12px', 
              border: billingPlan === 'pro' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
              textAlign: 'center',
              position: 'relative'
            }}>
              {billingPlan === 'pro' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>사용 중</span>}
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>프로페셔널 (Pro)</h3>
              <div style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0', color: '#3b82f6' }}>49,000 원 <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>/ 월</span></div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>품목 무제한, 3인 이하 협업, 위치(창고) 관리 및 다중 정렬 지원</p>
              <button 
                onClick={() => {
                  setBillingPlan('pro');
                  alert('가상 결제 프로세스가 진행되어 Pro 플랜으로 구독되었습니다.');
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                {billingPlan === 'pro' ? '구독 사용 중' : '프로 요금제 결제'}
              </button>
            </div>

            {/* 엔터프라이즈 요금제 */}
            <div style={{ 
              background: '#ffffff', 
              padding: '24px', 
              borderRadius: '12px', 
              border: billingPlan === 'enterprise' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>엔터프라이즈 (Custom)</h3>
              <div style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0', color: '#1e293b' }}>별도 문의</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>수량 무제한, 대규모 권한 등급 커스텀, API 연동 지원 및 전담 케어</p>
              <button 
                onClick={() => alert('상담 신청 폼 링크로 연동됩니다.')}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
              >
                상담 신청하기
              </button>
            </div>

          </div>

          {/* 가상 청구 내역 및 카드 설정 */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>결제 수단 및 청구 정보</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
              <div>
                <strong>💳 국민카드 (**** - **** - **** - 4593)</strong>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>다음 결제일: 2026-09-01 (자동 갱신 예정)</div>
              </div>
              <button 
                onClick={() => alert('결제 카드 정보 변경 창이 로드됩니다.')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
              >
                수단 변경
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
