/**
 * [LocalStorage 기반 데이터 관리 유틸리티]
 * 역할: 기존 app.js의 hb_items, hb_locations, hb_stock_history LocalStorage 데이터 구조를 이식합니다.
 * 흐름: 브라우저 저장소와 상호작용하여 제품 등록, 목록 조회, 삭제, 재고 수량 변경 및 히스토리를 저장합니다.
 */

// 제품(Item) 인터페이스 정의
export interface Item {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  category: string;
  brand: string;
  purchase_price: number;
  selling_price: number;
  locations: { [locationName: string]: number }; // 위치별 수량
  total_quantity: number;
  created_at: string;
  updated_at: string;
  partner?: string; // 거래처
  history_count?: number; // 거래 횟수
}

// 재고 변동 히스토리 인터페이스
export interface StockHistory {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'MOVE'; // 입고, 출고, 조정, 이동
  type_label: string;
  item_id: string;
  item_name: string;
  sku: string;
  qty_change: number;
  location: string;
  created_at: string;
}

export interface LocationItem {
  id: string;
  name: string;
  memo: string;
  created_at: string;
}

export interface BundleItemComponent {
  itemId: string;
  itemName: string;
  qty: number;
}

export interface BundleItem {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  purchase_price: number;
  selling_price: number;
  memo: string;
  components: BundleItemComponent[];
  created_at: string;
}

const ITEMS_KEY = 'hb_items';
const HISTORY_KEY = 'hb_stock_history';
const LOCATIONS_KEY = 'hb_locations';
const LOCATION_OBJECTS_KEY = 'hb_location_objects';
const BUNDLES_KEY = 'hb_bundles';

// 0. 상세 위치 객체 목록 불러오기 함수
export const getStoredLocationObjects = (): LocationItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCATION_OBJECTS_KEY);
    if (data) return JSON.parse(data);
    
    // 기본 샘플 데이터 (기본 위치, DD, FFF)
    const initial: LocationItem[] = [
      {
        id: 'LOC-1',
        name: '기본 위치',
        memo: '',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOC-2',
        name: 'DD',
        memo: 'DD',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOC-3',
        name: 'FFF',
        memo: 'FFF',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCATION_OBJECTS_KEY, JSON.stringify(initial));
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(initial.map(l => l.name)));
    return initial;
  } catch (error) {
    return [];
  }
};

// 위치 이름 목록 불러오기 함수 (기존 연동 하위 호환)
export const getStoredLocations = (): string[] => {
  if (typeof window === 'undefined') return ['기본 위치'];
  try {
    const list = getStoredLocationObjects();
    if (list.length > 0) return list.map(l => l.name);
    const data = localStorage.getItem(LOCATIONS_KEY);
    const parsed: string[] = data ? JSON.parse(data) : [];
    if (!parsed.includes('기본 위치')) parsed.unshift('기본 위치');
    return parsed;
  } catch {
    return ['기본 위치'];
  }
};

// 위치 이름 단일 저장 함수 (입출고 시 신규 생성)
export const saveLocationName = (locationName: string): void => {
  if (!locationName || locationName === '기본 위치') return;
  const currentObjects = getStoredLocationObjects();
  if (!currentObjects.some(l => l.name === locationName)) {
    saveLocationObject({ name: locationName, memo: locationName });
  }
};

// 새 위치 등록 함수
export const saveLocationObject = (newLoc: { name: string; memo: string }): LocationItem[] => {
  const current = getStoredLocationObjects();
  const created: LocationItem = {
    id: 'LOC-' + Date.now(),
    name: newLoc.name,
    memo: newLoc.memo,
    created_at: new Date().toISOString(),
  };
  const updated = [...current, created];
  localStorage.setItem(LOCATION_OBJECTS_KEY, JSON.stringify(updated));
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated.map(l => l.name)));
  return updated;
};

// 위치 수정 함수
export const updateLocationObject = (id: string, updatedFields: { name: string; memo: string }): LocationItem[] => {
  const current = getStoredLocationObjects();
  const updated = current.map(l => {
    if (l.id === id) {
      return { ...l, ...updatedFields };
    }
    return l;
  });
  localStorage.setItem(LOCATION_OBJECTS_KEY, JSON.stringify(updated));
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated.map(l => l.name)));
  return updated;
};

