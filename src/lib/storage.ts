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
  partner?: string; // 주 거래처
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

const ITEMS_KEY = 'hb_items';
const HISTORY_KEY = 'hb_stock_history';
const LOCATIONS_KEY = 'hb_locations';

// 0. 위치 목록 관리 함수 (전용 hb_locations 키)
// 거래처명이 위치 목록에 섯잇는 문제를 근본 해결!
export const getStoredLocations = (): string[] => {
  if (typeof window === 'undefined') return ['기본 위치'];
  try {
    const data = localStorage.getItem(LOCATIONS_KEY);
    const parsed: string[] = data ? JSON.parse(data) : [];
    // 항상 '기본 위치'는 목록의 첫 번째로
    if (!parsed.includes('기본 위치')) parsed.unshift('기본 위치');
    return parsed;
  } catch {
    return ['기본 위치'];
  }
};

export const saveLocationName = (locationName: string): void => {
  if (!locationName || locationName === '기본 위치') return;
  const current = getStoredLocations();
  if (!current.includes(locationName)) {
    const updated = [...current, locationName];
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated));
  }
};

// 1. 전체 제품 목록 불러오기 함수
export const getStoredItems = (): Item[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ITEMS_KEY);
    return data ? JSON.parse(data) : [];
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
    partner: newItem.partner || '(주)영웅유통',
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
