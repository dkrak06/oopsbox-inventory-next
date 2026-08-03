/**
 * [StockMovementForm 컴포넌트]
 * 역할: 입고 등록, 출고 등록, 재고 조정, 재고 이동 수량 처리 폼입니다.
 * 흐름: 등록된 제품을 선택하고 변동 수량을 입력받아 recordStockMovement()로 실시간 재고를 반영합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredItems, recordStockMovement, Item } from '@/lib/storage';

interface StockMovementFormProps {
  type: 'IN' | 'OUT' | 'ADJUST' | 'MOVE';
  onSuccess: () => void;
}

export default function StockMovementForm({ type, onSuccess }: StockMovementFormProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [locationName, setLocationName] = useState<string>('기본 위치');
  const [notes, setNotes] = useState<string>('');

  const typeTitles = {
    IN: '입고 등록',
    OUT: '출고 등록',
    ADJUST: '재고 조정',
    MOVE: '재고 이동',
  };

  useEffect(() => {
    const loadedItems = getStoredItems();
    setItems(loadedItems);
    if (loadedItems.length > 0) {
      setSelectedItemId(loadedItems[0].id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('제품을 선택해주세요.');
      return;
    }

    recordStockMovement(selectedItemId, type, quantity, locationName);
    const selectedItem = items.find((i) => i.id === selectedItemId);
    alert(`'${selectedItem?.name}' 제품의 ${typeTitles[type]}이 성공적으로 반영되었습니다!`);
    onSuccess();
  };

  return (
    <div className="boxhero-style-form" style={{ maxWidth: '800px' }}>
      <header className="form-header">
        <span className="sub-title">재고 관리</span>
        <h1 className="main-title" style={{ marginTop: '4px' }}>
          {typeTitles[type]}
        </h1>
      </header>

      {items.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          등록된 제품이 없습니다. 먼저 제품을 새로 등록해주세요.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">제품 선택<span className="required">*</span></label>
            <select
              className="form-input"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) - 현재 재고: {item.total_quantity}개
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">
              {type === 'ADJUST' ? '조정할 수량' : '수량'}<span className="required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">위치 (창고)</label>
            <input
              type="text"
              className="form-input"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">비고 / 사유</label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 정기 구매 입고, 고객 주문 출고 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <footer className="form-footer">
            <button type="submit" className="btn btn-submit">
              {typeTitles[type]} 완료
            </button>
          </footer>
        </form>
      )}
    </div>
  );
}