// 위치 삭제 함수
export const deleteLocationObject = (id: string): LocationItem[] => {
  const current = getStoredLocationObjects();
  const updated = current.filter(l => l.id !== id);
  localStorage.setItem(LOCATION_OBJECTS_KEY, JSON.stringify(updated));
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated.map(l => l.name)));
  return updated;
};

// 위치별 전체 수량 합산 계산 함수
export const getLocationTotalStock = (locationName: string): number => {
  const items = getStoredItems();
  return items.reduce((sum, item) => {
    if (item.locations && item.locations[locationName] !== undefined) {
      return sum + item.locations[locationName];
    }
    return sum;
  }, 0);
};

// 1. 전체 제품 목록 불러오기 함수
export const getStoredItems = (): Item[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ITEMS_KEY);
    if (!data) return [];
    const items: Item[] = JSON.parse(data);

    // 기존 데이터 자동 마이그레이션: 과거 더미 데이터로 저장된 '(주)영웅유통'을 빈 값('')으로 보정
    let hasChanged = false;
    const cleanedItems = items.map((item) => {
      if (item.partner === '(주)영웅유통') {
        hasChanged = true;
        return { ...item, partner: '' };
      }
      return item;
    });

    if (hasChanged) {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(cleanedItems));
    }

    return cleanedItems;
  } catch (error) {
    console.error('제품 데이터 로드 실패:', error);
    return [];
  }
};

// 2. 새 제품 저장하기 함수
export const saveItem = (newItem: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Item => {
  const items = getStoredItems();
  const now = new Date().toISOString();
  
  const createdItem: Item = {
    ...newItem,
    id: 'ITEM-' + Date.now(),
    created_at: now,
    updated_at: now,
    partner: newItem.partner || '',
    history_count: 0, // 신규 품목 등록 시 초기 거래 횟수는 0회로 초기화합니다. (기존 하드코딩값 3 수정)
  };

  const updatedItems = [createdItem, ...items];
  localStorage.setItem(ITEMS_KEY, JSON.stringify(updatedItems));
  return createdItem;
};

// 3. 특정 제품 삭제하기 함수
export const deleteItem = (itemId: string): void => {
  const items = getStoredItems();
  const filtered = items.filter((item) => item.id !== itemId);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
};

// 3-1. 특정 제품 정보 수정하기 함수
export const updateItem = (itemId: string, updatedFields: Partial<Omit<Item, 'id' | 'created_at'>>): Item[] => {
  const items = getStoredItems();
  const updated = items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        ...updatedFields,
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });
  localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
};

// 4. 재고 입출고/조정 기록 및 수량 업데이트 함수
export const recordStockMovement = (
  itemId: string,
  type: 'IN' | 'OUT' | 'ADJUST' | 'MOVE',
  qtyChange: number,
  locationName: string = '기본 위치'
) => {
  const items = getStoredItems();
  const itemIndex = items.findIndex((i) => i.id === itemId);

  if (itemIndex !== -1) {
    const targetItem = items[itemIndex];
    const currentQty = targetItem.locations[locationName] || 0;
    
    let newQty = currentQty;
    if (type === 'IN') newQty += qtyChange;
    else if (type === 'OUT') newQty = Math.max(0, currentQty - qtyChange);
    else if (type === 'ADJUST') newQty = qtyChange;

    targetItem.locations[locationName] = newQty;
    targetItem.total_quantity = Object.values(targetItem.locations).reduce((a, b) => a + b, 0);
    targetItem.updated_at = new Date().toISOString();
    targetItem.history_count = (targetItem.history_count || 0) + 1;

    items[itemIndex] = targetItem;
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));

    // 신규 위치명이면 hb_locations에 자동 등록 (거래처명이 위치 목록에 섯입는 문제 근본 차단!)
    saveLocationName(locationName);

    // 히스토리 생성 및 저장
    const historyData: StockHistory = {
      id: 'HIST-' + Date.now(),
      type,
      type_label: type === 'IN' ? '입고' : type === 'OUT' ? '출고' : type === 'ADJUST' ? '재고조정' : '재고이동',
      item_id: targetItem.id,
      item_name: targetItem.name,
      sku: targetItem.sku,
      qty_change: qtyChange,
      location: locationName,
      created_at: new Date().toLocaleTimeString(),
    };

    const histories = getStoredHistories();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([historyData, ...histories]));
  }
};

// 5. 히스토리 데이터 조회 함수
export const getStoredHistories = (): StockHistory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

