/**
 * [StockMovementForm 컴포넌트]
 * 역할: 입고, 출고, 재고 조정, 재고 이동의 4가지 기능을 테마 컬러 및 구조별로 미세 조정하여 100% 동일하게 렌더링합니다.
 * 흐름: 각 타입별 테마(파랑/빨강/청록/주황) 설정 -> 커스텀 달력(정사각형 날짜 하이라이트 및 시간 픽커) -> 테이블 멀티 등록 -> 제출 시 일괄 데이터 반영.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getStoredItems, recordStockMovement, getStoredPartners, savePartnerObject, getStoredLocations, Item } from '@/lib/storage';
import ProductForm from '@/components/ProductForm';

interface SelectedItemRow {
  item: Item;
  qty: number;
}

interface StockMovementFormProps {
  type: 'IN' | 'OUT' | 'ADJUST' | 'MOVE';
  onSuccess: () => void;
  initialItem?: Item | null;
  initialLocation?: string | null;
  initialPartner?: string | null;
}

export default function StockMovementForm({ type, onSuccess, initialItem, initialLocation, initialPartner }: StockMovementFormProps) {
  // 전체 마스터 제품 목록 상태
  const [dbItems, setDbItems] = useState<Item[]>([]);
  
  // 위치 메타데이터 상태 (전달받은 initialLocation이 있으면 마운트 즉시 바인딩, 없으면 '선택하세요')
  const [warehouse, setWarehouse] = useState<string>(initialLocation || '선택하세요');
  const [toWarehouse, setToWarehouse] = useState<string>('');
  const [partner, setPartner] = useState<string>(initialPartner || '선택하세요');
  
  // 위치 및 거래처 선택 드롭다운 토글 상태
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [showPartnerDropdown, setShowPartnerDropdown] = useState<boolean>(false);
  
  // 거래처 목록 상태
  // 거래처 목록 상태 (getStoredPartners()로 실제 저장된 목록으로 초기화)
  const [partnerList, setPartnerList] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['선택하세요'];
    return getStoredPartners();
  });

  // 모달 팝업 상태 (거래처 추가, 일괄 추가, 제품 추가 모달)
  const [showAddPartnerModal, setShowAddPartnerModal] = useState<boolean>(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);

  // 거래처 추가 모달 입력 폼 상태
  const [newPartnerName, setNewPartnerName] = useState<string>('');
  const [newPartnerPhone, setNewPartnerPhone] = useState<string>('');
  const [newPartnerEmail, setNewPartnerEmail] = useState<string>('');
  const [newPartnerAddress, setNewPartnerAddress] = useState<string>('');
  const [newPartnerMemo, setNewPartnerMemo] = useState<string>('');

  // 일괄 추가 모달 수량 입력 상태
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [bulkQtyMap, setBulkQtyMap] = useState<{ [itemId: string]: number }>({});
  const [bulkOnlyStock, setBulkOnlyStock] = useState<boolean>(false);
  
  // 날짜 관련 상태 (기본은 '현재', 사용자 지정 시 캘린더에 연동)
  const [useCurrentDate, setUseCurrentDate] = useState<boolean>(true);
  const [customDateString, setCustomDateString] = useState<string>('현재');

  // 커스텀 달력 상태 관리
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0 ~ 11
  
  // 선택된 상세 날짜 상태
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // 선택된 상세 시간 상태 (기본 현재 시각으로 자동 셋팅)
  const [timeAmPm, setTimeAmPm] = useState<'오전' | '오후'>('오전');
  const [timeHour, setTimeHour] = useState<number>(9);
  const [timeMinute, setTimeMinute] = useState<number>(0);

  // 시간 선택 스크롤 드롭다운 표시 여부 (통합 3열 시계 버튼 팝업)
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // 오전/오후 커스텀 드롭다운 표시 여부
  const [showAmPmDropdown, setShowAmPmDropdown] = useState<boolean>(false);

  // 시(Hour) 및 분(Minute) 개별 변경 커스텀 드롭다운 표시 여부
  const [showHourDropdown, setShowHourDropdown] = useState<boolean>(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState<boolean>(false);
  
  const [notes, setNotes] = useState<string>(''); // 메모

  // 테이블에 추가된 예정 제품 리스트 (initialItem이 있으면 마운트 즉시 담아서 시작!)
  const [selectedList, setSelectedList] = useState<SelectedItemRow[]>(
    initialItem ? [{ item: initialItem, qty: 1 }] : []
  );
  
  // 제품 검색창 제어 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null); // 달력 모달 외부클릭 감지용
  const timePickerRef = useRef<HTMLDivElement>(null); // 시간 선택기 외부클릭 감지용
  const ampmDropdownRef = useRef<HTMLDivElement>(null); // 오전/오후 커스텀 드롭다운 외부클릭 감지용
  const timeBoxRef = useRef<HTMLDivElement>(null); // 시간 조절 인풋 박스 래퍼 Ref (Native { passive: false } 휠 스크롤 차단용)
  
  // 개별 드롭다운 외부클릭 감지용 레퍼런스
  const hourDropdownRef = useRef<HTMLDivElement>(null);
  const minuteDropdownRef = useRef<HTMLDivElement>(null);

  // 각 입출고 성격에 부합하는 테마 설정 (컬러, 타이틀, 레이블 명칭)
  const typeThemes = {
    IN: { title: '입고', color: '#3b82f6', label: '입고 수량' },
    OUT: { title: '출고', color: '#ef4444', label: '출고 수량' },
    ADJUST: { title: '조정', color: '#0d9488', label: '조정 수량' },
    MOVE: { title: '이동', color: '#f97316', label: '이동 수량' },
  };

  const theme = typeThemes[type];

  // 컴포넌트 마운트 시 저장소에서 품목 데이터 및 거래처 목록 로드
  useEffect(() => {
    setDbItems(getStoredItems());
    setPartnerList(getStoredPartners());
  }, []);

  // initialItem, initialLocation, initialPartner 변경 시 즉시 폼 상태 동기화
  useEffect(() => {
    if (initialItem) {
      setSelectedList([{ item: initialItem, qty: 1 }]);
      setSearchQuery('');
      setIsDropdownOpen(false); // 드롭다운 창을 확실히 닫아줍니다!
    } else {
      setSelectedList([]);
    }

    if (initialLocation) {
      setWarehouse(initialLocation);
    }
    if (initialPartner) {
      setPartner(initialPartner);
    }
  }, [initialItem, initialLocation, initialPartner]);

  // 신규 거래처 등록 처리 함수 (스크린샷 3 거래처 추가 모달 제출)
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      alert('거래처 이름을 입력해 주세요.');
      return;
    }
    savePartnerObject({
      type: '공급자',
      name: newPartnerName.trim(),
      phone: newPartnerPhone.trim(),
      email: newPartnerEmail.trim(),
      address: newPartnerAddress.trim(),
      memo: newPartnerMemo.trim(),
      language: 'ko'
    });
    const updatedNames = getStoredPartners();
    setPartnerList(updatedNames);
    setPartner(newPartnerName.trim());
    setNewPartnerName('');
    setNewPartnerPhone('');
    setNewPartnerEmail('');
    setNewPartnerAddress('');
    setNewPartnerMemo('');
    setShowAddPartnerModal(false);
    alert(`'${newPartnerName.trim()}' 거래처가 추가되었습니다!`);
  };

  // 일괄 추가 모달 제출 처리 함수 (스크린샷 5 일괄 추가)
  const handleConfirmBulkAdd = () => {
    const itemsToAdd: SelectedItemRow[] = [];
    Object.entries(bulkQtyMap).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const found = dbItems.find(i => i.id === itemId);
        if (found) {
          itemsToAdd.push({ item: found, qty });
        }
      }
    });

    if (itemsToAdd.length === 0) {
      alert('추가할 제품의 입고 수량을 1개 이상 입력해 주세요.');
      return;
    }

    // 기존 목록에 수량 합산하여 일괄 추가
    setSelectedList(prev => {
      const nextList = [...prev];
      itemsToAdd.forEach(newItemRow => {
        const existingIdx = nextList.findIndex(r => r.item.id === newItemRow.item.id);
        if (existingIdx !== -1) {
          nextList[existingIdx] = {
            ...nextList[existingIdx],
            qty: nextList[existingIdx].qty + newItemRow.qty
          };
        } else {
          nextList.push(newItemRow);
        }
      });
      return nextList;
    });

    setBulkQtyMap({});
    setShowBulkAddModal(false);
  };

  // 입출고/조정/이동 탭(type) 변경 시 제품 목록, 날짜, 검색, 메모만 초기화
  // warehouse(위치)와 partner(거래처)는 initialLocation/initialPartner로 세팅된 값을 유지하며 initialItem이 있으면 해당 제품을 자동 세팅!
  useEffect(() => {
    setUseCurrentDate(true);
    if (initialItem) {
      setSelectedList([{ item: initialItem, qty: 1 }]);
    } else {
      setSelectedList([]);
    }
    setSearchQuery('');
    setNotes('');
    setShowCalendar(false);
    setShowTimePicker(false);
    setShowAmPmDropdown(false);
    setShowHourDropdown(false);
    setShowMinuteDropdown(false);
    setShowLocationDropdown(false);
    setShowPartnerDropdown(false);
  }, [type, initialItem]);

  // 외부 영역 클릭 시 검색 드롭다운, 달력, 시간 픽커, 위치/거래처 드롭다운 모달을 자동으로 닫는 통합 감지 이펙트
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }

      if (showLocationDropdown && !target.closest('.location-select-wrapper')) {
        setShowLocationDropdown(false);
      }

      if (showPartnerDropdown && !target.closest('.partner-select-wrapper')) {
        setShowPartnerDropdown(false);
      }

      if (showTimePicker && timePickerRef.current && !timePickerRef.current.contains(target)) {
        if (!target.closest('.clock-btn')) {
          setShowTimePicker(false);
        }
      }

      if (showAmPmDropdown && ampmDropdownRef.current && !ampmDropdownRef.current.contains(target)) {
        if (!target.closest('.ampm-trigger')) {
          setShowAmPmDropdown(false);
        }
      }

      // 개별 시 드롭다운 외부 클릭 감지
      if (showHourDropdown && hourDropdownRef.current && !hourDropdownRef.current.contains(target)) {
        if (!target.closest('.hour-input-trigger')) {
          setShowHourDropdown(false);
        }
      }

      // 개별 분 드롭다운 외부 클릭 감지
      if (showMinuteDropdown && minuteDropdownRef.current && !minuteDropdownRef.current.contains(target)) {
        if (!target.closest('.minute-input-trigger')) {
          setShowMinuteDropdown(false);
        }
      }

      if (showCalendar && calendarContainerRef.current && !calendarContainerRef.current.contains(target)) {
        if (
          timePickerRef.current?.contains(target) || 
          ampmDropdownRef.current?.contains(target) ||
          hourDropdownRef.current?.contains(target) ||
          minuteDropdownRef.current?.contains(target) ||
          target.closest('.clock-btn') ||
          target.closest('.ampm-trigger') ||
          target.closest('.hour-input-trigger') ||
          target.closest('.minute-input-trigger')
        ) {
          return;
        }
        setShowCalendar(false);
        setShowTimePicker(false);
        setShowAmPmDropdown(false);
        setShowHourDropdown(false);
        setShowMinuteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLocationDropdown, showPartnerDropdown, showTimePicker, showAmPmDropdown, showHourDropdown, showMinuteDropdown, showCalendar]);

  // 날짜/시간 상태가 변경될 때마다 화면에 표출할 포맷팅된 날짜 문자열 계산
  useEffect(() => {
    if (useCurrentDate) {
      setCustomDateString('현재');
    } else {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(selectedDay).padStart(2, '0');
      
      let showHour = timeHour;
      if (timeAmPm === '오후' && timeHour < 12) showHour += 12;
      if (timeAmPm === '오전' && timeHour === 12) showHour = 0;
      const hourStr = String(showHour).padStart(2, '0');
      const minuteStr = String(timeMinute).padStart(2, '0');

      setCustomDateString(`${selectedYear}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}`);
    }
  }, [useCurrentDate, selectedYear, selectedMonth, selectedDay, timeAmPm, timeHour, timeMinute]);

  // 현재 시간으로 동기화 처리 함수
  const syncTimeToCurrent = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());

    const currentHour24 = today.getHours();
    setTimeAmPm(currentHour24 >= 12 ? '오후' : '오전');
    setTimeHour(currentHour24 % 12 === 0 ? 12 : currentHour24 % 12);
    setTimeMinute(today.getMinutes());
  };

  // 달력 모달 휠 타겟별 시/분 정확한 분기 및 바탕 스크롤 완전 방어 이펙트
  useEffect(() => {
    const calendarEl = calendarContainerRef.current;
    if (!showCalendar || !calendarEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 바탕화면 스크롤 전파 차단
      e.stopPropagation();

      const target = e.target as HTMLElement;

      // 1) 개별 '시간 입력' 팝업 내부 휠 -> 시(Hour) 조절
      if (hourDropdownRef.current && hourDropdownRef.current.contains(target)) {
        e.preventDefault();
        if (e.deltaY > 0) setTimeHour(prev => (prev === 12 ? 1 : prev + 1));
        else setTimeHour(prev => (prev === 1 ? 12 : prev - 1));
        setUseCurrentDate(false);
        return;
      }

      // 2) 개별 '분 입력' 팝업 내부 휠 -> 분(Minute) 조절
      if (minuteDropdownRef.current && minuteDropdownRef.current.contains(target)) {
        e.preventDefault();
        if (e.deltaY > 0) setTimeMinute(prev => (prev === 59 ? 0 : prev + 1));
        else setTimeMinute(prev => (prev === 0 ? 59 : prev - 1));
        setUseCurrentDate(false);
        return;
      }

      // 3) 3열 통합 시계 피커 팝업 내부 휠 -> 타겟 위치별 시/분 구분 조절
      if (timePickerRef.current && timePickerRef.current.contains(target)) {
        e.preventDefault();
        // 2열 '시' 영역
        if (target.closest('.hour-picker-col')) {
          if (e.deltaY > 0) setTimeHour(prev => (prev === 12 ? 1 : prev + 1));
          else setTimeHour(prev => (prev === 1 ? 12 : prev - 1));
        } 
        // 3열 '분' 영역 (기본값)
        else {
          if (e.deltaY > 0) setTimeMinute(prev => (prev === 59 ? 0 : prev + 1));
          else setTimeMinute(prev => (prev === 0 ? 59 : prev - 1));
        }
        setUseCurrentDate(false);
        return;
      }

      // 4) [오전 10 30] 메인 사각형 박스의 시/분 텍스트 영역 직상단 휠 조절
      if (target.closest('.hour-trigger')) {
        e.preventDefault();
        if (e.deltaY > 0) setTimeHour(prev => (prev === 12 ? 1 : prev + 1));
        else setTimeHour(prev => (prev === 1 ? 12 : prev - 1));
        setUseCurrentDate(false);
        return;
      }

      if (target.closest('.minute-trigger')) {
        e.preventDefault();
        if (e.deltaY > 0) setTimeMinute(prev => (prev === 59 ? 0 : prev + 1));
        else setTimeMinute(prev => (prev === 0 ? 59 : prev - 1));
        setUseCurrentDate(false);
        return;
      }

      // 5) 기타 달력 모달 빈 공간 휠 전파 무력화
      e.preventDefault();
    };

    calendarEl.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      calendarEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [showCalendar, showTimePicker, showHourDropdown, showMinuteDropdown]);

  // 테이블에 중복 추가되지 않은 검색 키워드 매칭 제품 필터링
  const availableItems = dbItems.filter(item => {
    const isAlreadySelected = selectedList.some(row => row.item.id === item.id);
    const matchesKeyword = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);
    return !isAlreadySelected && matchesKeyword;
  });

  // 전용 hb_locations 키에서 위치 목록 조회 → 거래처명 오염 없는 순수한 위치 목록!
  const dynamicLocations = getStoredLocations();
  // initialLocation이 목록에 없으면 임시로 표시
  if (initialLocation && !dynamicLocations.includes(initialLocation)) {
    dynamicLocations.unshift(initialLocation);
  }

  // 검색창 품목 선택 핸들러
  const handleAddItem = (item: Item) => {
    setSelectedList(prev => [...prev, { item, qty: 1 }]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // 테이블 내 개별 품목 수량 변경 핸들러
  const handleQtyChange = (itemId: string, newQty: number) => {
    setSelectedList(prev => 
      prev.map(row => (row.item.id === itemId ? { ...row, qty: Math.max(1, newQty) } : row))
    );
  };

  // 테이블 내 개별 품목 제거 핸들러
  const handleRemoveItem = (itemId: string) => {
    setSelectedList(prev => prev.filter(row => row.item.id !== itemId));
  };

  // 초기화 핸들러
  const handleReset = () => {
    if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
      setSelectedList([]);
      setWarehouse('기본창고');
      setToWarehouse('A창고');
      setPartner('');
      setUseCurrentDate(true);
      setNotes('');
    }
  };

  // 최종 제출 처리 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedList.length === 0) {
      alert(`${theme.title}할 제품을 최소 1개 이상 추가해 주세요.`);
      return;
    }

    // 각 제품별 재고 이동 반영 실행
    selectedList.forEach(row => {
      if (type === 'MOVE') {
        recordStockMovement(row.item.id, 'OUT', row.qty, warehouse);
        recordStockMovement(row.item.id, 'IN', row.qty, toWarehouse);
      } else {
        recordStockMovement(row.item.id, type, row.qty, warehouse);
      }
    });

    alert(`총 ${selectedList.length}개 품목의 ${theme.title} 처리가 완료되었습니다!`);
    onSuccess();
  };

  const totalQtySum = selectedList.reduce((acc, cur) => acc + cur.qty, 0);

  // ==========================================
  // 커스텀 달력 격자 연산 로직 영역
  // ==========================================
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfCurrentMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);

  const calendarCells = [];
  
  for (let i = firstDayOfCurrentMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: prevMonthIndex,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  const remainingCells = 42 - calendarCells.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: nextMonthIndex,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (cell: { day: number; month: number; year: number }) => {
    setSelectedYear(cell.year);
    setSelectedMonth(cell.month);
    setSelectedDay(cell.day);
    setUseCurrentDate(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setUseCurrentDate(false);
  };

  // 시간만 현재 시간으로 동기화하는 별도 처리 함수
  const handleSyncCurrentTime = () => {
    const today = new Date();
    const currentHour24 = today.getHours();
    setTimeAmPm(currentHour24 >= 12 ? '오후' : '오전');
    setTimeHour(currentHour24 % 12 === 0 ? 12 : currentHour24 % 12);
    setTimeMinute(today.getMinutes());
    setUseCurrentDate(false);
  };

  // 시계 아이콘 클릭 시 시간 스크롤 픽커 토글 핸들러
  const handleClockIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTimePicker(prev => !prev);
    setShowHourDropdown(false);
    setShowMinuteDropdown(false);
  };

  // ==========================================
  // 마우스 휠 회전식 9칸 바둑판 격자 동기화 연산
  // ==========================================
  
  // 시(Hour) 컬럼 휠 스크롤 감지 및 루프 갱신
  const handleHourWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUseCurrentDate(false);
    if (e.deltaY > 0) {
      setTimeHour(prev => (prev === 12 ? 1 : prev + 1));
    } else {
      setTimeHour(prev => (prev === 1 ? 12 : prev - 1));
    }
  };

  // 분(Minute) 컬럼 휠 스크롤 감지 및 루프 갱신
  const handleMinuteWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUseCurrentDate(false);
    if (e.deltaY > 0) {
      setTimeMinute(prev => (prev === 59 ? 0 : prev + 1));
    } else {
      setTimeMinute(prev => (prev === 0 ? 59 : prev - 1));
    }
  };

  // 시(Hour)의 1행, 2행, 3행 값 계산
  const h1 = timeHour;
  const h2 = timeHour === 12 ? 1 : timeHour + 1;
  const h3 = h2 === 12 ? 1 : h2 + 1;

  // 분(Minute)의 1행, 2행, 3행 값 계산
  const m1 = timeMinute;
  const m2 = timeMinute === 59 ? 0 : timeMinute + 1;
  const m3 = m2 === 59 ? 0 : m2 + 1;

  return (
    <div className="stock-in-form-container" style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif' }}>
      {/* 1. 상단 타이틀 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `2px solid ${theme.color}`, paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
            <span style={{ color: theme.color }}>{theme.title}</span>
          </h1>
          <i className="fa-regular fa-circle-question" style={{ color: theme.color, fontSize: '18px', cursor: 'pointer' }}></i>
        </div>
        <button type="button" onClick={handleReset} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>초기화</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 2. 메타데이터 입력 카드 */}
        <div className="boxhero-style-form" style={{ padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* 위치 선택 (드롭다운 연동) */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>위치 <span style={{ color: '#ff4d4f' }}>*</span></span>
            {type === 'MOVE' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '420px', width: '100%' }}>
                {/* 출발 위치 (현재 위치) 셀렉트 */}
                <select
                  className="form-input"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    flex: 1,
                    minWidth: 0,
                    fontSize: '14px',
                    color: warehouse ? '#0f172a' : '#94a3b8',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="" disabled hidden>현재 위치</option>
                  {dynamicLocations.map((locName) => (
                    <option key={locName} value={locName} style={{ color: '#0f172a' }}>
                      {locName}
                    </option>
                  ))}
                </select>

                <span style={{ color: '#f97316', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>➔</span>

                {/* 목적 위치 (새 위치) 셀렉트 */}
                <select
                  className="form-input"
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    flex: 1,
                    minWidth: 0,
                    fontSize: '14px',
                    color: toWarehouse ? '#0f172a' : '#94a3b8',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="" disabled hidden>새 위치</option>
                  {dynamicLocations.map((locName) => (
                    <option key={locName} value={locName} style={{ color: '#0f172a' }}>
                      {locName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="location-select-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <div
                  onClick={() => setShowLocationDropdown(prev => !prev)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: (!warehouse || warehouse === '선택하세요') ? '#94a3b8' : '#1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{warehouse || '선택하세요'}</span>
                  <i className={`fa-solid fa-chevron-${showLocationDropdown ? 'up' : 'down'}`} style={{ fontSize: '11px', color: '#94a3b8' }}></i>
                </div>

                {/* 위치 드롭다운 팝업 리스트 */}
                {showLocationDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      zIndex: 300,
                      overflow: 'hidden'
                    }}
                  >
                    {dynamicLocations.map(locName => (
                      <div
                        key={locName}
                        onClick={() => {
                          setWarehouse(locName);
                          setShowLocationDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: warehouse === locName ? '#3b82f6' : '#1e293b',
                          fontWeight: warehouse === locName ? 700 : 500,
                          backgroundColor: warehouse === locName ? '#f0f9ff' : 'transparent',
                          cursor: 'pointer'
                        }}
                        className="search-item-hover"
                      >
                        {locName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 거래처 선택 (스크린샷 2,3 거래처 추가 모달 연동) */}
          {(type === 'IN' || type === 'OUT') && (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>거래처</span>
              <div className="partner-select-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <div
                  onClick={() => setShowPartnerDropdown(prev => !prev)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: partner === '선택하세요' ? '#94a3b8' : '#1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{partner}</span>
                  <i className={`fa-solid fa-chevron-${showPartnerDropdown ? 'up' : 'down'}`} style={{ fontSize: '11px', color: '#94a3b8' }}></i>
                </div>

                {/* 거래처 드롭다운 팝업 리스트 */}
                {showPartnerDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      zIndex: 300,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={() => {
                        setPartner('없음');
                        setShowPartnerDropdown(false);
                      }}
                      style={{ padding: '10px 14px', fontSize: '13px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', backgroundColor: '#f8fafc' }}
                      className="search-item-hover"
                    >
                      없음
                    </div>
                    {partnerList.map(pName => (
                      <div
                        key={pName}
                        onClick={() => {
                          setPartner(pName);
                          setShowPartnerDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: partner === pName ? '#3b82f6' : '#1e293b',
                          fontWeight: partner === pName ? 700 : 500,
                          cursor: 'pointer'
                        }}
                        className="search-item-hover"
                      >
                        {pName}
                      </div>
                    ))}
                    {/* 드롭다운 하단 + 추가하기 버튼 (스크린샷 2 모달 트리거) */}
                    <div
                      onClick={() => {
                        setShowPartnerDropdown(false);
                        setShowAddPartnerModal(true);
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#3b82f6',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff'
                      }}
                      className="search-item-hover"
                    >
                      <i className="fa-solid fa-plus"></i> 추가하기
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 날짜 선택 */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>날짜</span>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              
              <div 
                onClick={() => setShowCalendar(prev => !prev)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#1e293b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{customDateString}</span>
                <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
              </div>

              {/* 커스텀 달력 모달 레이어 (overscrollBehavior: 'contain' 속성 지정으로 바탕 화면 스크롤 완전 격리) */}
              {showCalendar && (
                <div 
                  ref={calendarContainerRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    width: '380px',
                    padding: '16px 20px',
                    zIndex: 100,
                    overscrollBehavior: 'contain',
                  }}
                >
                  {/* 달력 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748b' }}>◀</button>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
                      {currentYear}년 {currentMonth + 1}월
                    </span>
                    <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748b' }}>▶</button>
                  </div>

                  {/* 요일 머리글 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                  </div>

                  {/* 달력 날짜 그리드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
                    {calendarCells.map((cell, idx) => {
                      const isSelected = 
                        selectedYear === cell.year && 
                        selectedMonth === cell.month && 
                        selectedDay === cell.day;
                      
                      return (
                        <div key={idx} style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div
                            onClick={() => handleSelectDay(cell)}
                            style={{
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: isSelected ? 800 : 500,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: isSelected 
                                ? '#ffffff' 
                                : cell.isCurrentMonth ? '#1e293b' : '#94a3b8',
                              backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                              transition: 'all 0.15s ease-in-out'
                            }}
                            className={!isSelected ? 'search-item-hover' : ''}
                          >
                            {cell.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 오늘 선택 버튼 */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'center' }}>
                    <button 
                      type="button" 
                      onClick={handleSelectToday}
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      className="search-item-hover"
                    >
                      오늘
                    </button>
                  </div>

                  {/* 하단 시간 조절부 (안정적인 이전 상태로 롤백) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    
                    <span style={{ fontSize: '13px', color: '#475569', marginRight: 'auto', fontWeight: 700 }}>시간</span>
                    
                    {/* 별도 신설된 [초기화(현재시간)] 동기화 버튼 */}
                    <button
                      type="button"
                      onClick={handleSyncCurrentTime}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#3b82f6',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '2px',
                        transition: 'all 0.15s ease'
                      }}
                      className="search-item-hover"
                      title="시/분을 현재 시각으로 초기화"
                    >
                      초기화(현재시간)
                    </button>
                    
                    {/* [오전 09 16] 테두리 사각형 인풋 박스 (ref={timeBoxRef} 연동으로 non-passive 휠 스크롤 100% 동결 차단) */}
                    <div 
                      ref={timeBoxRef}
                      className="time-input-box-wrapper"
                      style={{ 
                        position: 'relative',
                        border: '1px solid #cbd5e1', 
                        borderRadius: '10px', 
                        padding: '0 12px', 
                        fontSize: '13px', 
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        width: '156px', 
                        height: '36px', 
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                        overscrollBehavior: 'contain'
                      }}
                    >
                      {/* 1. 오전/오후 텍스트 트리거 */}
                      <div 
                        className="ampm-trigger search-item-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAmPmDropdown(prev => !prev);
                          setShowHourDropdown(false);
                          setShowMinuteDropdown(false);
                          setShowTimePicker(false);
                          setUseCurrentDate(false);
                        }}
                        style={{
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          userSelect: 'none',
                          color: '#0f172a',
                          textAlign: 'center',
                          padding: '2px 4px',
                          borderRadius: '6px'
                        }}
                      >
                        {timeAmPm}
                      </div>

                      {/* 1. 오전/오후 개별 선택 팝업 */}
                      {showAmPmDropdown && (
                        <div 
                          ref={ampmDropdownRef}
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 6px)',
                            left: '4px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            width: '56px', 
                            zIndex: 600,
                            overflow: 'hidden',
                            padding: '3px', 
                            boxSizing: 'border-box',
                            animation: 'fadeIn 0.15s ease-out'
                          }}
                        >
                          {['오전', '오후'].map(ampm => (
                            <div
                              key={ampm}
                              onClick={() => {
                                setTimeAmPm(ampm as '오전' | '오후');
                                setUseCurrentDate(false);
                                setShowAmPmDropdown(false);
                              }}
                              style={{
                                margin: '2px 0',
                                padding: '6px 0',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: timeAmPm === ampm ? 700 : 500,
                                color: timeAmPm === ampm ? '#ffffff' : '#475569',
                                backgroundColor: timeAmPm === ampm ? '#3b82f6' : 'transparent',
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              className={timeAmPm !== ampm ? 'search-item-hover' : ''}
                            >
                              {ampm}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 2. 시(Hour) 트리거 (마우스 휠 조절 지원 & 바탕 스크롤 차단) */}
                      <div
                        className="hour-trigger search-item-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHourDropdown(prev => !prev);
                          setShowMinuteDropdown(false);
                          setShowAmPmDropdown(false);
                          setShowTimePicker(false);
                          setUseCurrentDate(false);
                        }}
                        onWheel={(e) => { e.stopPropagation(); handleHourWheel(e); }}
                        style={{
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          userSelect: 'none',
                          color: '#0f172a',
                          textAlign: 'center',
                          padding: '2px 4px',
                          borderRadius: '6px'
                        }}
                      >
                        {String(timeHour).padStart(2, '0')}
                      </div>

                      {/* 2. 시(Hour) 개별 숫자 입력 전용 새창 팝업 */}
                      {showHourDropdown && (
                        <div 
                          ref={hourDropdownRef}
                          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 6px)',
                            left: '52px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #3b82f6',
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.18), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            width: '64px', 
                            zIndex: 600,
                            padding: '6px 4px', 
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            animation: 'fadeIn 0.15s ease-out',
                            overscrollBehavior: 'contain',
                            touchAction: 'none'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>시간 입력</div>
                          <input 
                            type="number" 
                            min="1" 
                            max="12" 
                            autoFocus
                            value={timeHour} 
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= 1 && val <= 12) setTimeHour(val);
                              else if (e.target.value === '') setTimeHour(1);
                              setUseCurrentDate(false);
                            }}
                            onWheel={(e) => { e.preventDefault(); e.stopPropagation(); handleHourWheel(e); }}
                            style={{
                              width: '48px',
                              height: '32px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                              color: '#3b82f6',
                              backgroundColor: '#f8fafc',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowHourDropdown(false)}
                            style={{
                              width: '100%',
                              padding: '3px 0',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ffffff',
                              backgroundColor: '#3b82f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            확인
                          </button>
                        </div>
                      )}
                      
                      {/* 3. 분(Minute) 트리거 (마우스 휠 조절 지원 & 바탕 스크롤 차단) */}
                      <div
                        className="minute-trigger search-item-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMinuteDropdown(prev => !prev);
                          setShowHourDropdown(false);
                          setShowAmPmDropdown(false);
                          setShowTimePicker(false);
                          setUseCurrentDate(false);
                        }}
                        onWheel={(e) => { e.stopPropagation(); handleMinuteWheel(e); }}
                        style={{
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          userSelect: 'none',
                          color: '#0f172a',
                          textAlign: 'center',
                          padding: '2px 4px',
                          borderRadius: '6px'
                        }}
                      >
                        {String(timeMinute).padStart(2, '0')}
                      </div>

                      {/* 3. 분(Minute) 개별 숫자 입력 전용 새창 팝업 */}
                      {showMinuteDropdown && (
                        <div 
                          ref={minuteDropdownRef}
                          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 6px)',
                            left: '98px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #3b82f6',
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.18), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            width: '64px', 
                            zIndex: 600,
                            padding: '6px 4px', 
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            animation: 'fadeIn 0.15s ease-out',
                            overscrollBehavior: 'contain',
                            touchAction: 'none'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>분 입력</div>
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            autoFocus
                            value={timeMinute} 
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= 0 && val <= 59) setTimeMinute(val);
                              else if (e.target.value === '') setTimeMinute(0);
                              setUseCurrentDate(false);
                            }}
                            onWheel={(e) => { e.preventDefault(); e.stopPropagation(); handleMinuteWheel(e); }}
                            style={{
                              width: '48px',
                              height: '32px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                              color: '#3b82f6',
                              backgroundColor: '#f8fafc',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowMinuteDropdown(false)}
                            style={{
                              width: '100%',
                              padding: '3px 0',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ffffff',
                              backgroundColor: '#3b82f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            확인
                          </button>
                        </div>
                      )}

                    </div>
                    
                    {/* 시계 모양 아이콘 사각형 버튼 */}
                    <button 
                      type="button"
                      className="clock-btn"
                      onClick={handleClockIconClick}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px',
                        border: '1px solid #d0e1fd',
                        backgroundColor: '#f0f7ff', 
                        color: '#3b82f6',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(59, 130, 246, 0.08)',
                        outline: 'none',
                        padding: 0, 
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0f7ff'; }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      title="시간 전체 선택기 열기"
                    >
                      <i className="fa-regular fa-clock" style={{ fontSize: '18px', fontWeight: 600 }}></i>
                    </button>

                    {/* 4. 시계 클릭 시 뜨는 3열 통합 시간 선택기 (overscrollBehavior: contain 반영) */}
                    {showTimePicker && (
                      <div 
                        ref={timePickerRef}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)', 
                          right: '44px', // 좌측으로 이동하여 위 인풋 박스의 [오전 08 31] 요소와 1:1 수직 일직선 정렬
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '16px', 
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                          width: '162px', 
                          height: '136px', 
                          display: 'grid',
                          gridTemplateColumns: '62px 44px 44px', 
                          columnGap: '3px',
                          padding: '4px',
                          zIndex: 650, 
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          animation: 'fadeIn 0.15s ease-out',
                          overscrollBehavior: 'contain'
                        }}
                      >
                        {/* 1열: 오전 / 오후 / 완료 (3줄 고정 40px 배치) */}
                        <div 
                          style={{ 
                            borderRight: '1px solid #f1f5f9', 
                            display: 'flex', 
                            flexDirection: 'column',
                            padding: '4px',
                            height: '120px',
                            boxSizing: 'border-box',
                            justifyContent: 'space-between'
                          }}
                        >
                          {/* 1행: 현재 선택된 오전오후값 (선택됨, 상시 파란색 하이라이트) */}
                          <div 
                            onClick={() => {
                              setTimeAmPm(timeAmPm === '오전' ? '오후' : '오전');
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px',
                              margin: '1px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 800,
                              borderRadius: '6px',
                              backgroundColor: '#3b82f6', 
                              color: '#ffffff',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {timeAmPm}
                          </div>
                          
                          {/* 2행: 선택 안된 오전오후값 */}
                          <div 
                            onClick={() => {
                              setTimeAmPm(timeAmPm === '오전' ? '오후' : '오전');
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px',
                              margin: '1px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            className="search-item-hover"
                          >
                            {timeAmPm === '오전' ? '오후' : '오전'}
                          </div>

                          {/* 3행: 완료 버튼 */}
                          <div 
                            onClick={() => setShowTimePicker(false)}
                            style={{ 
                              height: '34px',
                              margin: '1px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 800,
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9', 
                              color: '#334155',
                              transition: 'all 0.15s ease',
                              border: '1px solid #cbd5e1'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                          >
                            완료
                          </div>
                        </div>

                        {/* 2열: 시 */}
                        <div 
                          className="hour-picker-col"
                          onWheel={handleHourWheel}
                          style={{ 
                            borderRight: '1px solid #f1f5f9',
                            padding: '4px 0', 
                            margin: 0,
                            height: '120px', 
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'hidden'
                          }} 
                        >
                          {/* 1행: 현재 선택 시 (선택됨, 상시 파란색 하이라이트) */}
                          <div 
                            onClick={() => {
                              setTimeHour(h1);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 800,
                              borderRadius: '6px',
                              backgroundColor: '#3b82f6', 
                              color: '#ffffff',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {String(h1).padStart(2, '0')}
                          </div>

                          {/* 2행: 다음 후보 시 */}
                          <div 
                            onClick={() => {
                              setTimeHour(h2);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            className="search-item-hover"
                          >
                            {String(h2).padStart(2, '0')}
                          </div>

                          {/* 3행: 다다음 후보 시 */}
                          <div 
                            onClick={() => {
                              setTimeHour(h3);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            className="search-item-hover"
                          >
                            {String(h3).padStart(2, '0')}
                          </div>
                        </div>

                        {/* 3열: 분 */}
                        <div 
                          onWheel={handleMinuteWheel}
                          style={{ 
                            padding: '4px 0', 
                            margin: 0,
                            height: '120px', 
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'hidden'
                          }} 
                        >
                          {/* 1행: 현재 선택 분 (선택됨, 상시 파란색 하이라이트) */}
                          <div 
                            onClick={() => {
                              setTimeMinute(m1);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 800,
                              borderRadius: '6px',
                              backgroundColor: '#3b82f6', 
                              color: '#ffffff',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {String(m1).padStart(2, '0')}
                          </div>

                          {/* 2행: 다음 후보 분 */}
                          <div 
                            onClick={() => {
                              setTimeMinute(m2);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            className="search-item-hover"
                          >
                            {String(m2).padStart(2, '0')}
                          </div>

                          {/* 3행: 다다음 후보 분 */}
                          <div 
                            onClick={() => {
                              setTimeMinute(m3);
                              setUseCurrentDate(false);
                            }}
                            style={{ 
                              height: '34px', 
                              margin: '1px 4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            className="search-item-hover"
                          >
                            {String(m3).padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* 3. 테이블형 제품 목록 카드 */}
        <div className="boxhero-style-form" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>제품 목록</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* 스크린샷 1, 5 ≡+ 일괄 추가 버튼 */}
              <button
                type="button"
                className="btn btn-action search-item-hover"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowBulkAddModal(true)}
              >
                <i className="fa-solid fa-bars-staggered"></i> 일괄 추가
              </button>
              <button
                type="button"
                className="btn btn-action search-item-hover"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => alert('엑셀 가져오기 기능 (준비중)')}
              >
                <i className="fa-solid fa-file-excel"></i> 엑셀 가져오기
              </button>
              <button
                type="button"
                className="btn btn-action search-item-hover"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => alert('바코드 스캐너 연동 (준비중)')}
              >
                <i className="fa-solid fa-expand"></i> 바코드 스캔
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', position: 'relative' }}>
            {/* 테이블 헤더 (스크린샷 4) */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr', backgroundColor: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#64748b', borderRadius: '8px 8px 0 0' }}>
              <div></div>
              <div>제품</div>
              <div>현재고</div>
              <div>{theme.label} <span style={{ color: '#ff4d4f' }}>*</span></div>
            </div>

            {/* 테이블 바디 */}
            <div ref={dropdownRef} style={{ position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', backgroundColor: '#ffffff' }}>
                <i className="fa-solid fa-plus" style={{ color: '#94a3b8', marginRight: '8px' }}></i>
                <input
                  type="text"
                  placeholder="제품 검색"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  style={{ border: 'none', width: '100%', outline: 'none', fontSize: '13px', color: '#1e293b' }}
                />
              </div>

              {/* 검색 드롭다운 결과창 (overflow: hidden 방해 없이 시원하게 잘림 없이 표시) */}
              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 4px 8px -2px rgba(0, 0, 0, 0.08)', zIndex: 100, maxHeight: '320px', overflowY: 'auto' }}>
                  {availableItems
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        className="search-item-hover"
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>{item.name}</strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.category || '기본'} / {item.brand || '기본'}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: theme.color }}>재고 {item.total_quantity}개</span>
                      </div>
                    ))}

                  {/* 드롭다운 맨 아래 파란색 + 제품 추가 버튼 (스크린샷 4 제품 추가 모달 연결) */}
                  <div
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowProductModal(true);
                    }}
                    style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#3b82f6',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff'
                    }}
                    className="search-item-hover"
                  >
                    <i className="fa-solid fa-plus"></i> 제품 추가
                  </div>
                </div>
              )}
            </div>

            {/* 테이블 품목 리스트 영역 (스크린샷 4 x 삭제 아이콘 & 카테고리/브랜드 라인) */}
            <div style={{ minHeight: '80px', backgroundColor: '#ffffff' }}>
              {selectedList.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  {theme.title}할 제품을 검색하여 목록에 추가해 주세요.
                </div>
              ) : (
                selectedList.map(row => (
                  <div key={row.item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>{row.item.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{row.item.sku}</span>
                    </div>
                    {/* 현재고: 선택된 위치(warehouse)의 재고 수량을 실시간 표시 */}
                    <div style={{ fontSize: '13px' }}>
                      {warehouse && warehouse !== '선택하세요' ? (
                        <span>
                          <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                            {row.item.locations?.[warehouse] ?? 0}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '2px' }}>개 ({warehouse})</span>
                        </span>
                      ) : (
                        <span style={{ color: '#475569' }}>{row.item.total_quantity} 개</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={row.qty}
                        onChange={(e) => handleQtyChange(row.item.id, Number(e.target.value))}
                        style={{ width: '80px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <button type="button" onClick={() => handleRemoveItem(row.item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 테이블 요약 행 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#475569', borderRadius: '0 0 8px 8px' }}>
              <span>{selectedList.length} 개 품목</span>
              <span>총 수량 {totalQtySum}</span>
            </div>
          </div>
        </div>

        {/* 4. 메모 입력창 카드 */}
        <div className="boxhero-style-form" style={{ padding: '20px', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>비고 / 메모</span>
          <textarea
            className="form-input"
            rows={3}
            placeholder="메모 입력&#13;&#10;TIP) #태그 입력 시 목록에서 '태그'로 검색할 수 있습니다.&#13;&#10;파일을 끌어다 놓거나 붙여넣기로 첨부할 수 있습니다."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', resize: 'none', borderRadius: '8px', fontSize: '13px', padding: '12px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>

        {/* 5. 하단 액션 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginBottom: '40px' }}>
          <button
            type="submit"
            disabled={selectedList.length === 0}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              backgroundColor: selectedList.length === 0 ? '#cbd5e1' : theme.color,
              color: '#ffffff',
              borderRadius: '8px',
              cursor: selectedList.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: `0 2px 4px ${theme.color}26`,
            }}
          >
            {theme.title} 완료
          </button>
          
          {type !== 'ADJUST' && ( 
            <button
              type="button"
              className="btn btn-action"
              onClick={() => alert('임시 저장되었습니다. (준비중)')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              임시 저장
            </button>
          )}
        </div>
      </form>

      {/* 제품 추가 모달 팝업 (완벽한 중앙 배치 & 4각 곡선 라운드 커팅) */}
      {showProductModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '82vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. 모달 상단 헤더 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                flexShrink: 0,
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>제품 추가</h2>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '18px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                ✕
              </button>
            </div>

            {/* 2. 모달 내부 스크롤 본문 */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <ProductForm
                isModal={true}
                onCancel={() => setShowProductModal(false)}
                onSuccess={() => {
                  const updatedItems = getStoredItems();
                  setDbItems(updatedItems);
                  // 새로 생성된 제품(가장 최근 등록된 0번째 품목)을 입출고 테이블 목록에 자동 추가
                  if (updatedItems.length > 0) {
                    const newlyCreatedItem = updatedItems[0];
                    setSelectedList((prev) => {
                      if (!prev.some((row) => row.item.id === newlyCreatedItem.id)) {
                        return [{ item: newlyCreatedItem, qty: 1 }, ...prev];
                      }
                      return prev;
                    });
                  }
                  setShowProductModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
