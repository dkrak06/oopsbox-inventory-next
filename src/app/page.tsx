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
import PartnerManagement from '@/components/PartnerManagement';
import LocationManagement from '@/components/LocationManagement';
import MasterItemsManagement from '@/components/MasterItemsManagement';
import BundleManagement from '@/components/BundleManagement';
import AuthModal from '@/components/AuthModal';
import { getStoredItems, getStoredHistories, Item, StockHistory } from '@/lib/storage'; // 로컬 저장소 유틸리티 임포트 및 타입 추가


export default function Home() {
  // 모바일 사이드바 상태
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  // 인증 모달 상태
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  // 선택된 네비게이션 경로
  const [currentPath, setCurrentPath] = useState<string>('dashboard');

  // 제품 목록에서 입출고 폼으로 이동 시 선택된 제품, 위치, 거래처 연동 상태 (사용자 요청 반영)
  const [selectedMovementItem, setSelectedMovementItem] = useState<Item | null>(null);
  const [selectedMovementLocation, setSelectedMovementLocation] = useState<string | null>(null);
  const [selectedMovementPartner, setSelectedMovementPartner] = useState<string | null>(null);
  // 입출고 폼을 강제 재마운트하기 위한 key (값이 바뀔 때마다 컴포넌트가 초기화됨)
  const [movementKey, setMovementKey] = useState<number>(0);

  // 실시간 제품 목록 상태
  const [items, setItems] = useState<Item[]>([]);
  // 실시간 재고 변동 히스토리 상태 (최근 입출고 내역 바인딩용)
  const [histories, setHistories] = useState<StockHistory[]>([]);

  // 제품 목록과 히스토리 데이터를 동시에 갱신하는 헬퍼 함수
  const refreshData = () => {
    setItems(getStoredItems());
    setHistories(getStoredHistories());
  };

  useEffect(() => {
    refreshData();
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

  // 대시보드 상단 카드용 집계 연산
  const totalItemTypes = items.length; // 1. 전체 품목 종류 수
  const totalQuantity = items.reduce((acc, item) => acc + item.total_quantity, 0); // 2. 창고 전체 합산 수량
  const lowStockCount = items.filter((item) => item.total_quantity < 5).length; // 3. 5개 미만인 부족 건수
  const totalHistoryCount = histories.length; // 4. 전체 거래 레코드 건수

  return (
    <div className="app-container">
      {/* 1. 사이드바 메뉴 입출고 아이콘 컬러 및 팀 선택기 연결 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        currentPath={currentPath}
        onNavigate={(path) => {
          // 사이드바 직접 접근 시 이전의 movement 컨텍스트(item/loc/partner) 전체 초기화
          setSelectedMovementItem(null);
          setSelectedMovementLocation(null);
          setSelectedMovementPartner(null);
          // stock 관련 경로로 이동 시 movementKey 갱신 → 폼 강제 재마운트 (이전 위치/거래처 상태 완전 초기화)
          if (path.startsWith('stock-')) {
            setMovementKey(Date.now());
          }
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

        <main className="main-content page-content-fade">
          {/* 라우팅 조건 분기 */}
          {currentPath === 'dashboard' || currentPath === 'reports-dashboard' ? (
            <div className="dashboard-container">
              {/* 상단 4열 요약 카드 그리드 */}
              <div className="dashboard-grid">
                {/* 카드 1: 등록된 제품 종류 */}
                <div className="card">
                  <div className="card-info">
                    <div className="card-title">등록된 제품 종류</div>
                    <div className="card-value">{totalItemTypes} <span className="unit">종</span></div>
                    <div className="card-desc">총 보관 마스터 품목수</div>
                  </div>
                  <i className="fa-solid fa-boxes-stacked card-bg-icon"></i>
                </div>
                
                {/* 카드 2: 총 재고 수량 */}
                <div className="card">
                  <div className="card-info">
                    <div className="card-title">총 재고 수량</div>
                    <div className="card-value">{totalQuantity.toLocaleString()} <span className="unit">개</span></div>
                    <div className="card-desc">창고 전체 품목 합산</div>
                  </div>
                  <i className="fa-solid fa-warehouse card-bg-icon"></i>
                </div>
                
                {/* 카드 3: 안전 재고 부족 (수량 5개 미만 시 노란색/빨간색 강조) */}
                <div className="card warning">
                  <div className="card-info">
                    <div className="card-title">안전 재고 부족</div>
                    <div className="card-value text-danger">{lowStockCount} <span className="unit">건</span></div>
                    <div className="card-desc">신속한 입고 검토 필요</div>
                  </div>
                  <i className="fa-solid fa-triangle-exclamation card-bg-icon text-danger-icon"></i>
                </div>
                
                {/* 카드 4: 총 입출고 건수 */}
                <div className="card">
                  <div className="card-info">
                    <div className="card-title">총 입출고 건수</div>
                    <div className="card-value">{totalHistoryCount} <span className="unit">건</span></div>
                    <div className="card-desc">누적된 이력 레코드</div>
                  </div>
                  <i className="fa-solid fa-clock-rotate-left card-bg-icon"></i>
                </div>
              </div>

              {/* 최근 입출고 변동 내역 테이블 카드 */}
              <div className="dashboard-table-card">
                <div className="table-card-header">
                  <h3 className="table-card-title">최근 입출고 변동 내역</h3>
                  <button className="btn-more" onClick={() => setCurrentPath('history')}>더 보기</button>
                </div>
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>전산 번호</th>
                        <th>제품명</th>
                        <th>변동구분</th>
                        <th>수량</th>
                        <th>일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {histories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="no-data">내역이 없습니다.</td>
                        </tr>
                      ) : (
                        histories.slice(0, 5).map((history) => (
                          <tr key={history.id}>
                            <td className="sku-cell">{history.id}</td>
                            <td className="name-cell">{history.item_name}</td>
                            <td>
                              <span className={`badge badge-${history.type.toLowerCase()}`}>
                                {history.type_label}
                              </span>
                            </td>
                            <td className={`qty-cell ${history.type === 'IN' ? 'text-success' : history.type === 'OUT' ? 'text-danger' : ''}`}>
                              {history.type === 'IN' ? `+${history.qty_change}` : history.type === 'OUT' ? `-${history.qty_change}` : history.qty_change} 개
                            </td>
                            <td className="date-cell">{history.created_at}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 하단 2열 레이아웃 그리드 */}
              <div className="dashboard-bottom-grid">
                {/* 빠른 바로가기 카드 */}
                <div className="bottom-card">
                  <h3 className="bottom-card-title">⚡ 빠른 바로가기</h3>
                  <div className="quick-actions">
                    <button className="btn-quick btn-quick-in" onClick={() => setCurrentPath('stock-in')}>
                      <i className="fa-solid fa-circle-arrow-down"></i> 입고 등록
                    </button>
                    <button className="btn-quick btn-quick-out" onClick={() => setCurrentPath('stock-out')}>
                      <i className="fa-solid fa-circle-arrow-up"></i> 출고 등록
                    </button>
                    <button className="btn-quick btn-quick-add" onClick={() => setCurrentPath('add-item')}>
                      <i className="fa-solid fa-plus"></i> 신규 제품
                    </button>
                  </div>
                </div>

                {/* 재고 부족 알림 리스트 카드 */}
                <div className="bottom-card">
                  <h3 className="bottom-card-title">
                    <i className="fa-solid fa-bell text-warning-icon" style={{ color: '#f59e0b', marginRight: '6px' }}></i> 
                    재고 부족 알림 리스트
                  </h3>
                  <div className="low-stock-list-container">
                    {items.filter(item => item.total_quantity < 5).length === 0 ? (
                      <div className="no-data">안전 재고가 부족한 제품이 없습니다.</div>
                    ) : (
                      <div className="low-stock-scroll-list">
                        {items.filter(item => item.total_quantity < 5).map(item => (
                          <div key={item.id} className="low-stock-item">
                            <div className="low-stock-item-info">
                              <span className="low-stock-name">{item.name}</span>
                              <span className="low-stock-sku">{item.sku}</span>
                            </div>
                            <span className="low-stock-qty text-danger">{item.total_quantity} 개 남음</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : currentPath === 'items' ? (
            <ItemList
              onAddNew={() => setCurrentPath('add-item')}
              onNavigate={(path, item, loc, partner) => {
                // 선택된 제품/위치/거래처를 저장하고, movementKey를 갱신해 폼을 완전히 새로 마운트
                setSelectedMovementItem(item || null);
                setSelectedMovementLocation(loc || null);
                setSelectedMovementPartner(partner || null);
                setMovementKey(Date.now());
                setCurrentPath(path);
              }}
            />
          ) : currentPath === 'add-item' ? (
            <ProductForm
              onSuccess={() => {
                refreshData();
                setCurrentPath('items');
              }}
            />
          ) : currentPath === 'stock-in' ? (
            <StockMovementForm
              key={movementKey}
              type="IN"
              initialItem={selectedMovementItem}
              initialLocation={selectedMovementLocation}
              initialPartner={selectedMovementPartner}
              onSuccess={() => {
                refreshData();
                setSelectedMovementItem(null);
                setSelectedMovementLocation(null);
                setSelectedMovementPartner(null);
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-out' ? (
            <StockMovementForm
              key={movementKey}
              type="OUT"
              initialItem={selectedMovementItem}
              initialLocation={selectedMovementLocation}
              initialPartner={selectedMovementPartner}
              onSuccess={() => {
                refreshData();
                setSelectedMovementItem(null);
                setSelectedMovementLocation(null);
                setSelectedMovementPartner(null);
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-adjust' ? (
            <StockMovementForm
              key={movementKey}
              type="ADJUST"
              initialItem={selectedMovementItem}
              initialLocation={selectedMovementLocation}
              initialPartner={selectedMovementPartner}
              onSuccess={() => {
                refreshData();
                setSelectedMovementItem(null);
                setSelectedMovementLocation(null);
                setSelectedMovementPartner(null);
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'stock-move' ? (
            <StockMovementForm
              key={movementKey}
              type="MOVE"
              initialItem={selectedMovementItem}
              initialLocation={selectedMovementLocation}
              initialPartner={selectedMovementPartner}
              onSuccess={() => {
                refreshData();
                setSelectedMovementItem(null);
                setSelectedMovementLocation(null);
                setSelectedMovementPartner(null);
                setCurrentPath('history');
              }}
            />
          ) : currentPath === 'history' ? (
            <HistoryView />
          ) : currentPath === 'barcode-item' || currentPath === 'barcode-bundle' ? (
            <BarcodePrintView />
          ) : currentPath === 'partners' || currentPath === 'partner-setting' ? (
            <PartnerManagement />
          ) : currentPath === 'locations' || currentPath === 'locations-setting' ? (
            <LocationManagement />
          ) : currentPath === 'master-items' ? (
            <MasterItemsManagement onAddNew={() => setCurrentPath('add-item')} />
          ) : currentPath === 'bundles' ? (
            <BundleManagement />
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