const PARTNERS_KEY = 'hb_partners';
const PARTNER_OBJECTS_KEY = 'hb_partner_objects';

export interface PartnerItem {
  id: string;
  type: '공급자' | '고객';
  name: string;
  phone: string;
  email: string;
  address: string;
  memo: string;
  language: string;
  isFavorite?: boolean;
  created_at: string;
}

// 6. 거래처 이름 목록 불러오기 함수
export const getStoredPartners = (): string[] => {
  if (typeof window === 'undefined') return ['(주)영웅유통', 'DD', '신규 거래처'];
  try {
    const list = getStoredPartnerObjects();
    if (list.length > 0) return list.map(p => p.name);
    const data = localStorage.getItem(PARTNERS_KEY);
    return data ? JSON.parse(data) : ['(주)영웅유통', 'DD', '신규 거래처'];
  } catch (error) {
    return ['(주)영웅유통', 'DD', '신규 거래처'];
  }
};

// 7. 상세 거래처 객체 목록 불러오기 함수
export const getStoredPartnerObjects = (): PartnerItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PARTNER_OBJECTS_KEY);
    if (data) return JSON.parse(data);
    // 기본 샘플 데이터 제공 (이미지 2 참고)
    const initial: PartnerItem[] = [
      {
        id: 'PARTNER-1',
        type: '공급자',
        name: 'DD',
        phone: '1010',
        email: 'DD@D.H',
        address: 'DD',
        memo: '기본 메모',
        language: 'ko',
        created_at: new Date().toISOString()
      },
      {
        id: 'PARTNER-2',
        type: '공급자',
        name: '(주)영웅유통',
        phone: '02-1234-5678',
        email: 'hero@dist.com',
        address: '서울시 강남구',
        memo: '메인 공급처',
        language: 'ko',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(PARTNER_OBJECTS_KEY, JSON.stringify(initial));
    return initial;
  } catch (error) {
    return [];
  }
};

// 8. 새 상세 거래처 저장하기 함수
export const savePartnerObject = (newPartner: Omit<PartnerItem, 'id' | 'created_at'>): PartnerItem[] => {
  const current = getStoredPartnerObjects();
  const created: PartnerItem = {
    ...newPartner,
    id: 'PARTNER-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [created, ...current];
  localStorage.setItem(PARTNER_OBJECTS_KEY, JSON.stringify(updated));
  
  // 간단 이름 배열도 동기화
  const names = updated.map(p => p.name);
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(names));
  
  return updated;
};

// 9. 특정 거래처 삭제 함수
export const deletePartnerObject = (id: string): PartnerItem[] => {
  const current = getStoredPartnerObjects();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(PARTNER_OBJECTS_KEY, JSON.stringify(updated));
  
  const names = updated.map(p => p.name);
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(names));
  
  return updated;
};

// 10. 특정 거래처 즐겨찾기 (상단 우선정렬) 토글 함수
export const togglePartnerFavorite = (id: string): PartnerItem[] => {
  const current = getStoredPartnerObjects();
  const updated = current.map(p => {
    if (p.id === id) {
      return { ...p, isFavorite: !p.isFavorite };
    }
    return p;
  });
  localStorage.setItem(PARTNER_OBJECTS_KEY, JSON.stringify(updated));
  return updated;
};

// 11. 특정 거래처 정보 수정 함수
export const updatePartnerObject = (id: string, updatedFields: Omit<PartnerItem, 'id' | 'created_at'>): PartnerItem[] => {
  const current = getStoredPartnerObjects();
  const updated = current.map(p => {
    if (p.id === id) {
      return { ...p, ...updatedFields };
    }
    return p;
  });
  localStorage.setItem(PARTNER_OBJECTS_KEY, JSON.stringify(updated));
  
  const names = updated.map(p => p.name);
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(names));
  
  return updated;
};

// 12. 전체 묶음제품 목록 불러오기 함수
export const getStoredBundles = (): BundleItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BUNDLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// 13. 새 묶음제품 저장하기 함수
export const saveBundle = (newBundle: Omit<BundleItem, 'id' | 'created_at'>): BundleItem[] => {
  const current = getStoredBundles();
  const created: BundleItem = {
    ...newBundle,
    id: 'BUNDLE-' + Date.now(),
    created_at: new Date().toISOString(),
  };
  const updated = [created, ...current];
  localStorage.setItem(BUNDLES_KEY, JSON.stringify(updated));
  return updated;
};

