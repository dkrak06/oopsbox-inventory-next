/**
 * [OrderManagement 컴포넌트]
 * 역할: 구매(발주서), 판매(매출 전표), 반품, 배송 관리를 박스히어로 실제 UI에 맞게 100% 동기화하여 구현합니다.
 * 흐름: 박스히어로 전용 상태 필터(임시저장/대기/완료 등) 제공 -> 다중 품목 장바구니 모달 -> 전표 일괄 생성 및 로컬스토리지 저장.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredOrders, 
  saveOrder, 
  updateOrderStatus, 
  updateOrderTracking, 
  deleteOrder, 
  OrderItem, 
  OrderProduct,
  getStoredItems, 
  getStoredPartners,
  Item
} from '@/lib/storage';

interface OrderManagementProps {
  currentPath: 'buy' | 'sell' | 'returns' | 'shipments' | string;
}

type OrderStatus = 'ALL' | 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';

export default function OrderManagement({ currentPath }: OrderManagementProps) {
  // 주문 내역 및 품목/거래처 메타데이터
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [partners, setPartners] = useState<string[]>([]);

  // 현재 활성화된 상태 탭 필터 (ALL = 전체)
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('ALL');

  // 작성 모달 관련 상태
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [manager, setManager] = useState('관리자');
  const [memo, setMemo] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [vatType, setVatType] = useState<'EXCLUDE' | 'INCLUDE'>('EXCLUDE');
  
  // 장바구니(선택된 품목들) 상태
  const [cart, setCart] = useState<OrderProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 송장 번호 수정 임시 상태
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [tempTrackingNum, setTempTrackingNum] = useState('');

  // 초기화 및 데이터 동기화
  useEffect(() => {
    setOrders(getStoredOrders());
    setItems(getStoredItems());
    setPartners(getStoredPartners());
    setActiveFilter('ALL'); // 탭 변경 시 필터 초기화
  }, [currentPath]);

  // buy-add, sell-add 경로 진입 시 작성 모달 자동 열기
  useEffect(() => {
    if (currentPath === 'buy-add' || currentPath === 'sell-add') {
      setShowWriteModal(true);
    } else {
      setShowWriteModal(false);
    }
  }, [currentPath]);

  // 주문 타입 매핑 (buy-add, sell-add는 각각 BUY, SELL과 동일)
  const getOrderType = (): 'BUY' | 'SELL' | 'RETURN' | 'SHIPMENT' => {
    if (currentPath === 'buy' || currentPath === 'buy-add') return 'BUY';
    if (currentPath === 'sell' || currentPath === 'sell-add') return 'SELL';
    if (currentPath === 'returns') return 'RETURN';
    return 'SHIPMENT';
  };

  const type = getOrderType();

  // 실제 박스히어로 명칭 동기화
  const titleMap = {
    BUY: { title: '발주서 목록', createBtn: '발주서 작성', partnerLabel: '공급자', dateLabel: '발주일' },
    SELL: { title: '매출 전표 목록', createBtn: '매출 전표 작성', partnerLabel: '고객사', dateLabel: '매출일' },
    RETURN: { title: '반품 목록', createBtn: '반품서 작성', partnerLabel: '거래처', dateLabel: '반품일' },
    SHIPMENT: { title: '배송 목록', createBtn: '배송 의뢰', partnerLabel: '수령처', dateLabel: '의뢰일' }
  }[type];

  const statusLabelMap: { [key in OrderStatus]: string } = {
    ALL: '주문 전체',
    DRAFT: '임시 저장',
    PENDING: type === 'BUY' ? '입고 대기' : '출고 대기',
    PARTIAL: type === 'BUY' ? '부분 입고' : '부분 출고',
    COMPLETED: type === 'BUY' ? '입고 완료' : '출고 완료',
    CANCELLED: '취소됨'
  };

  // 장바구니에 품목 추가 핸들러
  const handleAddToBag = (item: Item) => {
    if (cart.some(p => p.item_id === item.id)) {
      alert('이미 장바구니에 추가된 품목입니다.');
      return;
    }
    const newProduct: OrderProduct = {
      item_id: item.id,
      item_name: item.name,
      qty: 1, // 기본 수량 1개
      price: type === 'BUY' ? item.purchase_price : item.selling_price // 타입별 단가 매핑
    };
    setCart(prev => [...prev, newProduct]);
    setSearchQuery('');
  };

  // 장바구니 수량/단가 변경 핸들러
  const handleCartChange = (itemId: string, field: 'qty' | 'price', value: number) => {
    setCart(prev => prev.map(p => {
      if (p.item_id === itemId) {
        return { ...p, [field]: Math.max(0, value) };
      }
      return p;
    }));
  };

  // 장바구니 항목 제거 핸들러
  const handleRemoveFromBag = (itemId: string) => {
    setCart(prev => prev.filter(p => p.item_id !== itemId));
  };

  // 전표 최종 저장 제출 핸들러 (임시저장 DRAFT vs 발주완료 PENDING)
  const handleSubmitOrder = (status: 'DRAFT' | 'PENDING') => {
    if (!selectedPartner) {
      alert('거래처를 선택해 주세요.');
      return;
    }
    if (cart.length === 0) {
      alert('하나 이상의 품목을 추가해 주세요.');
      return;
    }

    const type_label = { BUY: '구매', SELL: '판매', RETURN: '반품', SHIPMENT: '배송' }[type];
    const status_label = statusLabelMap[status];

    const updated = saveOrder({
      type,
      type_label,
      status,
      status_label,
      partner: selectedPartner,
      products: cart,
      created_at: orderDate + ' 12:00:00', // 사용자가 정의한 일자 이식
      manager,
      memo,
      vat_type: vatType
    } as any);

    setOrders(updated);
    
    // 모달 및 폼 리셋
    setCart([]);
    setSelectedPartner('');
    setMemo('');
    setManager('관리자');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setShowWriteModal(false);
    alert(`전표가 [${status_label}] 상태로 작성 완료되었습니다.`);
  };

  // 상태 전환 트리거 (임시 저장 -> 대기중 -> 완료)
  const handleStatusChange = (id: string, nextStatus: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED') => {
    const updated = updateOrderStatus(id, nextStatus, type);
    setOrders(updated);
  };

  // 송장 번호 변경 완료 핸들러
  const handleSaveTracking = (id: string) => {
    const updated = updateOrderTracking(id, tempTrackingNum);
    setOrders(updated);
    setEditingTrackingId(null);
    setTempTrackingNum('');
  };

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    if (confirm('이 전표 내역을 영구히 삭제하시겠습니까?')) {
      const updated = deleteOrder(id);
      setOrders(updated);
    }
  };

  // 필터링된 주문 목록 계산
  const filteredOrders = orders.filter(o => {
    if (o.type !== type) return false;
    if (activeFilter === 'ALL') return true;
    return o.status === activeFilter;
  });

  // 검색된 제품 목록 (장바구니 추가용)
  const searchedItems = searchQuery.trim() === '' ? [] : items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="order-management-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      
      {/* 1. 상단 경로 표시 및 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            구매 및 판매 &gt; {type === 'BUY' ? '구매' : type === 'SELL' ? '판매' : type === 'RETURN' ? '반품' : '배송'}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{titleMap.title}</h2>
        </div>
        <button
          onClick={() => setShowWriteModal(true)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
          }}
        >
          <i className="fa-solid fa-file-signature"></i>
          {titleMap.createBtn}
        </button>
      </div>

      {/* 2. 실제 박스히어로 스타일의 상태 필터 탭 바 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '20px', gap: '4px', overflowX: 'auto' }}>
        {(['ALL', 'DRAFT', 'PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(statusTab => {
          const isActive = activeFilter === statusTab;
          const count = orders.filter(o => o.type === type && (statusTab === 'ALL' ? true : o.status === statusTab)).length;
          return (
            <button
              key={statusTab}
              onClick={() => setActiveFilter(statusTab)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                color: isActive ? '#3b82f6' : '#64748b',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{statusLabelMap[statusTab]}</span>
              <span 
                style={{ 
                  fontSize: '11px', 
                  background: isActive ? '#dbeafe' : '#f1f5f9', 
                  color: isActive ? '#1d4ed8' : '#475569', 
                  padding: '2px 6px', 
                  borderRadius: '10px',
                  fontWeight: 700 
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 테이블 리스트 뷰 */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', width: '40px' }}>
                <input type="checkbox" style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', width: '100px' }}>상태</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', width: '110px' }}>{titleMap.dateLabel}</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', width: '130px' }}>전표번호</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>{titleMap.partnerLabel}</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>품목 요약</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', textAlign: 'right', width: '100px' }}>총수량</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', textAlign: 'right', width: '120px' }}>총액</th>
              {type === 'SHIPMENT' && <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', width: '150px' }}>송장 번호</th>}
              <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', width: '160px' }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={type === 'SHIPMENT' ? 10 : 9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  조건에 해당하는 {titleMap.title}이 존재하지 않습니다.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                // 이전 단일 품목 구조와의 하위 호환성 매핑
                const products = order.products || (
                  (order as any).item_name ? [{
                    item_id: (order as any).item_id || '',
                    item_name: (order as any).item_name,
                    qty: (order as any).qty || 0,
                    price: (order as any).price || 0
                  }] : []
                );

                const totalQty = products.reduce((sum, p) => sum + p.qty, 0);
                const totalAmount = products.reduce((sum, p) => sum + (p.qty * p.price), 0);
                const productSummary = products.length > 1 
                  ? `${products[0].item_name} 외 ${products.length - 1}건` 
                  : products[0]?.item_name || '품목 없음';

                // 배지 색상 매핑
                const badgeStyle = {
                  DRAFT: { bg: '#e2e8f0', text: '#475569' },
                  PENDING: { bg: '#dbeafe', text: '#1d4ed8' },
                  PARTIAL: { bg: '#fef9c3', text: '#854d0e' },
                  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
                  CANCELLED: { bg: '#fee2e2', text: '#991b1b' }
                }[order.status];

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.text
                        }}
                      >
                        {order.status_label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{order.created_at}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{order.id}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{order.partner}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>{productSummary}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>{totalQty} 개</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                      {totalAmount.toLocaleString()} 원
                    </td>
                    {type === 'SHIPMENT' && (
                      <td style={{ padding: '12px 16px' }}>
                        {editingTrackingId === order.id ? (
                          <input
                            type="text"
                            value={tempTrackingNum}
                            onChange={(e) => setTempTrackingNum(e.target.value)}
                            onBlur={() => handleSaveTracking(order.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTracking(order.id)}
                            autoFocus
                            style={{
                              width: '100px',
                              padding: '2px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid #3b82f6'
                            }}
                          />
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingTrackingId(order.id);
                              setTempTrackingNum(order.tracking_number || '');
                            }}
                            style={{ 
                              cursor: 'pointer', 
                              color: order.tracking_number ? '#1e293b' : '#94a3b8', 
                              borderBottom: '1px dashed #cbd5e1' 
                            }}
                          >
                            {order.tracking_number || '송장 등록'}
                          </span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {order.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'PENDING')}
                            style={{ padding: '4px 8px', border: 'none', background: '#3b82f6', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            승인 요청
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                              style={{ padding: '4px 8px', border: 'none', background: '#10b981', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              처리 완료
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                              style={{ padding: '4px 8px', border: 'none', background: '#ef4444', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              취소
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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

      {/* 4. 박스히어로 방식의 '전표 작성' 모달 창 (장바구니 리스트 구현) */}
      {showWriteModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '900px',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                <i className="fa-solid fa-file-invoice" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                새로운 {titleMap.createBtn}
              </h3>
              <button 
                onClick={() => { setShowWriteModal(false); setCart([]); setMemo(''); }}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 박스히어로 스타일의 입력 필드 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {/* 거래처 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    {titleMap.partnerLabel} 선택 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">-- 거래처를 선택하세요 --</option>
                    {partners.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* 일자 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    {titleMap.dateLabel} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                {/* 담당자 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>담당자</label>
                  <input
                    type="text"
                    placeholder="담당자 이름"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                {/* 세액 설정 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>부가세 계산 방식</label>
                  <select
                    value={vatType}
                    onChange={(e) => setVatType(e.target.value as any)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="EXCLUDE">부가세 별도 (10%)</option>
                    <option value="INCLUDE">부가세 포함 (10%)</option>
                  </select>
                </div>

                {/* 메모 */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>메모</label>
                  <input
                    type="text"
                    placeholder="특이사항 및 메모를 입력해 주세요..."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 품목 추가 검색창 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>추가할 품목 검색</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}></i>
                  <input
                    type="text"
                    placeholder="품목명 또는 SKU를 입력해 검색하세요..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* 검색 드롭다운 결과 */}
                {searchedItems.length > 0 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '64px',
                      left: 0,
                      width: '100%',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      zIndex: 1100
                    }}
                  >
                    {searchedItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleAddToBag(item)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.sku} | {item.barcode}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>재고: {item.total_quantity}개</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 장바구니 리스트 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  작성 목록 ({cart.length}개 품목)
                </label>
                
                <div style={{ minHeight: '180px', border: '1px solid #cbd5e1', borderRadius: '8px', overflowY: 'auto', background: '#f8fafc' }}>
                  {cart.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '13px', padding: '40px', textAlign: 'center' }}>
                      작성 목록에 추가된 품목이 없습니다.<br/>위의 품목 검색창을 통해 제품을 검색하여 추가해 주세요.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 12px' }}>품목 정보</th>
                          <th style={{ padding: '8px 12px', width: '110px' }}>수량</th>
                          <th style={{ padding: '8px 12px', width: '130px' }}>단가 (원)</th>
                          <th style={{ padding: '8px 12px', width: '120px', textAlign: 'right' }}>세액 (VAT)</th>
                          <th style={{ padding: '8px 12px', width: '130px', textAlign: 'right' }}>합계</th>
                          <th style={{ padding: '8px 12px', width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(prod => {
                          const amount = prod.qty * prod.price;
                          const vat = vatType === 'EXCLUDE' ? Math.round(amount * 0.1) : Math.round(amount - (amount / 1.1));
                          const finalTotal = vatType === 'EXCLUDE' ? amount + vat : amount;
                          
                          return (
                            <tr key={prod.item_id} style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 600, color: '#334155' }}>{prod.item_name}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {prod.item_id.slice(0, 8)}...</div>
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={prod.qty}
                                  onChange={(e) => handleCartChange(prod.item_id, 'qty', Number(e.target.value))}
                                  style={{ width: '70px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={prod.price}
                                  onChange={(e) => handleCartChange(prod.item_id, 'price', Number(e.target.value))}
                                  style={{ width: '90px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>
                                {vat.toLocaleString()} 원
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                {finalTotal.toLocaleString()} 원
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveFromBag(prod.item_id)}
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 금액 요약 패널 */}
              {cart.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <div style={{ width: '320px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>공급가액</span>
                      <strong>
                        {cart.reduce((sum, p) => {
                          const amount = p.qty * p.price;
                          return sum + (vatType === 'EXCLUDE' ? amount : Math.round(amount / 1.1));
                        }, 0).toLocaleString()} 원
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>세액 (VAT 10%)</span>
                      <strong>
                        {cart.reduce((sum, p) => {
                          const amount = p.qty * p.price;
                          const vat = vatType === 'EXCLUDE' ? Math.round(amount * 0.1) : Math.round(amount - (amount / 1.1));
                          return sum + vat;
                        }, 0).toLocaleString()} 원
                      </strong>
                    </div>
                    <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '4px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                      <span>최종 합계 금액</span>
                      <span style={{ color: '#3b82f6' }}>
                        {(vatType === 'EXCLUDE' 
                          ? cart.reduce((sum, p) => sum + (p.qty * p.price), 0) + cart.reduce((sum, p) => {
                              const amount = p.qty * p.price;
                              return sum + Math.round(amount * 0.1);
                            }, 0)
                          : cart.reduce((sum, p) => sum + (p.qty * p.price), 0)
                        ).toLocaleString()} 원
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 모달 푸터 */}
            <div 
              style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid #f1f5f9', 
                background: '#f8fafc', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '10px' 
              }}
            >
              <button
                type="button"
                onClick={() => { setShowWriteModal(false); setCart([]); }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => handleSubmitOrder('DRAFT')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                임시 저장
              </button>

              <button
                type="button"
                onClick={() => handleSubmitOrder('PENDING')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                작성 완료
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
