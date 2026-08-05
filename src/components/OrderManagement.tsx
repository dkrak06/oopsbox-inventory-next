/**
 * [OrderManagement 컴포넌트]
 * 역할: 박스히어로 실제 발주서/판매서 풀 페이지 양식 및 입출고와 100% 동일한 정통 커스텀 달력 픽커를 바인딩합니다.
 * 흐름: 이미지 1 입출고 달력과 동일하게 지난달/다음달 흐림 렌더링, 파란 동그라미 선택 뱃지, '오늘' 하단 버튼을 지원합니다.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  getStoredOrders, 
  saveOrder, 
  updateOrderStatus, 
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

interface CustomField {
  id: string;
  name: string;
  value: string;
}

export default function OrderManagement({ currentPath }: OrderManagementProps) {
  // 주문 내역 및 품목/거래처 메타데이터
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [partners, setPartners] = useState<string[]>([]);

  // 현재 활성화된 상태 탭 필터 (ALL = 전체)
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('ALL');

  // 서식 작성 페이지 활성화 여부
  const [showWriteForm, setShowWriteForm] = useState(false);

  // 폼 입력 상태 (박스히어로 양식 항목)
  const [selectedPartner, setSelectedPartner] = useState('');
  const [priceTemplate, setPriceTemplate] = useState('기본 가격');
  const [currency, setCurrency] = useState('KRW');
  const [orderNumber, setOrderNumber] = useState('');
  const [memo, setMemo] = useState('');
  const [autoExecuteImmediate, setAutoExecuteImmediate] = useState(false);

  // --------------------------------------------------------------------------
  // 이미지 1 입출고 화면과 100% 동일한 박스히어로 정통 커스텀 달력 픽커 시스템
  // --------------------------------------------------------------------------
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  
  const [orderDateText, setOrderDateText] = useState<string>('현재');
  const [expectedDateText, setExpectedDateText] = useState<string>('');

  // 달력 모달 제어 상태
  const [showOrderCalendar, setShowOrderCalendar] = useState<boolean>(false);
  const [showExpectedCalendar, setShowExpectedCalendar] = useState<boolean>(false);

  // 달력 년/월 상태
  const [orderCalYear, setOrderCalYear] = useState<number>(todayObj.getFullYear());
  const [orderCalMonth, setOrderCalMonth] = useState<number>(todayObj.getMonth());
  const [expectedCalYear, setExpectedCalYear] = useState<number>(todayObj.getFullYear());
  const [expectedCalMonth, setExpectedCalMonth] = useState<number>(todayObj.getMonth());

  const orderCalRef = useRef<HTMLDivElement>(null);
  const expectedCalRef = useRef<HTMLDivElement>(null);

  // 외부 영역 클릭 시 커스텀 달력 닫힘 이펙트
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (orderCalRef.current && !orderCalRef.current.contains(target) && !target.closest('.order-date-trigger')) {
        setShowOrderCalendar(false);
      }
      if (expectedCalRef.current && !expectedCalRef.current.contains(target) && !target.closest('.expected-date-trigger')) {
        setShowExpectedCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 이미지 1 입출고 달력 매트릭스 계산 (지난달/다음달 날짜 흐리게 표시 + 42개 셀 보장)
  const getCalendarMatrix = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const matrix = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      matrix.push({ day: prevMonthDays - i, isCurrent: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      matrix.push({ day: d, isCurrent: true });
    }
    const remaining = 42 - matrix.length;
    for (let d = 1; d <= remaining; d++) {
      matrix.push({ day: d, isCurrent: false });
    }
    return matrix;
  };

  // 커스텀 필드 목록
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // 장바구니(선택된 품목들) 상태 및 제품 검색
  const [cart, setCart] = useState<OrderProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // 초기화 및 데이터 동기화
  const loadData = () => {
    setOrders(getStoredOrders());
    setItems(getStoredItems());
    setPartners(getStoredPartners());
  };

  useEffect(() => {
    loadData();
    setActiveFilter('ALL');
  }, [currentPath]);

  // buy-add, sell-add 경로 진입 시 작성 서식 자동 열기
  useEffect(() => {
    if (currentPath === 'buy-add' || currentPath === 'sell-add') {
      handleOpenWriteForm();
    } else {
      setShowWriteForm(false);
    }
  }, [currentPath]);

  // 주문 타입 매핑
  const getOrderType = (): 'BUY' | 'SELL' | 'RETURN' | 'SHIPMENT' => {
    if (currentPath === 'buy' || currentPath === 'buy-add') return 'BUY';
    if (currentPath === 'sell' || currentPath === 'sell-add') return 'SELL';
    if (currentPath === 'returns') return 'RETURN';
    return 'SHIPMENT';
  };

  const type = getOrderType();

  // 실제 박스히어로 명칭 동기화
  const titleMap = {
    BUY: { 
      pageTitle: '발주서', 
      listTitle: '발주서 목록', 
      createBtn: '발주서 작성', 
      partnerLabel: '공급자', 
      dateLabel: '발주일',
      expectedDateLabel: '입고 예정일',
      immediateLabel: '발주 내역을 저장하고 즉시 입고 처리합니다.',
      breadcrumb: '구매 및 판매 / 구매',
      orderNumPrefix: 'PO-'
    },
    SELL: { 
      pageTitle: '판매서', 
      listTitle: '매출 전표 목록', 
      createBtn: '매출 전표 작성', 
      partnerLabel: '고객', 
      dateLabel: '판매일',
      expectedDateLabel: '출고 예정일',
      immediateLabel: '판매 내역을 저장하고 즉시 출고 처리합니다.',
      breadcrumb: '구매 및 판매 / 판매',
      orderNumPrefix: 'SO-'
    },
    RETURN: { 
      pageTitle: '반품서', 
      listTitle: '반품 목록', 
      createBtn: '반품서 작성', 
      partnerLabel: '거래처', 
      dateLabel: '반품일',
      expectedDateLabel: '반품 예정일',
      immediateLabel: '반품 내역을 저장하고 즉시 처리합니다.',
      breadcrumb: '구매 및 판매 / 반품',
      orderNumPrefix: 'RET-'
    },
    SHIPMENT: { 
      pageTitle: '배송서', 
      listTitle: '배송 목록', 
      createBtn: '배송 의뢰', 
      partnerLabel: '수령처', 
      dateLabel: '의뢰일',
      expectedDateLabel: '배송 예정일',
      immediateLabel: '배송 내역을 저장하고 즉시 완료 처리합니다.',
      breadcrumb: '구매 및 판매 / 배송',
      orderNumPrefix: 'SHP-'
    }
  }[type];

  const statusLabelMap: { [key in OrderStatus]: string } = {
    ALL: '주문 전체',
    DRAFT: '임시 저장',
    PENDING: type === 'BUY' ? '입고 대기' : '출고 대기',
    PARTIAL: type === 'BUY' ? '부분 입고' : '부분 출고',
    COMPLETED: type === 'BUY' ? '입고 완료' : '출고 완료',
    CANCELLED: '취소됨'
  };

  // 작성 서식 열기 핸들러
  const handleOpenWriteForm = () => {
    setShowWriteForm(true);
    setSelectedPartner(partners.length > 0 ? partners[0] : '');
    setPriceTemplate('기본 가격');
    setCurrency('KRW');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setOrderNumber(`${titleMap.orderNumPrefix}${randomNum}`);
    setOrderDateText('현재');
    setExpectedDateText('');
    setMemo('');
    setAutoExecuteImmediate(false);
    setCustomFields([]);
    setCart([]);
    setSearchQuery('');
  };

  // 작성 서식 닫기 핸들러
  const handleCloseWriteForm = () => {
    setShowWriteForm(false);
  };

  // 장바구니에 품목 추가 핸들러
  const handleAddToCart = (item: Item) => {
    if (cart.some(p => p.item_id === item.id)) {
      setCart(cart.map(p => p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      const initialPrice = type === 'BUY' ? (item.purchase_price || 0) : (item.selling_price || 0);
      setCart([...cart, {
        item_id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: 1,
        unit_price: initialPrice
      }]);
    }
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  // 장바구니 품목 수량/단가 변경 핸들러
  const handleCartChange = (itemId: string, field: 'quantity' | 'unit_price', value: number) => {
    setCart(cart.map(p => p.item_id === itemId ? { ...p, [field]: Math.max(0, value) } : p));
  };

  // 장바구니 품목 삭제 핸들러
  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(p => p.item_id !== itemId));
  };

  // 커스텀 필드 추가 핸들러
  const handleAddCustomField = () => {
    setCustomFields([...customFields, { id: Date.now().toString(), name: '', value: '' }]);
  };

  // 커스텀 필드 변경 핸들러
  const handleCustomFieldChange = (id: string, key: 'name' | 'value', val: string) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  // 커스텀 필드 삭제 핸들러
  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  // 계산서 총액 합산
  const subtotalPrice = cart.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  const totalItemCount = cart.reduce((sum, p) => sum + p.quantity, 0);

  // 저장 핸들러
  const handleSaveOrder = (isDraft: boolean = false) => {
    if (cart.length === 0) {
      alert('최소 1개 이상의 제품을 선택해 주세요.');
      return;
    }

    const finalStatus: OrderItem['status'] = isDraft 
      ? 'DRAFT' 
      : autoExecuteImmediate 
        ? 'COMPLETED' 
        : 'PENDING';

    const saveDate = orderDateText === '현재' ? todayStr : orderDateText.split(' ')[0];

    const newOrder: OrderItem = {
      id: orderNumber || `ORD-${Date.now()}`,
      order_type: type,
      partner_name: selectedPartner || '주거래처',
      order_date: saveDate,
      status: finalStatus,
      total_quantity: totalItemCount,
      total_amount: subtotalPrice,
      items: cart,
      memo: memo,
      manager_name: '담당자',
      created_at: new Date().toISOString()
    };

    saveOrder(newOrder);
    alert(`${titleMap.pageTitle}가 성공적으로 저장되었습니다!`);
    loadData();
    setShowWriteForm(false);
  };

  // 상태 변경 및 삭제 핸들러
  const handleStatusChange = (orderId: string, newStatus: OrderItem['status']) => {
    updateOrderStatus(orderId, newStatus);
    loadData();
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('정말 이 전표를 삭제하시겠습니까?')) {
      deleteOrder(orderId);
      loadData();
    }
  };

  // 필터링된 주문 목록
  const filteredOrders = orders.filter(o => o.order_type === type).filter(o => {
    if (activeFilter === 'ALL') return true;
    return o.status === activeFilter;
  });

  // 검색된 제품 목록
  const searchFilteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.barcode.includes(searchQuery)
  );

  // --------------------------------------------------------------------------
  // A. [서식 작성 전체 페이지 뷰] (히어로박스 스크린샷 3, 4 완전 일치 양식)
  // --------------------------------------------------------------------------
  if (showWriteForm) {
    const orderMatrix = getCalendarMatrix(orderCalYear, orderCalMonth);
    const expectedMatrix = getCalendarMatrix(expectedCalYear, expectedCalMonth);

    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '80px', color: '#0f172a' }}>
        
        {/* 1. 상단 Breadcrumb & 타이틀 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{titleMap.breadcrumb}</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{titleMap.pageTitle}</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* 2. 기본 정보 영역 (공급자/고객, 가격 템플릿, 통화) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 공급자 / 고객 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '400px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                {titleMap.partnerLabel} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
              >
                {partners.length === 0 ? (
                  <option value="">등록된 거래처가 없습니다</option>
                ) : (
                  partners.map(p => <option key={p} value={p}>{p}</option>)
                )}
              </select>
            </div>

            {/* 가격 템플릿 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>가격 템플릿</label>
                <i className="fa-regular fa-circle-question" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
              </div>
              <select
                value={priceTemplate}
                onChange={(e) => setPriceTemplate(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <option value="기본 가격">기본 가격</option>
              </select>
            </div>

            {/* 통화 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '400px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>통화</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <option value="KRW">KRW (₩) — South Korean Won</option>
              </select>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>입력된 금액은 선택된 통화 기준으로 저장됩니다.</span>
            </div>
          </div>

          {/* 3. 제품 선택 테이블 영역 (박스히어로 서식 양식) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>제품 선택</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', color: '#334155', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📊 엑셀 가져오기
                </button>
                <button type="button" style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', color: '#334155', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📷 바코드 스캔
                </button>
              </div>
            </div>

            {/* 양식 테이블 카드 */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', width: '35%' }}>제품</th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', width: '12%' }}>수량</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right', width: '15%' }}>단가</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right', width: '12%' }}>할인</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right', width: '12%' }}>세금</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', width: '14%' }}>금액</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {/* 담긴 제품 목록 행 */}
                  {cart.map((cartItem) => {
                    const rowAmount = cartItem.quantity * cartItem.unit_price;
                    return (
                      <tr key={cartItem.item_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{cartItem.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {cartItem.sku}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            min="1"
                            value={cartItem.quantity}
                            onChange={(e) => handleCartChange(cartItem.item_id, 'quantity', parseInt(e.target.value) || 1)}
                            style={{ width: '100%', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            min="0"
                            value={cartItem.unit_price}
                            onChange={(e) => handleCartChange(cartItem.item_id, 'unit_price', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', padding: '6px', textAlign: 'right', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>₩0</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>₩0</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₩{rowAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(cartItem.item_id)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* + 제품 검색 행 (드롭다운 연동) */}
                  <tr>
                    <td colSpan={7} style={{ padding: '12px 16px', position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#fafafa' }}>
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>+</span>
                          <input
                            type="text"
                            placeholder="제품 검색"
                            value={searchQuery}
                            onFocus={() => setIsSearchDropdownOpen(true)}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setIsSearchDropdownOpen(true);
                            }}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#0f172a' }}
                          />
                        </div>

                        {/* 검색 결과 드롭다운 팝업 리스트 */}
                        {isSearchDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              width: '100%',
                              maxHeight: '220px',
                              overflowY: 'auto',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                              zIndex: 100
                            }}
                          >
                            {searchFilteredItems.length === 0 ? (
                              <div style={{ padding: '12px', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>검색 결과가 없습니다.</div>
                            ) : (
                              searchFilteredItems.map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => handleAddToCart(item)}
                                  style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  className="search-item-hover"
                                >
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{item.name}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {item.sku}</div>
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                                    ₩{(type === 'BUY' ? item.purchase_price : item.selling_price)?.toLocaleString() || 0}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 하단 요약 바 */}
              <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  {cart.length}개 품목 / 총 {totalItemCount}개
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>소계 <span style={{ fontWeight: 700, color: '#0f172a', marginLeft: '12px' }}>₩{subtotalPrice.toLocaleString()}</span></div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>총액 (KRW) <span style={{ marginLeft: '12px' }}>₩{subtotalPrice.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 주문 상세 설정 (주문번호, 이미지 1과 100% 동일한 입출고 날짜 선택 달력 픽커) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            
            {/* 주문 번호 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>주문 번호</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="비워두면 자동으로 생성됩니다."
                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>비워두면 자동으로 생성됩니다.</span>
            </div>

            {/* 발주일 / 판매일 (이미지 1 입출고 날짜 선택기 100% 복제) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>{titleMap.dateLabel}</label>
              <div
                className="order-date-trigger"
                onClick={() => setShowOrderCalendar(prev => !prev)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{orderDateText}</span>
                <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
              </div>

              {/* 이미지 1 입출고 정통 커스텀 달력 Layer */}
              {showOrderCalendar && (
                <div
                  ref={orderCalRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    width: '320px',
                    padding: '16px',
                    zIndex: 200,
                  }}
                >
                  {/* 헤더 년/월 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button type="button" onClick={() => { if (orderCalMonth === 0) { setOrderCalMonth(11); setOrderCalYear(y => y - 1); } else { setOrderCalMonth(m => m - 1); } }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>◀</button>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{orderCalYear}년 {orderCalMonth + 1}월</span>
                    <button type="button" onClick={() => { if (orderCalMonth === 11) { setOrderCalMonth(0); setOrderCalYear(y => y + 1); } else { setOrderCalMonth(m => m + 1); } }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>▶</button>
                  </div>

                  {/* 요일 헤더 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                  </div>

                  {/* 날짜 셀 42개 그리드 (이미지 1 원형 파란 뱃지 100% 동일) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '13px' }}>
                    {orderMatrix.map((item, i) => {
                      const mStr = String(orderCalMonth + 1).padStart(2, '0');
                      const dStr = String(item.day).padStart(2, '0');
                      const dateVal = `${orderCalYear}-${mStr}-${dStr}`;
                      const isSelected = orderDateText.startsWith(dateVal);

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setOrderDateText(`${dateVal} 10:00`);
                            setShowOrderCalendar(false);
                          }}
                          style={{
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                            color: isSelected ? '#ffffff' : item.isCurrent ? '#0f172a' : '#cbd5e1',
                            fontWeight: isSelected ? 800 : item.isCurrent ? 500 : 400
                          }}>
                            {item.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 이미지 1 하단 '오늘' 버튼 */}
                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderDateText(`${todayStr} 10:00`);
                        setShowOrderCalendar(false);
                      }}
                      style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, padding: '6px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', width: '100%' }}
                    >
                      오늘
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 입고 예정일 / 출고 예정일 (이미지 1 입출고 날짜 선택기 100% 복제) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>{titleMap.expectedDateLabel}</label>
              <div
                className="expected-date-trigger"
                onClick={() => setShowExpectedCalendar(prev => !prev)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: expectedDateText ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{expectedDateText || '날짜를 선택해 주세요.'}</span>
                <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
              </div>

              {/* 이미지 1 입출고 정통 커스텀 달력 Layer */}
              {showExpectedCalendar && (
                <div
                  ref={expectedCalRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    width: '320px',
                    padding: '16px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button type="button" onClick={() => { if (expectedCalMonth === 0) { setExpectedCalMonth(11); setExpectedCalYear(y => y - 1); } else { setExpectedCalMonth(m => m - 1); } }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>◀</button>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{expectedCalYear}년 {expectedCalMonth + 1}월</span>
                    <button type="button" onClick={() => { if (expectedCalMonth === 11) { setExpectedCalMonth(0); setExpectedCalYear(y => y + 1); } else { setExpectedCalMonth(m => m + 1); } }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>▶</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '13px' }}>
                    {expectedMatrix.map((item, i) => {
                      const mStr = String(expectedCalMonth + 1).padStart(2, '0');
                      const dStr = String(item.day).padStart(2, '0');
                      const dateVal = `${expectedCalYear}-${mStr}-${dStr}`;
                      const isSelected = expectedDateText.startsWith(dateVal);

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setExpectedDateText(dateVal);
                            setShowExpectedCalendar(false);
                          }}
                          style={{
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                            color: isSelected ? '#ffffff' : item.isCurrent ? '#0f172a' : '#cbd5e1',
                            fontWeight: isSelected ? 800 : item.isCurrent ? 500 : 400
                          }}>
                            {item.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setExpectedDateText(todayStr);
                        setShowExpectedCalendar(false);
                      }}
                      style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, padding: '6px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', width: '100%' }}
                    >
                      오늘
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 5. 커스텀 필드 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>커스텀 필드</label>
              <i className="fa-regular fa-circle-question" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px' }}>
              {customFields.map((field) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#cbd5e1' }}>=</span>
                  <input
                    type="text"
                    placeholder="필드명"
                    value={field.name}
                    onChange={(e) => handleCustomFieldChange(field.id, 'name', e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="필드 값"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <button type="button" onClick={() => handleRemoveCustomField(field.id)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCustomField}
                style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                + 커스텀 필드 추가
              </button>
            </div>
          </div>

          {/* 6. 메모 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>메모</label>
            <textarea
              rows={4}
              placeholder="메모 입력&#10;TIP) #태그 입력 시 목록에서 '태그'로 검색할 수 있습니다. 파일을 끌어 놓거나 붙여넣기로 첨부할 수 있습니다."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
            />
          </div>

          {/* 7. 즉시 처리 체크박스 옵션 및 최종 버튼 바 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoExecuteImmediate}
                onChange={(e) => setAutoExecuteImmediate(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>{titleMap.immediateLabel}</span>
            </label>

            {/* 액션 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSaveOrder(false)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrder(true)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                임시 저장
              </button>
              <button
                type="button"
                onClick={handleCloseWriteForm}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                돌아가기
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // B. [발주서 / 매출전표 / 반품 / 배송 목록 전용 테이블 뷰]
  // --------------------------------------------------------------------------
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', paddingBottom: '60px' }}>
      
      {/* 1. 상단 타이틀 및 작성 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{titleMap.breadcrumb}</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{titleMap.listTitle}</h1>
        </div>

        <button
          type="button"
          onClick={handleOpenWriteForm}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)' }}
        >
          📝 {titleMap.createBtn}
        </button>
      </div>

      {/* 2. 상태 탭 필터 (주문 전체, 임시저장, 대기, 입고완료 등) */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', paddingBottom: '2px' }}>
        {(Object.keys(statusLabelMap) as OrderStatus[]).map((st) => {
          const count = orders.filter(o => o.order_type === type).filter(o => st === 'ALL' || o.status === st).length;
          const isActive = activeFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setActiveFilter(st)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{statusLabelMap[st]}</span>
              <span style={{ fontSize: '12px', backgroundColor: isActive ? '#eff6ff' : '#f1f5f9', color: isActive ? '#3b82f6' : '#94a3b8', borderRadius: '12px', padding: '2px 8px' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 주문 전표 목록 테이블 */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
              <th style={{ padding: '14px 16px', width: '40px' }}>
                <input type="checkbox" />
              </th>
              <th style={{ padding: '14px 16px' }}>상태</th>
              <th style={{ padding: '14px 16px' }}>{titleMap.dateLabel}</th>
              <th style={{ padding: '14px 16px' }}>전표번호</th>
              <th style={{ padding: '14px 16px' }}>{titleMap.partnerLabel}</th>
              <th style={{ padding: '14px 16px' }}>품목 요약</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>총수량</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>총액</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>
                  등록된 전표 내역이 없습니다. 상단의 [{titleMap.createBtn}] 버튼을 통해 생성해 보세요!
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const summaryText = order.items && order.items.length > 0
                  ? (order.items.length === 1 ? order.items[0].name : `${order.items[0].name} 외 ${order.items.length - 1}건`)
                  : '품목 없음';

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <input type="checkbox" />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: order.status === 'COMPLETED' ? '#dcfce7' : order.status === 'DRAFT' ? '#f1f5f9' : '#dbeafe',
                        color: order.status === 'COMPLETED' ? '#166534' : order.status === 'DRAFT' ? '#475569' : '#1e40af'
                      }}>
                        {order.status === 'COMPLETED' ? '완료' : order.status === 'DRAFT' ? '임시저장' : '대기중'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{order.order_date}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{order.id}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{order.partner_name}</td>
                    <td style={{ padding: '14px 16px', color: '#1e293b' }}>{summaryText}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{order.total_quantity} 개</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>₩{order.total_amount.toLocaleString()} 원</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                            style={{ padding: '4px 10px', border: 'none', backgroundColor: '#10b981', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            처리 완료
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{ padding: '4px 10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
    </div>
  );
}