// 14. 묶음제품 삭제 함수
export const deleteBundle = (id: string): BundleItem[] => {
  const current = getStoredBundles();
  const updated = current.filter(b => b.id !== id);
  localStorage.setItem(BUNDLES_KEY, JSON.stringify(updated));
  return updated;
};

// 15. 묶음 가능 수량 산출 함수 (구성 단품들의 최소 보유 재고 기반)
export const calculateBundleAvailableQty = (bundle: BundleItem): number => {
  if (!bundle.components || bundle.components.length === 0) return 0;
  const items = getStoredItems();
  
  let minPossible = Infinity;
  for (const comp of bundle.components) {
    const foundItem = items.find(i => i.id === comp.itemId);
    if (!foundItem || comp.qty <= 0) {
      return 0;
    }
    const possibleForComp = Math.floor(foundItem.total_quantity / comp.qty);
    if (possibleForComp < minPossible) {
      minPossible = possibleForComp;
    }
  }
  return minPossible === Infinity ? 0 : minPossible;
};

// ==========================================
// [신규 기능 추가를 위한 데이터 모델 및 저장소 유틸리티]
// ==========================================

// 1. 주문(구매/판매/반품/배송) 인터페이스
export interface OrderProduct {
  item_id: string;
  item_name: string;
  qty: number;
  price: number;
}

export interface OrderItem {
  id: string;
  type: 'BUY' | 'SELL' | 'RETURN' | 'SHIPMENT'; // 구매, 판매, 반품, 배송
  type_label: string;
  status: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'; // 임시 저장, 대기중, 부분완료, 완료, 취소됨
  status_label: string;
  partner: string; // 거래처명 (공급자 혹은 고객사)
  products: OrderProduct[]; // 포함된 품목 리스트 (장바구니)
  tracking_number?: string; // 배송용 송장 번호
  created_at: string; // 등록 일시 (발주일/주문일)
}

// 2. 재고 공유 링크 인터페이스
export interface ShareLink {
  id: string;
  name: string; // 링크 이름 (예: 외부 공지용 재고현황)
  token: string; // 고유 인증 토큰
  item_ids: string[]; // 공유 대상 품목 ID 리스트
  is_active: boolean; // 활성화 여부
  created_at: string;
}

// 3. 재고 조사 인터페이스
export interface InventoryCount {
  id: string;
  title: string; // 조사 제목 (예: 2026년 8월 정기 재고조사)
  status: 'PROGRESS' | 'COMPLETED'; // 진행중, 완료
  created_at: string;
  items: {
    item_id: string;
    item_name: string;
    sku: string;
    system_qty: number; // 전산 상의 재고 수량
    actual_qty: number; // 실제 실사 수량
  }[];
}

// 4. 커스텀 속성 인터페이스
export interface CustomAttribute {
  id: string;
  name: string; // 속성명 (예: 색상, 사이즈, 재질)
  values: string[]; // 속성에 포함될 옵션값 리스트 (예: Black, White, XL, L 등)
  created_at: string;
}

// 5. 가격 템플릿 인터페이스
export interface PriceTemplate {
  id: string;
  name: string; // 템플릿명 (예: 도매 공급가, VIP 우대가)
  markup_percent: number; // 마크업 백분율 (소비자가 산정용)
  discount_percent: number; // 할인 백분율
  created_at: string;
}

// 로컬스토리지 키 설정
const ORDERS_KEY = 'hb_orders';
const SHARE_LINKS_KEY = 'hb_share_links';
const INVENTORY_COUNTS_KEY = 'hb_inventory_counts';
const ATTRIBUTES_KEY = 'hb_attributes';
const PRICE_TEMPLATES_KEY = 'hb_price_templates';

// [주문 관리] 데이터 조회 및 저장 함수
export const getStoredOrders = (): OrderItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (data) return JSON.parse(data);
    
    // 기본 샘플 주문 데이터 제공 (실제 BoxHero UI 구성에 부합하게 products 리스트 화함)
    const initial: OrderItem[] = [
      {
        id: 'ORD-1',
        type: 'BUY',
        type_label: '구매',
        status: 'PENDING',
        status_label: '입고 대기',
        partner: '(주)영웅유통',
        products: [
          { item_id: 'ITEM-1', item_name: '샘플 원자재 A', qty: 100, price: 5000 },
          { item_id: 'ITEM-2', item_name: '보조 패킹재 B', qty: 50, price: 1200 }
        ],
        created_at: new Date().toISOString().split('T')[0] + ' 10:00:00'
      },
      {
        id: 'ORD-2',
        type: 'SELL',
        type_label: '판매',
        status: 'COMPLETED',
        status_label: '출고 완료',
        partner: 'DD',
        products: [
          { item_id: 'ITEM-3', item_name: '스타일리시 텀블러', qty: 10, price: 15000 }
        ],
        created_at: new Date().toISOString().split('T')[0] + ' 11:30:00'
      }
    ];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
};

