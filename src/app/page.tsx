/**
 * [HomePage 메인 페이지 컴포넌트]
 * 역할: 사이드바 입출고 컬러 아이콘 연동 및 신규 서브폴더 100% 경로 동적 라우팅 조립입니다.
 * 흐름: 새로 추가된 매출분석, 거래처설정, 결제정보 등 모든 서브폴더 클릭 시 대응하는 페이지를 표출합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProductForm from '@/components/ProductForm';
import ItemList from '@/components/ItemList';
import StockMovementForm from '@/components/StockMovementForm';
import HistoryView from '@/components/HistoryView';
import BarcodePrintView from '@/components/BarcodePrintView';
import GenericPageView from '@/components/GenericPageView';
import AuthModal from '@/components/AuthModal';
import { getStoredItems, Item } from '@/lib/storage';

export default function Home() {
  // 모바일 사이드바 상태
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  // 인증 모달 상태
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  // 선택된 네비게이션 경로
  const [currentPath, setCurrentPath] = useState<string>('dashboard');

  // 실시간 제품 목록 상태
  const [items, setItems] = useState<Item[]>([]);

  const refreshItems = () => {
    setItems(getStoredItems());
  };

  useEffect(() => {
    refreshItems();
  }, [currentPath]);

  // 스크린샷 1,2,3 전 전체 메뉴 타이틀 동적 생성 매핑 테이블
  const getPageTitle = (path: string): string => {
    const titles: { [key: string]: string } = {
      dashboard: '종합 대시보드',
      items: '제품 목록',
      'add-item': '제품 추가',
      'stock-in': '입고 등록',
      'stock-out': '출고 등록',
      'stock-adjust': '재고 조정',
      'stock-move': '재고 이동',
      history: '입출고 히스토리',
      buy: '구매 관리',
      sell: '판매 관리',
      returns: '반품 처리',
      shipments: '배송 관리',
      'barcode-item': '제품 바코드 인쇄',
      'barcode-bundle': '묶음제품 바코드 인쇄',
      'low-stock': '재고 부족 알림',
      'inventory-link': '재고 공유 링크',
      'inventory-count': '재고 조사',
      summary: '입출고 요약 리포트',
      'past-qty': '과거 수량 조회',
      'reports-dashboard': '종합 분석 대시보드',
      'inventory-analysis': '재고분석 리포트',
      'sales-analysis': '매출분석 리포트',
      'custom-reports': '커스텀 리포트',
      'master-items': '제품 목록 마스터',
      bundles: '묶음제품 관리',
      locations: '위치(창고) 설정',
      attributes: '속성 관리',
      partners: '거래처 설정',
      'price-templates': '가격 템플릿',
      'team-settings': '팀 설정',
      members: '멤버 권한 설정',
      notifications: '알림 설정',
      'order-settings': '구매/판매 환경 설정',
      integrations: '외부 서비스 연동',
      billing: '결제 정보',
    };
    return titles[path] || '웁스박스 재고관리';
  };

  // 대시보드 집계 연산
  const totalItemTypes = items.length;
  const totalQuantity = items.reduce((acc, item) => acc + item.total_quantity, 0);
  const lowStockCount = items.filter((item) => item.total_quantity < 5).length;

  return (
    <div className="app-container">
      {/* 1. 사이드바 메뉴 입출고 아이콘 컬러 및 팀 선택기 연결 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        currentPath={currentPath}
        onNavigate={(path) => {
          setCurrentPath(path);
          setSidebarOpen(false);
        }}
      />

      {/* 2. 메인 콘텐츠 영역 */}
      <div className="main-wrapper">
        <Header
          pageTitle={getPageTitle(currentPath)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="main-content">
          {/* 라우팅 조건 분기 */}
          {currentPath === 'dashboard' || currentPath === 'reports-dashboard' ? (
            <div>
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-title">전체 제품 종류</div>
                  <div className="card-value">{totalItemTypes} 개</div>
                  <div className="card-desc">현재 등록된 총 품목 수</div>
                </div>
                <div className="card">
                  <div className="card-title">총 재고 수량</div>
                  <div className="card-value">{totalQuantity.toLocaleString()} 개</div>
                  <div className="card-desc">모든 위치의 합산 재고</div>
                </div>
                <div className="card">
                  <div className="card-title">재고 부족 경고</div>
                  <div className="card-value text-danger">{lowStockCount} 개</div>
                  <div className="card-desc">수량 5개 미만 품목</div>
                </div>
              </div>

              <div className="boxhero-style-form" style={{ maxWidth: '1000px', marginTop: '24px' }}>
                <h2 className="section-title">최근 등록된 제품</h2>
                {items.length === 0 ? (
                  <p style={{ color: '#94a3b8', padding: '16px 0' }}>등록된 제품이 없습니다.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {items.slice(0, 5).map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block' }}>{item.name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{item.sku}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                            {item.total_quantity} 개
                          </span>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>
                            ₩{item.selling_price.toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : currentPath === 'items' ? (
            <ItemList onAddNew={() => setCurrentPath('add-item')} />
          ) : currentPath === 'add-item' ? (
            <ProductForm
              onSuccess={() => {
                refreshItems();
                setCurrentPath('items');
              }}
            />
          ) : currentPath === 'stock-in' ? (
            <StockMovementForm
              type="IN"
              onSuccess={() => {
                refreshItems();
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-out' ? (
            <StockMovementForm
              type="OUT"
              onSuccess={() => {
                refreshItems();
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-adjust' ? (
            <StockMovementForm
              type="ADJUST"
              onSuccess={() => {
                refreshItems();
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-move' ? (
            <StockMovementForm
              type="MOVE"
              onSuccess={() => {
                refreshItems();
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'history' ? (
            <HistoryView />
          ) : currentPath === 'barcode-item' || currentPath === 'barcode-bundle' ? (
            <BarcodePrintView />
          ) : (
            /* 기타 신규 서브폴더 페이지 표출 */
            <GenericPageView
              category="시스템 네비게이션"
              title={getPageTitle(currentPath)}
              icon="fa-folder-open"
              description={`[${getPageTitle(currentPath)}] 메뉴입니다. 관련 데이터 조회 및 환경 설정을 효율적으로 관리할 수 있습니다.`}
            />
          )}
        </main>
      </div>

      {/* 3. 인증 모달 */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
