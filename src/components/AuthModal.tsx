/**
 * [AuthModal 컴포넌트]
 * 역할: 로그인 및 회원가입 모달 대화상자를 제공합니다.
 * 흐름: state를 이용해 로그인/회원가입 폼을 전환하고 모달 닫기 및 폼 입력 제출을 관리합니다.
 */

'use client';

import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // 현재 모드 관리 state: 'login' 또는 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // 로그인 폼 State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 회원가입 폼 State
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [teamName, setTeamName] = useState('소소팀');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  // 로그인 제출 시뮬레이션
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`로그인 성공! 환영합니다, ${username}님.`);
    onClose();
  };

  // 회원가입 제출 시뮬레이션
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`가입 완료! 팀 [${teamName}]에 가입되었습니다.`);
    setMode('login');
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        {/* 모달 닫기 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* 로고 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              background: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontWeight: 'bold',
              color: '#3b82f6',
              fontSize: '20px',
            }}
          >
            <i className="fa-solid fa-box-archive" style={{ marginRight: '8px' }}></i>
            웁스박스 (OopsBox)
          </div>
        </div>

        {/* 로그인 섹션 */}
        {mode === 'login' ? (
          <div>
            <div className="card-subtitle">개인용 재고관리 시스템 로그인</div>
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>
                  사용자명 (ID)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="아이디를 입력하세요"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                로그인
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>계정이 없으신가요? </span>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                >
                  회원가입
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 회원가입 섹션 */
          <div>
            <div className="card-subtitle">개인용 재고관리 시스템 회원가입</div>
            <form onSubmit={handleSignupSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">사용자명 (ID)*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="사용할 아이디"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">비밀번호*</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="비밀번호 (4자 이상)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">회사 / 팀 이름*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 소소팀"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">이름*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="이름 입력"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                가입하기
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>이미 계정이 있으신가요? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                >
                  로그인
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