export const saveOrder = (newOrder: Omit<OrderItem, 'id' | 'created_at'>): OrderItem[] => {
  const current = getStoredOrders();
  const created: OrderItem = {
    ...newOrder,
    id: 'ORD-' + Date.now(),
    created_at: new Date().toISOString().split('T')[0] // 실제 박스히어로는 날짜(YYYY-MM-DD) 형식으로 표시됨
  };
  const updated = [created, ...current];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const updateOrderStatus = (
  id: string, 
  status: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED',
  type: 'BUY' | 'SELL' | 'RETURN' | 'SHIPMENT'
): OrderItem[] => {
  const current = getStoredOrders();
  
  // 상태 레이블 매핑 (실제 박스히어로 주문/발주 상태 명칭 동기화)
  const labels: { [key: string]: string } = {
    DRAFT: '임시 저장',
    PENDING: type === 'BUY' ? '입고 대기' : '출고 대기',
    PARTIAL: type === 'BUY' ? '부분 입고' : '부분 출고',
    COMPLETED: type === 'BUY' ? '입고 완료' : '출고 완료',
    CANCELLED: '취소됨'
  };

  const updated = current.map(o => {
    if (o.id === id) {
      return { ...o, status, status_label: labels[status] };
    }
    return o;
  });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const updateOrderTracking = (id: string, tracking_number: string): OrderItem[] => {
  const current = getStoredOrders();
  const updated = current.map(o => {
    if (o.id === id) {
      return { ...o, tracking_number };
    }
    return o;
  });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteOrder = (id: string): OrderItem[] => {
  const current = getStoredOrders();
  const updated = current.filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

// [재고 공유 링크] 데이터 조회 및 저장 함수
export const getStoredShareLinks = (): ShareLink[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SHARE_LINKS_KEY);
    if (data) return JSON.parse(data);
    
    // 기본 샘플 데이터
    const initial: ShareLink[] = [
      {
        id: 'SL-1',
        name: '파트너사 재고 공유 현황',
        token: 'token_' + Math.random().toString(36).substr(2, 9),
        item_ids: [],
        is_active: true,
        created_at: new Date().toLocaleString()
      }
    ];
    localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
};

export const saveShareLink = (newLink: Omit<ShareLink, 'id' | 'token' | 'created_at'>): ShareLink[] => {
  const current = getStoredShareLinks();
  const created: ShareLink = {
    ...newLink,
    id: 'SL-' + Date.now(),
    token: 'token_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toLocaleString()
  };
  const updated = [created, ...current];
  localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(updated));
  return updated;
};

export const toggleShareLinkActive = (id: string): ShareLink[] => {
  const current = getStoredShareLinks();
  const updated = current.map(l => {
    if (l.id === id) {
      return { ...l, is_active: !l.is_active };
    }
    return l;
  });
  localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteShareLink = (id: string): ShareLink[] => {
  const current = getStoredShareLinks();
  const updated = current.filter(l => l.id !== id);
  localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(updated));
  return updated;
};

// [재고 조사] 데이터 조회 및 저장 함수
export const getStoredInventoryCounts = (): InventoryCount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(INVENTORY_COUNTS_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch {
    return [];
  }
};

export const saveInventoryCount = (newCount: Omit<InventoryCount, 'id' | 'created_at'>): InventoryCount[] => {
  const current = getStoredInventoryCounts();
  const created: InventoryCount = {
    ...newCount,
    id: 'CNT-' + Date.now(),
    created_at: new Date().toLocaleString()
  };
  const updated = [created, ...current];
  localStorage.setItem(INVENTORY_COUNTS_KEY, JSON.stringify(updated));
  return updated;
};

export const updateInventoryCountStatus = (id: string, status: 'PROGRESS' | 'COMPLETED'): InventoryCount[] => {
  const current = getStoredInventoryCounts();
  const updated = current.map(c => {
    if (c.id === id) {
      return { ...c, status };
    }
    return c;
  });
  localStorage.setItem(INVENTORY_COUNTS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteInventoryCount = (id: string): InventoryCount[] => {
  const current = getStoredInventoryCounts();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(INVENTORY_COUNTS_KEY, JSON.stringify(updated));
  return updated;
};

// [커스텀 속성 타입 정의]
export type AttributeType = '텍스트' | '숫자' | '날짜' | '바코드' | '파일';
export type AttributeMode = '고정' | '선택'; // 고정: 기본 표출 / 선택: 필요 시 추가 표출

export interface CustomAttribute {
  id: string;
  name: string;
  type: AttributeType;
  mode: AttributeMode;
  created_at: string;
}

// [커스텀 속성] 데이터 조회 및 저장 함수
export const getStoredAttributes = (): CustomAttribute[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ATTRIBUTES_KEY);
    if (data) {
      const parsed: CustomAttribute[] = JSON.parse(data);
      // 기존 데이터 호환성 마이그레이션 (type, mode 기본값 부여)
      return parsed.map(attr => ({
        ...attr,
        type: attr.type || '텍스트',
        mode: attr.mode || (attr.name === '카테고리' || attr.name === '브랜드' ? '고정' : '선택')
      }));
    }
    
    // 기본 샘플 데이터 (카테고리/브랜드는 '고정', 나머지는 '선택')
    const initial: CustomAttribute[] = [
      { id: 'ATTR-1', name: '카테고리', type: '텍스트', mode: '고정', created_at: new Date().toISOString() },
      { id: 'ATTR-2', name: '브랜드', type: '텍스트', mode: '고정', created_at: new Date().toISOString() },
      { id: 'ATTR-3', name: '색상', type: '텍스트', mode: '선택', created_at: new Date().toISOString() },
      { id: 'ATTR-4', name: '사이즈', type: '텍스트', mode: '선택', created_at: new Date().toISOString() },
      { id: 'ATTR-5', name: '날짜', type: '날짜', mode: '선택', created_at: new Date().toISOString() },
      { id: 'ATTR-6', name: '바코드', type: '바코드', mode: '선택', created_at: new Date().toISOString() },
      { id: 'ATTR-7', name: '파일', type: '파일', mode: '선택', created_at: new Date().toISOString() }
    ];
    localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
};

export const saveAttribute = (newAttr: { name: string; type: AttributeType; mode: AttributeMode }): CustomAttribute[] => {
  const current = getStoredAttributes();
  const created: CustomAttribute = {
    ...newAttr,
    id: 'ATTR-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [...current, created];
  localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(updated));
  return updated;
};

export const updateAttribute = (id: string, name: string, type: AttributeType, mode: AttributeMode): CustomAttribute[] => {
  const current = getStoredAttributes();
  const updated = current.map(a => {
    if (a.id === id) {
      return { ...a, name, type, mode };
    }
    return a;
  });
  localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteAttribute = (id: string): CustomAttribute[] => {
  const current = getStoredAttributes();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(updated));
  return updated;
};

export const saveAllAttributes = (updated: CustomAttribute[]): CustomAttribute[] => {
  localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(updated));
  return updated;
};

// [가격 템플릿] 데이터 조회 및 저장 함수
export const getStoredPriceTemplates = (): PriceTemplate[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PRICE_TEMPLATES_KEY);
    if (data) return JSON.parse(data);
    
    // 기본 샘플 템플릿
    const initial: PriceTemplate[] = [
      {
        id: 'PT-1',
        name: '도매 특가 정책',
        markup_percent: 0,
        discount_percent: 15,
        created_at: new Date().toISOString()
      },
      {
        id: 'PT-2',
        name: '소비자가 마크업',
        markup_percent: 30,
        discount_percent: 0,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(PRICE_TEMPLATES_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
};

export const savePriceTemplate = (newTemplate: Omit<PriceTemplate, 'id' | 'created_at'>): PriceTemplate[] => {
  const current = getStoredPriceTemplates();
  const created: PriceTemplate = {
    ...newTemplate,
    id: 'PT-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [...current, created];
  localStorage.setItem(PRICE_TEMPLATES_KEY, JSON.stringify(updated));
  return updated;
};

export const deletePriceTemplate = (id: string): PriceTemplate[] => {
  const current = getStoredPriceTemplates();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(PRICE_TEMPLATES_KEY, JSON.stringify(updated));
  return updated;
};

