```html
<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>웁스박스 (OopsBox) - 대충 굴러가는 재고관리</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" as="style" crossorigin
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.3/dist/tesseract.min.js"></script>
</head>

<body class="boxhero-theme">
    <div class="app-container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="#/select-team" class="logo" style="display:flex; align-items:center; justify-content:center; width:100%; text-decoration:none;">
                    <img src="uploads/logo.png" alt="웁스박스" style="height:40px; width:auto; object-fit:contain;">
                </a>
                <button class="sidebar-toggle-btn" id="sidebar-close-btn" aria-label="사이드바 닫기">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>
            
            <!-- 데스크톱용 사이드바 고정/접기 핀 버튼 -->
            <button id="sidebar-pin-btn" class="sidebar-pin-btn" aria-label="사이드바 접기">
                <i class="fa-solid fa-chevron-left"></i>
            </button>


            <nav class="sidebar-nav">
                <div class="menu-section">
                    <a href="#/reports/dashboard" class="menu-item" id="menu-dashboard">
                        <i class="fa-solid fa-chart-pie menu-icon"></i>
                        <span class="menu-title">대시보드</span>
                    </a>
                    <a href="#/" class="menu-item active" id="menu-items">
                        <i class="fa-solid fa-boxes-stacked menu-icon"></i>
                        <span class="menu-title">제품목록</span>
                    </a>
                </div>

                <div class="menu-separator">재고 관리</div>

                <div class="menu-section">
                    <a href="#/pending/1000/add" class="menu-item">
                        <i class="fa-solid fa-circle-arrow-down text-success menu-icon"></i>
                        <span class="menu-title">입고 등록</span>
                    </a>
                    <a href="#/pending/1001/add" class="menu-item">
                        <i class="fa-solid fa-circle-arrow-up text-danger menu-icon"></i>
                        <span class="menu-title">출고 등록</span>
                    </a>
                    <a href="#/pending/1002/add" class="menu-item">
                        <i class="fa-solid fa-sliders menu-icon"></i>
                        <span class="menu-title">재고 조정</span>
                    </a>
                    <a href="#/pending/1003/add" class="menu-item">
                        <i class="fa-solid fa-arrows-left-right menu-icon"></i>
                        <span class="menu-title">재고 이동</span>
                    </a>
                    <a href="#/ltx" class="menu-item">
                        <i class="fa-solid fa-clock-rotate-left menu-icon"></i>
                        <span class="menu-title">히스토리</span>
                    </a>
                </div>

                <div class="menu-separator">업무 프로세스</div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-orders" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-orders">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-cart-shopping menu-icon"></i>
                            <span class="menu-title">구매 및 판매</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-orders" role="region"
                        aria-labelledby="accordion-header-orders">
                        <a href="#/orders/0" class="sub-menu-item">구매 관리</a>
                        <a href="#/orders/1" class="sub-menu-item">판매 관리</a>
                        <a href="#/returns" class="sub-menu-item">반품 처리</a>
                        <a href="#/shipments" class="sub-menu-item">배송 관리</a>
                    </div>
                </div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-barcode" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-barcode">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-print menu-icon"></i>
                            <span class="menu-title">바코드 인쇄</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-barcode" role="region"
                        aria-labelledby="accordion-header-barcode">
                        <a href="#/label/barcode" class="sub-menu-item">제품 바코드</a>
                        <a href="#/label/goods" class="sub-menu-item">묶음제품 바코드</a>
                    </div>
                </div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-features" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-features">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-circle-plus menu-icon"></i>
                            <span class="menu-title">추가기능</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-features" role="region"
                        aria-labelledby="accordion-header-features">
                        <a href="#/other-features/low-stock-alerts" class="sub-menu-item">재고 부족 알림</a>
                        <a href="#/other-features/inventory-link/list" class="sub-menu-item">재고 공유 링크</a>
                        <a href="#/other-features/inventory-counts" class="sub-menu-item">재고 조사</a>
                    </div>
                </div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-reports" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-reports">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-chart-line menu-icon"></i>
                            <span class="menu-title">분석 리포트</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-reports" role="region"
                        aria-labelledby="accordion-header-reports">
                        <a href="#/reports/summary" class="sub-menu-item">입출고 요약</a>
                        <a href="#/reports/past-quantity" class="sub-menu-item">과거 수량 조회</a>
                        <a href="#/reports/dashboard" class="sub-menu-item">종합 대시보드</a>
                        <a href="#/reports/inventory" class="sub-menu-item">재고분석</a>
                        <a href="#/reports/sales" class="sub-menu-item">매출분석</a>
                        <a href="#/reports/custom" class="sub-menu-item">커스텀 리포트</a>
                    </div>
                </div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-data" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-data">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-database menu-icon"></i>
                            <span class="menu-title">데이터 관리</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-data" role="region"
                        aria-labelledby="accordion-header-data">
                        <a href="#/data-center/items" class="sub-menu-item">제품 목록 마스터</a>
                        <a href="#/data-center/bundles" class="sub-menu-item">묶음제품 관리</a>
                        <a href="#/data-center/locations" class="sub-menu-item">위치(창고) 설정</a>
                        <a href="#/data-center/attributes" class="sub-menu-item">속성 관리</a>
                        <a href="#/data-center/partners" class="sub-menu-item">거래처 설정</a>
                        <a href="#/data-center/price-templates" class="sub-menu-item">가격 템플릿</a>
                    </div>
                </div>

                <div class="accordion-item">
                    <div class="accordion-header" id="accordion-header-settings" role="button" tabindex="0"
                        aria-expanded="false" aria-controls="accordion-content-settings">
                        <span class="accordion-title-wrapper">
                            <i class="fa-solid fa-gear menu-icon"></i>
                            <span class="menu-title">시스템 설정</span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="accordion-content-settings" role="region"
                        aria-labelledby="accordion-header-settings">
                        <a href="#/settings/team" class="sub-menu-item">팀 설정</a>
                        <a href="#/settings/members" class="sub-menu-item">멤버 권한 설정</a>
                        <a href="#/settings/notifications" class="sub-menu-item">알림 설정</a>
                        <a href="#/settings/orders" class="sub-menu-item">구매/판매 환경 설정</a>
                        <a href="#/settings/integrations" class="sub-menu-item">외부 서비스 연동</a>
                        <a href="#/billing" class="sub-menu-item">결제 정보</a>
                    </div>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="user-profile" id="sidebar-user-profile" style="cursor: pointer;" title="클릭하여 로그아웃">
                    <div class="avatar"><i class="fa-solid fa-user-tie"></i></div>
                    <div class="user-info">
                        <span class="name" id="user-profile-name">관리자</span>
                        <span class="role" id="user-profile-role">Master Account</span>
                    </div>
                </div>
            </div>
        </aside>

        <div class="sidebar-overlay" id="sidebar-overlay" aria-hidden="true"></div>

        <div class="main-wrapper">
            <header class="main-header">
                <div class="header-left">
                    <button class="sidebar-toggle-btn" id="sidebar-open-btn" aria-label="사이드바 열기">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <h2 class="header-title" id="page-title">종합 대시보드</h2>
                </div>
                <div class="header-right">
                    <span class="sync-indicator online" id="sync-status" title="동기화 상태">
                        <i class="fa-solid fa-circle"></i> <span class="sync-text"
                            style="font-size:12px; margin-left:4px;">연결됨</span>
                    </span>
                    <span class="current-time" id="current-time">2026.06.30 12:43</span>
                    <button class="icon-btn" role="button" title="알림">
                        <i class="fa-solid fa-bell"></i>
                        <span class="badge" id="alert-badge" style="display:none;">0</span>
                    </button>
                </div>
            </header>

            <main class="main-content" id="main-content">
                <div class="boxhero-style-form product-add-container">
                    <header class="form-header">
                        <span class="sub-title">제품목록</span>
                        <div class="title-row">
                            <h1 class="main-title">제품 추가</h1>
                            <button type="button" class="btn-text">초기화</button>
                        </div>
                    </header>
                    <form id="productForm">
                        <section class="form-section">
                            <h2 class="section-title">제품 정보</h2>
                            <div class="section-content row-layout">
                                <div class="inputs-col">
                                    <div class="form-group">
                                        <label class="form-label">SKU<span class="required">*</span></label>
                                        <div class="input-btn-group">
                                            <input type="text" class="form-input" value="SKU-JT0DUKBD">
                                            <button type="button" class="btn btn-action">자동 생성</button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">제품명<span class="required">*</span></label>
                                        <input type="text" class="form-input" placeholder="제품명">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">바코드</label>
                                        <div class="input-btn-group">
                                            <div class="input-with-icon">
                                                <input type="text" class="form-input" placeholder="바코드가 없어도 자동 생성할 수 있습니다.">
                                                <button type="button" class="btn-inner-icon"><i class="fa-solid fa-qrcode"></i></button>
                                            </div>
                                            <button type="button" class="btn btn-action">자동 생성</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="image-upload-box">
                                    <label class="image-label">
                                        <input type="file" accept="image/*" class="hidden-file-input">
                                        <div class="image-placeholder"><i class="fa-solid fa-camera"></i></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                        <section class="form-section">
                            <div class="section-title-row">
                                <h2 class="section-title">제품 속성</h2>
                                <a href="#" class="link-text">제품 속성 편집 <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i></a>
                            </div>
                            <div class="section-content">
                                <div class="form-group"><label class="form-label">카테고리</label><input type="text" class="form-input" placeholder="텍스트 입력"></div>
                                <div class="form-group"><label class="form-label">브랜드</label><input type="text" class="form-input" placeholder="텍스트 입력"></div>
                            </div>
                        </section>
                        <section class="form-section">
                            <h2 class="section-title">가격 정보</h2>
                            <div class="section-content">
                                <div class="form-group">
                                    <label class="form-label">구매가</label>
                                    <div class="input-currency"><span class="currency-unit">₩</span><input type="number" class="form-input" value="0"></div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">판매가</label>
                                    <div class="input-currency"><span class="currency-unit">₩</span><input type="number" class="form-input" value="0"></div>
                                </div>
                            </div>
                        </section>
                        <section class="form-section">
                            <h2 class="section-title">초기 수량</h2>
                            <div class="section-content">
                                <div class="table-like-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 12px;">
                                    <span class="col-title">위치</span>
                                    <div style="display: flex; align-items: center; gap: 12px; width: 120px; justify-content: flex-end;">
                                        <span class="col-title" style="width: 90px; text-align: center;">수량</span>
                                        <div style="width: 18px;"></div>
                                    </div>
                                </div>
                                <div class="location-row" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0;">
                                    <span class="location-name">기본 위치</span>
                                    <div class="quantity-input-wrapper" style="width: 120px; justify-content: flex-end; display: flex; align-items: center; gap: 12px;">
                                        <input type="number" class="form-input align-right" value="0" style="width: 90px;">
                                        <button type="button" class="btn-delete-row" style="width: 18px; text-align: center; padding: 0; line-height: 1; background: none; border: none; font-size: 18px; color: #9CA3AF; cursor: pointer;">×</button>
                                    </div>
                                </div>
                                <div class="location-search-box"><select class="form-select"><option value="">+ 위치 검색</option></select></div>
                            </div>
                        </section>
                        <footer class="form-footer">
                            <button type="submit" class="btn btn-submit">입력 완료</button>
                            <button type="button" class="btn btn-cancel">취소</button>
                        </footer>
                    </form>
                </div>
            </main>
        </div>
    </div>

    <input type="file" id="global-image-uploader" accept="image/*" style="display: none;">

    <div id="auth-container" class="auth-overlay active">
        <div class="login-card">
            <div style="text-align:center; margin-bottom:20px;">
                <div style="background:#ffffff; display:inline-flex; align-items:center; justify-content:center; padding:14px 20px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
                    <img src="uploads/logo.png" alt="웁스박스" style="height:55px; width:auto; object-fit:contain;">
                </div>
            </div>
            
            <!-- Login Form Section -->
            <div id="login-form-section">
                <div class="card-subtitle">개인용 재고관리 시스템 로그인</div>
                <form id="auth-form" onsubmit="return false;">
                    <div style="margin-bottom: 16px;">
                        <label class="form-label-fixed" for="auth-username">사용자명 (ID)</label>
                        <input type="text" id="auth-username" class="form-control" placeholder="아이디를 입력하세요" required
                            autocomplete="username">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label class="form-label-fixed" for="auth-password">비밀번호</label>
                        <input type="password" id="auth-password" class="form-control" placeholder="비밀번호를 입력하세요" required
                            autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary">로그인</button>
                    <div style="text-align: center; margin-top: 16px; font-size: 13px;">
                        <span style="color:#94a3b8;">계정이 없으신가요? </span>
                        <a href="#" id="btn-show-signup" style="color:var(--accent-color); font-weight:600; text-decoration:none;">회원가입</a>
                    </div>
                </form>
            </div>

            <!-- Sign Up Form Section -->
            <div id="signup-form-section" style="display: none;">
                <div class="card-subtitle">개인용 재고관리 시스템 회원가입</div>
                <form id="signup-form" onsubmit="return false;">
                    <div style="margin-bottom: 12px;">
                        <label class="form-label-fixed" for="signup-username">사용자명 (ID)*</label>
                        <input type="text" id="signup-username" class="form-control" placeholder="사용할 아이디" required autocomplete="username">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label class="form-label-fixed" for="signup-password">비밀번호*</label>
                        <input type="password" id="signup-password" class="form-control" placeholder="비밀번호 (4자 이상)" required autocomplete="new-password">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label class="form-label-fixed" for="signup-teamname">회사 / 팀 이름*</label>
                        <input type="text" id="signup-teamname" class="form-control" placeholder="예: 소소팀" required value="소소팀">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label class="form-label-fixed" for="signup-name">이름*</label>
                        <input type="text" id="signup-name" class="form-control" placeholder="이름 입력" required>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label class="form-label-fixed" for="signup-email">이메일</label>
                        <input type="email" id="signup-email" class="form-control" placeholder="이메일 주소">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label class="form-label-fixed" for="signup-phone">전화번호</label>
                        <input type="text" id="signup-phone" class="form-control" placeholder="전화번호 입력">
                    </div>
                    <button type="submit" class="btn btn-primary">가입하기</button>
                    <div style="text-align: center; margin-top: 16px; font-size: 13px;">
                        <span style="color:#94a3b8;">이미 계정이 있으신가요? </span>
                        <a href="#" id="btn-show-login" style="color:var(--accent-color); font-weight:600; text-decoration:none;">로그인</a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="toast-container" class="toast-container"></div>

    <script src="js/router.js?v=1.0.4"></script>
    <script src="js/oops_barcode.js?v=1.0.4"></script>
    <script src="js/app.js?v=1.0.4"></script>
</body>

</html>
```
