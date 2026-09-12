/**
 * [Supabase 데이터 연동 서비스 계층]
 * 역할: Supabase 클라우드 데이터베이스(PostgreSQL)와 통신하여 제품, 재고 변동 내역, 위치, 거래처 데이터를 영구 보관합니다.
 * 흐름: 실제 클라우드 DB를 최우선으로 읽고 쓰며, 오프라인 상황이나 연결 지연 시 로컬 스토리지를 캐시로 활용하여 중단 없는 서비스를 제공합니다.
 */

import { supabase } from './supabase';
import { Item, StockHistory, LocationItem, PartnerItem } from './storage';
import {
  getStoredItems,
  getStoredHistories,
  getStoredLocationObjects,
  getStoredPartnerObjects,
} from './storage';

// 기본 팀 ID (단일 팀/개인 재고관리 기준 기본값 1)
const DEFAULT_TEAM_ID = 1;

// ==========================================
// 1. 제품(Items) 데이터베이스 연동 함수
// ==========================================

/**
 * Supabase에서 전체 제품 목록을 조회합니다.
 * 클라우드 DB 연결 실패 시 로컬스토리지 데이터를 대체 반환합니다.
 */
export async function fetchItemsFromDB(): Promise<Item[]> {
  try {
    // Supabase 'items' 테이블에서 삭제되지 않은(is_deleted = 0) 품목 최신순 조회
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('team_id', DEFAULT_TEAM_ID)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('⚠️ Supabase 제품 조회 실패 또는 테이블 준비 중, 로컬 캐시를 사용합니다:', error?.message);
      return getStoredItems();
    }

    // DB 컬럼 데이터를 프론트엔드 Item 인터페이스에 맞게 변환
    const items: Item[] = data.map((row: any) => ({
      id: row.id,
      sku: row.sku || '',
      name: row.name || '',
      barcode: row.barcode || '',
      category: row.category || '',
      brand: row.brand || '',
      purchase_price: Number(row.purchase_price) || 0,
      selling_price: Number(row.selling_price || row.price) || 0,
      locations: row.locations || (row.location ? { [row.location]: Number(row.stock) || 0 } : { '기본 위치': Number(row.stock) || 0 }),
      total_quantity: Number(row.total_quantity || row.stock) || 0,
      partner: row.partner || '',
      history_count: Number(row.history_count) || 0,
      attributes: row.attributes || {},
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    // 최신 데이터를 로컬 스토리지 캐시에도 동기화
    if (typeof window !== 'undefined') {
      localStorage.setItem('hb_items', JSON.stringify(items));
    }

    return items;
  } catch (err) {
    console.error('fetchItemsFromDB 예외 발생:', err);
    return getStoredItems();
  }
}

/**
 * 신규 제품을 Supabase에 등록합니다.
 */
export async function insertItemToDB(item: Item): Promise<Item> {
  try {
    const { error } = await supabase.from('items').upsert([
      {
        id: item.id,
        team_id: DEFAULT_TEAM_ID,
        sku: item.sku,
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        brand: item.brand,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        price: item.selling_price,
        stock: item.total_quantity,
        locations: item.locations,
        total_quantity: item.total_quantity,
        partner: item.partner || '',
        history_count: item.history_count || 0,
        attributes: item.attributes || {},
        is_deleted: 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    ]);

    if (error) {
      console.error('Supabase 제품 등록 실패:', error.message);
    }
  } catch (err) {
    console.error('insertItemToDB 예외 발생:', err);
  }
  return item;
}

/**
 * 제품 정보를 수정(재고 수량, 단가, 속성 등)합니다.
 */
export async function updateItemInDB(itemId: string, fields: Partial<Item>): Promise<void> {
  try {
    const updatePayload: any = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    if (fields.total_quantity !== undefined) {
      updatePayload.stock = fields.total_quantity;
    }
    if (fields.selling_price !== undefined) {
      updatePayload.price = fields.selling_price;
    }

    const { error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('team_id', DEFAULT_TEAM_ID);

    if (error) {
      console.error('Supabase 제품 수정 실패:', error.message);
    }
  } catch (err) {
    console.error('updateItemInDB 예외 발생:', err);
  }
}

/**
 * 제품을 Supabase에서 소프트 삭제(is_deleted = 1)합니다.
 */
export async function deleteItemFromDB(itemId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('items')
      .update({ is_deleted: 1, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('team_id', DEFAULT_TEAM_ID);

    if (error) {
      console.error('Supabase 제품 삭제 실패:', error.message);
    }
  } catch (err) {
    console.error('deleteItemFromDB 예외 발생:', err);
  }
}

// ==========================================
// 2. 재고 변동 히스토리(Stock History) 연동 함수
// ==========================================

/**
 * Supabase에서 재고 변동 히스토리를 최신순으로 조회합니다.
 */
export async function fetchHistoriesFromDB(): Promise<StockHistory[]> {
  try {
    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .eq('team_id', DEFAULT_TEAM_ID)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return getStoredHistories();
    }

    const histories: StockHistory[] = data.map((row: any) => ({
      id: row.id,
      type: row.type,
      type_label: row.type_label || (row.type === 'IN' ? '입고' : row.type === 'OUT' ? '출고' : row.type === 'ADJUST' ? '조정' : '이동'),
      item_id: row.item_id || row.itemid,
      item_name: row.item_name || '',
      sku: row.sku || '',
      qty_change: Number(row.qty_change || row.quantity) || 0,
      before_qty: row.before_qty !== null ? Number(row.before_qty) : undefined,
      after_qty: row.after_qty !== null ? Number(row.after_qty) : undefined,
      to_before_qty: row.to_before_qty !== null ? Number(row.to_before_qty) : undefined,
      to_after_qty: row.to_after_qty !== null ? Number(row.to_after_qty) : undefined,
      location: row.location || '기본 위치',
      to_location: row.to_location,
      author: row.author || '관리자',
      notes: row.notes || row.memo || '',
      date: row.date || '',
      created_at: row.created_at || new Date().toISOString(),
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('hb_stock_history', JSON.stringify(histories));
    }

    return histories;
  } catch (err) {
    console.error('fetchHistoriesFromDB 예외 발생:', err);
    return getStoredHistories();
  }
}

/**
 * 입출고/조정/이동 등의 히스토리 레코드를 Supabase에 저장합니다.
 */
export async function insertHistoryToDB(history: StockHistory): Promise<void> {
  try {
    const { error } = await supabase.from('stock_history').insert([
      {
        id: history.id,
        team_id: DEFAULT_TEAM_ID,
        itemid: history.item_id,
        item_id: history.item_id,
        item_name: history.item_name,
        sku: history.sku,
        type: history.type,
        type_label: history.type_label,
        quantity: history.qty_change,
        qty_change: history.qty_change,
        before_qty: history.before_qty,
        after_qty: history.after_qty,
        to_before_qty: history.to_before_qty,
        to_after_qty: history.to_after_qty,
        location: history.location,
        to_location: history.to_location,
        author: history.author || '관리자',
        notes: history.notes || '',
        memo: history.notes || '',
        date: history.date || new Date().toISOString().split('T')[0],
        is_deleted: 0,
        created_at: history.created_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Supabase 히스토리 등록 실패:', error.message);
    }
  } catch (err) {
    console.error('insertHistoryToDB 예외 발생:', err);
  }
}

// ==========================================
// 3. 위치(Locations) 데이터베이스 연동 함수
// ==========================================

export async function fetchLocationsFromDB(): Promise<LocationItem[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('team_id', DEFAULT_TEAM_ID)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return getStoredLocationObjects();
    }

    const locations: LocationItem[] = data.map((row: any) => ({
      id: row.id || row.name,
      name: row.name,
      memo: row.memo || '',
      created_at: row.created_at,
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('hb_location_objects', JSON.stringify(locations));
      localStorage.setItem('hb_locations', JSON.stringify(locations.map((l) => l.name)));
    }

    return locations;
  } catch {
    return getStoredLocationObjects();
  }
}

export async function insertLocationToDB(loc: LocationItem): Promise<void> {
  try {
    await supabase.from('locations').upsert([
      {
        id: loc.id,
        team_id: DEFAULT_TEAM_ID,
        name: loc.name,
        memo: loc.memo,
        is_deleted: 0,
        created_at: loc.created_at,
      },
    ]);
  } catch (err) {
    console.error('insertLocationToDB 실패:', err);
  }
}

// ==========================================
// 4. 거래처(Partners) 데이터베이스 연동 함수
// ==========================================

export async function fetchPartnersFromDB(): Promise<PartnerItem[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('team_id', DEFAULT_TEAM_ID)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getStoredPartnerObjects();
    }

    const partners: PartnerItem[] = data.map((row: any) => ({
      id: row.id || row.name,
      name: row.name,
      type: row.type === '고객' ? '고객' : '공급자',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      memo: row.memo || '',
      language: row.language || 'ko',
      isFavorite: Boolean(row.is_favorite),
      created_at: row.created_at || new Date().toISOString(),
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('hb_partners', JSON.stringify(partners));
    }

    return partners;
  } catch {
    return getStoredPartnerObjects();
  }
}

export async function insertPartnerToDB(partner: PartnerItem): Promise<void> {
  try {
    await supabase.from('partners').upsert([
      {
        id: partner.id,
        team_id: DEFAULT_TEAM_ID,
        name: partner.name,
        type: partner.type,
        phone: partner.phone,
        email: partner.email,
        address: partner.address,
        memo: partner.memo,
        is_deleted: 0,
        created_at: partner.created_at,
      },
    ]);
  } catch (err) {
    console.error('insertPartnerToDB 실패:', err);
  }
}
