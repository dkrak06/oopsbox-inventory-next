/**
 * [Header 컴포넌트]
 * 역할: 상단 헤더 영역으로 제목, 접속 상태 indicators, 실시간 시계 및 알림 아이콘을 표시합니다.
 * 흐름: 현재 페이지 제목과 연결 상태를 보여주며, 사이드바 토글 버튼 이벤트를 전달합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  pageTitle: string;
  onToggleSidebar: () => void;
}

export default function Header({ pageTitle, onToggleSidebar }: HeaderProps) {
  // 실시간 시간 표시를 위한 상태 관리
  const [currentTime, setCurrentTime] = useState<string>('');

  // 컴포넌트 마운트 시 1초마다 시계를 업데이트하는 타이머 생성
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${year}.${month}.${day} ${hours}:${minutes}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    
    // 언마운트 시 타이머 정리 (메모리 누수 방지)
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="main-header">
      <div className="header-left">
        {/* 모바일/소형 화면용 사이드바 열기 버튼 */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={onToggleSidebar} 
          aria-label="사이드바 열기"
          style={{ display: 'inline-flex' }}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <h2 className="header-title">{pageTitle}</h2>
      </div>

      <div className="header-right">
        {/* 서버/데이터 동기화 상태 표시 */}
        <span className="sync-indicator online" title="동기화 상태">
          <i className="fa-solid fa-circle"></i> 
          <span className="sync-text" style={{ fontSize: '12px', marginLeft: '4px' }}>연결됨</span>
        </span>
        {/* 실시간 시계 */}
        <span className="current-time">{currentTime}</span>
        {/* 알림 버튼 */}
        <button className="icon-btn" role="button" title="알림">
          <i className="fa-solid fa-bell"></i>
        </button>
      </div>
    </header>
  );
}
