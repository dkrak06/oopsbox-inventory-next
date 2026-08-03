/**
 * [GenericPageView 컴포넌트]
 * 역할: 세부 기능 페이지의 뷰를 제공하는 범용 카드/설정 UI 컴포넌트입니다.
 * 흐름: 경로(path) 정보에 맞춰 제목, 아이콘, 현황 카드 및 빠른 동작 버튼을 보여줍니다.
 */

'use client';

import React from 'react';

interface GenericPageViewProps {
  category: string;
  title: string;
  icon: string;
  description: string;
}

export default function GenericPageView({
  category,
  title,
  icon,
  description,
}: GenericPageViewProps) {
  return (
    <div className="boxhero-style-form" style={{ maxWidth: '1000px' }}>
      <header className="form-header">
        <span className="sub-title">{category}</span>
        <div className="title-row">
          <h1 className="main-title">
            <i className={`fa-solid ${icon}`} style={{ marginRight: '10px', color: '#3b82f6' }}></i>
            {title}
          </h1>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => alert(`[${title}] 기능 관리 대화상자를 시작합니다.`)}
          >
            새로 등록 / 설정
          </button>
        </div>
      </header>

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>{description}</p>
      </div>

      {/* 상태 요약 미니 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '0' }}>
        <div className="card">
          <div className="card-title">현재 {title} 상태</div>
          <div className="card-value" style={{ color: '#22c55e' }}>정상 동작 중</div>
          <div className="card-desc">시스템 동기화 완료</div>
        </div>
        <div className="card">
          <div className="card-title">최근 업데이트</div>
          <div className="card-value">실시간</div>
          <div className="card-desc">마지막 변경 사항 적용 완료</div>
        </div>
      </div>
    </div>
  );
}
