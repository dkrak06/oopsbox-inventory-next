/**
 * [Sidebar 컴포넌트]
 * 역할: 입출고 아이콘 컬러(초록/빨강 ircle-arrow) 및 팀 선택기, 전체 하위 폴더 메뉴를 지원합니다.
 * 흐름: 스크린샷과 100% 동일하게 모든 카테고리별 세부 서브폴더 경로를 조립하고 활성화 형광 스타일을 적용합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Next.js 최적화 이미지 컴포넌트 임포트


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpenAuthModal,
  currentPath,
  onNavigate,
}: SidebarProps) {
  // 스크린샷 상의 모든 하위 폴더 경로 매핑 테이블
  const accordionGroups = {
    orders: ['buy', 'sell', 'returns', 'shipments'],
    barcode: ['barcode-item', 'barcode-bundle'],
    features: ['low-stock', 'inventory-link', 'inventory-count'],
    reports: ['summary', 'past-qty', 'reports-dashboard', 'inventory-analysis', 'sales-analysis', 'custom-reports'],
    data: ['master-items', 'bundles', 'locations', 'attributes', 'partners', 'price-templates'],
    settings: ['team-settings', 'members', 'notifications', 'order-settings', 'integrations', 'billing'],
  };

  // 아코디언 메뉴 개폐 상태 관리
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    orders: false,
    barcode: false,
    features: false,
    reports: false,
    data: false,
    settings: false,
  });

  // 선택된 메뉴가 포함된 아코디언 자동 열림
  useEffect(() => {
    Object.entries(accordionGroups).forEach(([key, paths]) => {
      if (paths.includes(currentPath)) {
        setOpenAccordions((prev) => ({ ...prev, [key]: true }));
      }
    });
  }, [currentPath]);

  // 아코디언 메뉴 토글 핸들러
  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <aside className="sidebar" style={{ transform: isOpen ? 'translateX(0)' : undefined }}>
        {/* 상단 로고 */}
        <div className="sidebar-header" style={{ justifyContent: 'center', padding: '12px 16px' }}>
          <div
            className="logo"
            onClick={() => onNavigate('dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {/* 파란색 박스 아이콘과 글자 대신 새로 등록한 가로형 로고 이미지로 교체 */}
            <Image
              src="/images/logo.png" // public/images/logo.png 경로 참조
              alt="웁스박스 로고"
              width={160} // 가로 크기 지정
              height={50} // 세로 크기 지정
              style={{ objectFit: 'contain' }} // 비율 유지를 위한 스타일 설정
              priority // 첫 로드 시 즉시 보이도록 우선 순위 부여
            />
          </div>
        </div>

        {/* 팀 선택 드롭다운 영역 (스크린샷 1 상단) */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
            소속 팀
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
              }}
              onClick={() => alert('팀 변경 기능')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-box-open" style={{ color: '#d97706' }}></i>
                <span>개인 재고관리 팀</span>
              </div>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
            </div>
            <button
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
              }}
              onClick={() => alert('새 팀 생성')}
              title="새 팀 만들기"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="sidebar-nav">
          <div className="menu-section">
            <div
              className={`menu-item ${currentPath === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-chart-pie menu-icon"></i>
              </span>
              <span className="menu-title">대시보드</span>
            </div>
            <div
              className={`menu-item ${currentPath === 'items' ? 'active' : ''}`}
              onClick={() => onNavigate('items')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-boxes-stacked menu-icon"></i>
              </span>
              <span className="menu-title">제품목록</span>
            </div>
          </div>

          <div className="menu-separator">재고 관리</div>

          {/* 스크린샷과 100% 동일한 입출고 아이콘 컬러 적용 */}
          <div className="menu-section">
            <div
              className={`menu-item ${currentPath === 'stock-in' ? 'active' : ''}`}
              onClick={() => onNavigate('stock-in')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-circle-arrow-down menu-icon" style={{ color: '#22c55e', fontSize: '18px' }}></i>
              </span>
              <span className="menu-title">입고 등록</span>
            </div>
            <div
              className={`menu-item ${currentPath === 'stock-out' ? 'active' : ''}`}
              onClick={() => onNavigate('stock-out')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-circle-arrow-up menu-icon" style={{ color: '#ef4444', fontSize: '18px' }}></i>
              </span>
              <span className="menu-title">출고 등록</span>
            </div>
            <div
              className={`menu-item ${currentPath === 'stock-adjust' ? 'active' : ''}`}
              onClick={() => onNavigate('stock-adjust')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <svg
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 13.5V2.5" />
                  <path d="M1.5 5.5L4.5 2.5L7.5 5.5" />
                  <path d="M12.5 2.5V13.5" />
                  <path d="M9.5 10.5L12.5 13.5L15.5 10.5" />
                </svg>
              </span>
              <span className="menu-title">재고 조정</span>
            </div>
            <div
              className={`menu-item ${currentPath === 'stock-move' ? 'active' : ''}`}
              onClick={() => onNavigate('stock-move')}
            >
              <span style={{ width: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-arrow-right menu-icon" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
              </span>
              <span className="menu-title">재고 이동</span>
            </div>
            <div
              className={`menu-item ${currentPath === 'history' ? 'active' : ''}`}
              onClick={() => onNavigate('history')}
            >
              <span style={{ width: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                <i className="fa-solid fa-clock-rotate-left menu-icon" style={{ fontSize: '16px' }}></i>
              </span>
              <span className="menu-title">히스토리</span>
            </div>
          </div>

          <div className="menu-separator">업무 프로세스</div>

          {/* 1. 구매 및 판매 아코디언 */}
          <div className={`accordion-item ${openAccordions.orders ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.orders.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('orders')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-cart-shopping menu-icon"></i>
                <span className="menu-title">구매 및 판매</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'buy' ? 'active' : ''}`} onClick={() => onNavigate('buy')}>
                  구매 관리
                </span>
                <span className={`sub-menu-item ${currentPath === 'sell' ? 'active' : ''}`} onClick={() => onNavigate('sell')}>
                  판매 관리
                </span>
                <span className={`sub-menu-item ${currentPath === 'returns' ? 'active' : ''}`} onClick={() => onNavigate('returns')}>
                  반품 처리
                </span>
                <span className={`sub-menu-item ${currentPath === 'shipments' ? 'active' : ''}`} onClick={() => onNavigate('shipments')}>
                  배송 관리
                </span>
              </div>
            </div>
          </div>

          {/* 2. 바코드 인쇄 아코디언 */}
          <div className={`accordion-item ${openAccordions.barcode ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.barcode.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('barcode')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-print menu-icon"></i>
                <span className="menu-title">바코드 인쇄</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'barcode-item' ? 'active' : ''}`} onClick={() => onNavigate('barcode-item')}>
                  제품 바코드
                </span>
                <span className={`sub-menu-item ${currentPath === 'barcode-bundle' ? 'active' : ''}`} onClick={() => onNavigate('barcode-bundle')}>
                  묶음제품 바코드
                </span>
              </div>
            </div>
          </div>

          {/* 3. 추가기능 아코디언 */}
          <div className={`accordion-item ${openAccordions.features ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.features.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('features')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-circle-plus menu-icon"></i>
                <span className="menu-title">추가기능</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'low-stock' ? 'active' : ''}`} onClick={() => onNavigate('low-stock')}>
                  재고 부족 알림
                </span>
                <span className={`sub-menu-item ${currentPath === 'inventory-link' ? 'active' : ''}`} onClick={() => onNavigate('inventory-link')}>
                  재고 공유 링크
                </span>
                <span className={`sub-menu-item ${currentPath === 'inventory-count' ? 'active' : ''}`} onClick={() => onNavigate('inventory-count')}>
                  재고 조사
                </span>
              </div>
            </div>
          </div>

          {/* 4. 분석 리포트 아코디언 (스크린샷 2 하위폴더 모두 포함) */}
          <div className={`accordion-item ${openAccordions.reports ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.reports.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('reports')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-chart-line menu-icon"></i>
                <span className="menu-title">분석 리포트</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'summary' ? 'active' : ''}`} onClick={() => onNavigate('summary')}>
                  입출고 요약
                </span>
                <span className={`sub-menu-item ${currentPath === 'past-qty' ? 'active' : ''}`} onClick={() => onNavigate('past-qty')}>
                  과거 수량 조회
                </span>
                <span className={`sub-menu-item ${currentPath === 'reports-dashboard' ? 'active' : ''}`} onClick={() => onNavigate('reports-dashboard')}>
                  종합 대시보드
                </span>
                <span className={`sub-menu-item ${currentPath === 'inventory-analysis' ? 'active' : ''}`} onClick={() => onNavigate('inventory-analysis')}>
                  재고분석
                </span>
                <span className={`sub-menu-item ${currentPath === 'sales-analysis' ? 'active' : ''}`} onClick={() => onNavigate('sales-analysis')}>
                  매출분석
                </span>
                <span className={`sub-menu-item ${currentPath === 'custom-reports' ? 'active' : ''}`} onClick={() => onNavigate('custom-reports')}>
                  커스텀 리포트
                </span>
              </div>
            </div>
          </div>

          {/* 5. 데이터 관리 아코디언 (스크린샷 2 & 3 거래처 설정, 가격 템플릿 포함) */}
          <div className={`accordion-item ${openAccordions.data ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.data.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('data')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-database menu-icon"></i>
                <span className="menu-title">데이터 관리</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'master-items' ? 'active' : ''}`} onClick={() => onNavigate('master-items')}>
                  제품 목록 마스터
                </span>
                <span className={`sub-menu-item ${currentPath === 'bundles' ? 'active' : ''}`} onClick={() => onNavigate('bundles')}>
                  묶음제품 관리
                </span>
                <span className={`sub-menu-item ${currentPath === 'locations' ? 'active' : ''}`} onClick={() => onNavigate('locations')}>
                  위치(창고) 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'attributes' ? 'active' : ''}`} onClick={() => onNavigate('attributes')}>
                  속성 관리
                </span>
                <span className={`sub-menu-item ${currentPath === 'partners' ? 'active' : ''}`} onClick={() => onNavigate('partners')}>
                  거래처 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'price-templates' ? 'active' : ''}`} onClick={() => onNavigate('price-templates')}>
                  가격 템플릿
                </span>
              </div>
            </div>
          </div>

          {/* 6. 시스템 설정 아코디언 (스크린샷 3 전체 하위폴더 포함) */}
          <div className={`accordion-item ${openAccordions.settings ? 'open' : ''}`}>
            <div
              className={`accordion-header ${
                accordionGroups.settings.includes(currentPath) ? 'has-active-child' : ''
              }`}
              onClick={() => toggleAccordion('settings')}
            >
              <span className="accordion-title-wrapper">
                <i className="fa-solid fa-gear menu-icon"></i>
                <span className="menu-title">시스템 설정</span>
              </span>
              <i className="fa-solid fa-chevron-down accordion-arrow"></i>
            </div>
            <div className="accordion-wrapper">
              <div className="accordion-content">
                <span className={`sub-menu-item ${currentPath === 'team-settings' ? 'active' : ''}`} onClick={() => onNavigate('team-settings')}>
                  팀 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'members' ? 'active' : ''}`} onClick={() => onNavigate('members')}>
                  멤버 권한 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'notifications' ? 'active' : ''}`} onClick={() => onNavigate('notifications')}>
                  알림 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'order-settings' ? 'active' : ''}`} onClick={() => onNavigate('order-settings')}>
                  구매/판매 환경 설정
                </span>
                <span className={`sub-menu-item ${currentPath === 'integrations' ? 'active' : ''}`} onClick={() => onNavigate('integrations')}>
                  외부 서비스 연동
                </span>
                <span className={`sub-menu-item ${currentPath === 'billing' ? 'active' : ''}`} onClick={() => onNavigate('billing')}>
                  결제 정보
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* 사이드바 하단 프로필 */}
        <div className="sidebar-footer">
          <div
            className="user-profile"
            onClick={onOpenAuthModal}
            style={{ cursor: 'pointer' }}
            title="클릭하여 로그인/로그아웃"
          >
            <div className="avatar">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div className="user-info">
              <span className="name">0000</span>
              <span className="role">Master Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 모바일 화면용 오버레이 */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 95,
          }}
        />
      )}
    </>
  );
}
