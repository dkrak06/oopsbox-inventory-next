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
    history_count: 3,
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
