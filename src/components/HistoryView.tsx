/**
 * [HistoryView 컴포넌트]
 * 역할: 입고, 출고, 재고 조정 및 이동 기록(히스토리) 내역을 표 형태로 제공합니다.
 * 흐름: LocalStorage의 hb_stock_history 내역을 읽어와 시각적으로 정렬하여 표출합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getStoredHistories, StockHistory } from '@/lib/storage';

export default function HistoryView() {
  const [histories, setHistories] = useState<StockHistory[]>([]);

  useEffect(() => {
    setHistories(getStoredHistories());
  }, []);

  return (
    <div className="boxhero-style-form" style={{ maxWidth: '1000px' }}>
      <header className="form-header">
        <span className="sub-title">재고 관리</span>
        <h1 className="main-title" style={{ marginTop: '4px' }}>
          입출고 히스토리 ({histories.length})
        </h1>
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f8fafc', height: '40px' }}>
            <th style={{ padding: '8px 12px' }}>일시</th>
            <th style={{ padding: '8px 12px' }}>유형</th>
            <th style={{ padding: '8px 12px' }}>SKU</th>
            <th style={{ padding: '8px 12px' }}>제품명</th>
            <th style={{ padding: '8px 12px' }}>위치</th>
            <th style={{ padding: '8px 12px', textAlign: 'right' }}>수량 변동</th>
          </tr>
        </thead>
        <tbody>
          {histories.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                아직 기록된 히스토리 내역이 없습니다. 입고나 출고를 등록해보세요!
              </td>
            </tr>
          ) : (
            histories.map((h) => (
              <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb', height: '44px' }}>
                <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '13px' }}>{h.created_at}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor:
                        h.type === 'IN'
                          ? '#d1fae5'
                          : h.type === 'OUT'
                          ? '#fee2e2'
                          : '#fef3c7',
                      color:
                        h.type === 'IN'
                          ? '#15803d'
                          : h.type === 'OUT'
                          ? '#b91c1c'
                          : '#b45309',
                    }}
                  >
                    {h.type_label}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{h.sku}</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.item_name}</td>
                <td style={{ padding: '8px 12px', color: '#64748b' }}>{h.location}</td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: h.type === 'IN' ? '#22c55e' : h.type === 'OUT' ? '#ef4444' : '#3b82f6',
                  }}
                >
                  {h.type === 'IN' ? `+${h.qty_change}` : h.type === 'OUT' ? `-${h.qty_change}` : h.qty_change} 개
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
