import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Heart,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Trash2,
  Download,
  Smartphone,
  Share,
  Gift,
  Camera,
  X,
  UserCheck
} from 'lucide-react';

// 대한민국 법정공휴일 및 대체공휴일 (2025 ~ 2027)
const KOREAN_HOLIDAYS = {
  // 2025
  '2025-01-01': '신정',
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-01': '삼일절',
  '2025-03-03': '대체공휴일',
  '2025-05-05': '어린이날',
  '2025-05-06': '대체공휴일',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일',
  '2025-10-09': '한글날',
  '2025-12-25': '성탄절',
  // 2026
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',
  // 2027
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일',
  '2027-03-01': '삼일절',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-08-15': '광복절',
  '2027-08-16': '대체공휴일',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '대체공휴일',
  '2027-10-09': '한글날',
  '2027-10-11': '대체공휴일',
  '2027-12-25': '성탄절'
};

// 주체자 구분: 또또 (나) / 뚜뚜 (여자친구) / 함께
const SUBJECT_META = {
  boyfriend: {
    label: '또또 (나)',
    shortLabel: '또또',
    badge: 'bg-sky-500 text-zinc-950 font-bold',
    pillInactive: 'bg-zinc-800/90 text-sky-300 border border-sky-500/30',
    calendarBar: 'bg-sky-500/25 text-sky-200 border-l-2 border-sky-400',
    dot: 'bg-sky-400',
    card: 'border-sky-500/30 bg-sky-950/35'
  },
  girlfriend: {
    label: '뚜뚜 (여자친구)',
    shortLabel: '뚜뚜',
    badge: 'bg-amber-400 text-zinc-950 font-bold',
    pillInactive: 'bg-zinc-800/90 text-amber-300 border border-amber-500/30',
    calendarBar: 'bg-amber-400/25 text-amber-200 border-l-2 border-amber-400',
    dot: 'bg-amber-400',
    card: 'border-amber-500/30 bg-amber-950/35'
  },
  together: {
    label: '함께',
    shortLabel: '함께',
    badge: 'bg-rose-500 text-white font-bold',
    pillInactive: 'bg-zinc-800/90 text-rose-300 border border-rose-500/30',
    calendarBar: 'bg-rose-500/25 text-rose-200 border-l-2 border-rose-400',
    dot: 'bg-rose-400',
    card: 'border-rose-500/30 bg-rose-950/35'
  }
};

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const [activeTab, setActiveTab] = useState('calendar'); // calendar | wishlist | memories | install
  const [currentUser, setCurrentUser] = useState('boyfriend'); // boyfriend (또또) | girlfriend (뚜뚜)
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [filterCategory, setFilterCategory] = useState('all');

  // Persistent States
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('couple_events_v1');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        date: todayKey,
        time: '19:00',
        title: '성수동 저녁 맛집 데이트',
        category: 'together',
        location: '성수동',
        author: 'boyfriend',
        notifySameDay: true,
        isNew: false
      },
      {
        id: '2',
        date: todayKey,
        time: '14:00',
        title: '또또 운동 및 개인 일정',
        category: 'boyfriend',
        location: '',
        author: 'boyfriend',
        notifySameDay: true,
        isNew: false
      },
      {
        id: '3',
        date: todayKey,
        time: '15:30',
        title: '뚜뚜 필라테스 수업',
        category: 'girlfriend',
        location: '',
        author: 'girlfriend',
        notifySameDay: true,
        isNew: false
      }
    ];
  });

  const [wishes, setWishes] = useState(() => {
    const saved = localStorage.getItem('couple_wishes_v1');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'w1', title: '한강 피크닉 & 치맥', location: '여의도 한강공원', tag: '데이트', author: 'girlfriend' },
      { id: 'w2', title: '주말 근교 드라이브 카페', location: '남양주 북한강', tag: '드라이브', author: 'boyfriend' }
    ];
  });

  const [startDate, setStartDate] = useState(() => localStorage.getItem('couple_start_date') || '2025-05-01');
  const [memories, setMemories] = useState(() => {
    const saved = localStorage.getItem('couple_memories_v1');
    return saved
      ? JSON.parse(saved)
      : [{ id: 'm1', date: '2026-10-15', title: '가을 여행 추억', note: '날씨도 완벽하고 음식도 최고였던 날!' }];
  });

  // Modals & Inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [quickSubject, setQuickSubject] = useState('together');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('18:30');
  const [newCategory, setNewCategory] = useState('together');
  const [newLocation, setNewLocation] = useState('');
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishLoc, setNewWishLoc] = useState('');
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemNote, setNewMemNote] = useState('');

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('couple_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('couple_wishes_v1', JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    localStorage.setItem('couple_start_date', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('couple_memories_v1', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // D-Day Calculation
  const dDayCount = useMemo(() => {
    const s = new Date(startDate);
    const diff = Math.floor((new Date(todayKey) - s) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `D+${diff + 1}` : `D${diff}`;
  }, [startDate, todayKey]);

  // Calendar Grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [viewDate]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    let targetDate = selectedDate;
    if (quickInput.includes('내일')) {
      const tmr = new Date(today);
      tmr.setDate(tmr.getDate() + 1);
      targetDate = formatDateKey(tmr);
    }
    const timeMatch = quickInput.match(/(\d{1,2})시/);
    const parsedTime = timeMatch
      ? `${String(
          Number(timeMatch[1]) < 12 && quickInput.includes('저녁') ? Number(timeMatch[1]) + 12 : timeMatch[1]
        ).padStart(2, '0')}:00`
      : '19:00';

    const created = {
      id: Date.now().toString(),
      date: targetDate,
      time: parsedTime,
      title: quickInput.trim(),
      category: quickSubject,
      location: '',
      author: currentUser,
      notifySameDay: true,
      isNew: true
    };
    setEvents((prev) => [...prev, created]);
    setSelectedDate(targetDate);
    setQuickInput('');
    showToast(`[${SUBJECT_META[quickSubject].label}] 일정이 등록되었습니다!`);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = {
      id: Date.now().toString(),
      date: selectedDate,
      time: newTime,
      title: newTitle.trim(),
      category: newCategory,
      location: newLocation.trim(),
      author: currentUser,
      notifySameDay: true,
      isNew: true
    };
    setEvents((prev) => [...prev, created]);
    setNewTitle('');
    setNewLocation('');
    setShowAddModal(false);
    showToast(`[${SUBJECT_META[newCategory].label}] 새 일정이 등록되었습니다.`);
  };

  const handleConvertWish = (wish) => {
    const created = {
      id: Date.now().toString(),
      date: selectedDate,
      time: '14:00',
      title: wish.title,
      category: 'together',
      location: wish.location,
      author: currentUser,
      notifySameDay: true,
      isNew: true
    };
    setEvents((prev) => [...prev, created]);
    setWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setActiveTab('calendar');
    showToast(`'${wish.title}' 일정이 ${selectedDate} [함께] 일정으로 추가되었습니다!`);
  };

  const triggerTestPush = async () => {
    const todayEvents = events.filter((ev) => ev.date === todayKey);
    const bodyText =
      todayEvents.length > 0
        ? `오늘 일정: ${todayEvents
            .map((e) => `[${SUBJECT_META[e.category]?.shortLabel || '함께'}] ${e.time} ${e.title}`)
            .join(', ')}`
        : '오늘 등록된 공유 일정이 있습니다. 앱에서 확인해보세요!';

    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('우리둘 캘린더 · 당일 알림', {
            body: bodyText,
            icon: '/icon-192.png'
          });
        } else {
          new Notification('우리둘 캘린더 · 당일 알림', { body: bodyText });
        }
        showToast('실제 푸시 알림을 발송했습니다!');
        return;
      }
    }
    showToast('브라우저 알림 권한을 허용하면 실제 알림이 울립니다.');
  };

  const triggerInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('홈 화면에 앱 설치가 시작되었습니다!');
      }
      setDeferredPrompt(null);
    } else {
      setActiveTab('install');
    }
  };

  const selectedDayEvents = events.filter(
    (ev) => ev.date === selectedDate && (filterCategory === 'all' || ev.category === filterCategory)
  );
  const selectedHoliday = KOREAN_HOLIDAYS[selectedDate];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-zinc-900 bg-zinc-950 text-zinc-100 shadow-2xl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs font-medium text-zinc-100 shadow-xl backdrop-blur">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-zinc-50">우리둘 캘린더</h1>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 ring-1 ring-rose-500/30">
                  {dDayCount}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">또또 · 뚜뚜 공유 캘린더</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 작성자 전환 스위치 */}
            <button
              onClick={() => setCurrentUser((u) => (u === 'boyfriend' ? 'girlfriend' : 'boyfriend'))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                currentUser === 'boyfriend'
                  ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40'
                  : 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40'
              }`}
              title="현재 접속 사용자 전환"
            >
              {currentUser === 'boyfriend' ? '또또 (나)' : '뚜뚜 (여자친구)'}
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className="relative rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800"
              title="당일 알림 설정"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <button
              onClick={triggerInstallPWA}
              className="rounded-full bg-rose-500 p-2 text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-600"
              title="앱 다운로드 / 설치"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'calendar' && (
          <div className="space-y-3 p-3.5">
            {/* Quick Add with 주체자 선택 */}
            <form
              onSubmit={handleQuickAdd}
              className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2.5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="ml-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="빠른 등록: 예) 내일 저녁 7시 강남 파스타"
                  className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                >
                  등록
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2">
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <UserCheck className="h-3 w-3 text-zinc-500" /> 주체자:
                </span>
                <div className="flex gap-1.5">
                  {(['boyfriend', 'girlfriend', 'together']).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setQuickSubject(key)}
                      className={`rounded-lg px-2 py-0.5 text-[11px] transition ${
                        quickSubject === key ? SUBJECT_META[key].badge : SUBJECT_META[key].pillInactive
                      }`}
                    >
                      {SUBJECT_META[key].label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Month Nav & 주체별 색상 범례/필터 */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-zinc-100">
                  {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
                </span>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* 색상 범례 겸 필터 */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`rounded-full px-2 py-1 font-semibold transition ${
                    filterCategory === 'all'
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800'
                  }`}
                >
                  전체
                </button>
                {(['boyfriend', 'girlfriend', 'together']).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilterCategory((prev) => (prev === key ? 'all' : key))}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition ${
                      filterCategory === key
                        ? SUBJECT_META[key].badge
                        : 'bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        filterCategory === key ? 'bg-current' : SUBJECT_META[key].dot
                      }`}
                    />
                    {SUBJECT_META[key].shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-zinc-500">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                <div key={w} className={idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-sky-400' : ''}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid: 주체별 컬러 바 + 일정 텍스트 표시 (길면 truncate) */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateObj, idx) => {
                if (!dateObj) return <div key={`empty-${idx}`} className="min-h-[82px]" />;
                const dKey = formatDateKey(dateObj);
                const holiday = KOREAN_HOLIDAYS[dKey];
                const dayOfWeek = dateObj.getDay();
                const isRed = dayOfWeek === 0 || Boolean(holiday);
                const isBlue = dayOfWeek === 6 && !holiday;
                const isSelected = dKey === selectedDate;
                const isToday = dKey === todayKey;
                const dayEvents = events.filter(
                  (ev) => ev.date === dKey && (filterCategory === 'all' || ev.category === filterCategory)
                );
                const maxVisible = holiday ? 2 : 3;
                const hiddenCount = dayEvents.length - maxVisible;

                return (
                  <button
                    key={dKey}
                    onClick={() => setSelectedDate(dKey)}
                    className={`flex min-h-[82px] flex-col items-stretch justify-start overflow-hidden rounded-xl border p-1 text-left transition ${
                      isSelected
                        ? 'border-rose-500 bg-zinc-900 ring-1 ring-rose-500'
                        : 'border-zinc-800/70 bg-zinc-900/50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-0.5">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isToday
                            ? 'bg-rose-500 text-white'
                            : isRed
                            ? 'text-rose-400'
                            : isBlue
                            ? 'text-sky-400'
                            : 'text-zinc-200'
                        }`}
                      >
                        {dateObj.getDate()}
                      </span>
                      {holiday && (
                        <span className="truncate text-[8px] font-medium text-rose-400">{holiday}</span>
                      )}
                    </div>

                    {/* 달력 셀 내부: 주체 색상 구분 + 기입된 내용 텍스트 (길면 말줄임표로 잘림) */}
                    <div className="mt-1 flex w-full flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, maxVisible).map((ev) => {
                        const meta = SUBJECT_META[ev.category] || SUBJECT_META.together;
                        return (
                          <div
                            key={ev.id}
                            title={`${meta.label}: ${ev.title}`}
                            className={`w-full truncate rounded-[4px] px-1 py-[1px] text-[9.5px] font-medium leading-tight ${meta.calendarBar}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <span className="pr-0.5 text-right text-[8.5px] font-medium text-zinc-400">
                          +{hiddenCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Date Detail */}
            <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100">{selectedDate}</span>
                  {selectedHoliday && (
                    <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-rose-300">
                      {selectedHoliday}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNewCategory('together');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1 rounded-xl bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  <Plus className="h-3.5 w-3.5" /> 일정 추가
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-500">
                  등록된 일정이 없습니다. 위에서 일정을 추가해보세요!
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => {
                    const meta = SUBJECT_META[ev.category] || SUBJECT_META.together;
                    return (
                      <div
                        key={ev.id}
                        className={`flex items-start justify-between rounded-xl border p-3 ${meta.card}`}
                      >
                        <div className="min-w-0 flex-1 space-y-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] ${meta.badge}`}>
                              {meta.label}
                            </span>
                            <span className="break-words text-xs font-bold text-zinc-100">{ev.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {ev.time}
                            </span>
                            {ev.location && (
                              <a
                                href={`https://map.naver.com/p/search/${encodeURIComponent(ev.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-0.5 text-rose-300 underline"
                              >
                                <MapPin className="h-3 w-3" /> {ev.location}
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setEvents((prev) => prev.filter((item) => item.id !== ev.id))}
                          className="shrink-0 text-zinc-500 transition hover:text-rose-400"
                          title="일정 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="space-y-4 p-4">
            <h2 className="text-base font-bold text-zinc-100">데이트 위시리스트</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWishTitle.trim()) return;
                setWishes((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    title: newWishTitle,
                    location: newWishLoc || '서울',
                    tag: '데이트',
                    author: currentUser
                  }
                ]);
                setNewWishTitle('');
                setNewWishLoc('');
              }}
              className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <input
                type="text"
                value={newWishTitle}
                onChange={(e) => setNewWishTitle(e.target.value)}
                placeholder="가고 싶은 맛집, 전시, 여행지"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWishLoc}
                  onChange={(e) => setNewWishLoc(e.target.value)}
                  placeholder="위치 (예: 연남동)"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
                <button type="submit" className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white">
                  담기
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {wishes.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-100">{w.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {w.location} · {w.author === 'boyfriend' ? '또또 추천' : '뚜뚜 추천'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleConvertWish(w)}
                    className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/30"
                  >
                    {selectedDate}에 확정
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 p-4 text-white shadow-lg shadow-rose-950/50">
              <p className="text-xs opacity-90">또또 ♥ 뚜뚜 함께한 시간</p>
              <p className="mt-1 text-2xl font-extrabold">{dDayCount}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span>사귄 날:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded bg-black/25 px-2 py-0.5 text-white"
                />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMemTitle.trim()) return;
                setMemories((prev) => [
                  { id: Date.now().toString(), date: selectedDate, title: newMemTitle, note: newMemNote },
                  ...prev
                ]);
                setNewMemTitle('');
                setNewMemNote('');
              }}
              className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <input
                type="text"
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                placeholder="추억 제목 (예: 첫 해외여행)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemNote}
                  onChange={(e) => setNewMemNote(e.target.value)}
                  placeholder="한 줄 기록"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
                <button type="submit" className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950">
                  기록
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {memories.map((m) => (
                <div key={m.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
                  <div className="flex justify-between text-[11px] text-rose-400">
                    <span>{m.date}</span>
                    <span>추억 로그</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-zinc-100">{m.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className="space-y-4 p-4">
            <h2 className="text-base font-bold text-zinc-100">AOS · iOS 스마트폰 앱 설치 가이드</h2>
            <p className="text-xs leading-relaxed text-zinc-400">
              안드로이드(또또)와 아이폰(뚜뚜) 모두 브라우저에서 <strong className="text-zinc-200">홈 화면에 추가</strong>하면
              하트 캘린더 아이콘의 전체 화면 네이티브 앱으로 사용할 수 있습니다.
            </p>

            {deferredPrompt && (
              <button
                onClick={triggerInstallPWA}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white shadow-lg"
              >
                <Download className="h-4 w-4" /> 지금 바로 스마트폰에 앱 다운로드
              </button>
            )}

            <div className="space-y-1.5 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Smartphone className="h-4 w-4" /> 또또 (Android / 갤럭시) 설치 방법
              </div>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-zinc-300">
                <li>크롬(Chrome) 브라우저에서 배포된 앱 주소로 접속합니다.</li>
                <li>우측 상단 <strong>[⋮ 더보기]</strong> 메뉴를 누릅니다.</li>
                <li><strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 선택합니다.</li>
              </ol>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Share className="h-4 w-4" /> 뚜뚜 (iOS / 아이폰) 설치 방법
              </div>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-zinc-300">
                <li>사파리(Safari) 브라우저에서 배포된 앱 주소로 접속합니다.</li>
                <li>하단 중앙의 <strong>[공유 아이콘 (□↑)]</strong>을 누릅니다.</li>
                <li><strong>[홈 화면에 추가]</strong>를 누르면 바탕화면에 앱 아이콘이 생성됩니다.</li>
                <li>설치된 앱을 실행 후 종 모양 아이콘을 눌러 <strong>알림 허용</strong>을 켜주세요.</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-zinc-800/90 bg-zinc-950/95 px-2 py-2 backdrop-blur">
        {[
          { id: 'calendar', icon: CalendarIcon, label: '캘린더' },
          { id: 'wishlist', icon: Gift, label: '위시리스트' },
          { id: 'memories', icon: Camera, label: '기념일·추억' },
          { id: 'install', icon: Download, label: '앱 설치' }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition ${
                active ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-md space-y-3.5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">{selectedDate} 새 일정 등록</h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>

            {/* 주체자 선택 버튼 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400">주체자 선택</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['boyfriend', 'girlfriend', 'together']).map((key) => {
                  const meta = SUBJECT_META[key];
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setNewCategory(key)}
                      className={`rounded-xl py-2 text-xs transition ${
                        newCategory === key ? meta.badge : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="일정 내용 (예: 기념일 저녁 식사)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-rose-500 focus:outline-none"
              />
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="장소 (지도 연동)"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
            >
              [{SUBJECT_META[newCategory].label}] 일정 등록하기
            </button>
          </form>
        </div>
      )}

      {/* Notification Preview Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">당일 오전 8:30 양방향 알림 미리보기</h3>
              <button onClick={() => setShowNotifModal(false)}>
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>

            <div className="space-y-2 rounded-2xl bg-zinc-950 p-3 text-xs">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-[10px] font-bold text-sky-400">또또 (Android 기기)</p>
                <p className="mt-0.5 font-semibold text-zinc-100">우리둘 캘린더 · 오늘 일정 알림</p>
                <p className="text-zinc-400">오늘 예정된 일정이 있습니다. 시간을 확인해주세요!</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-[10px] font-bold text-amber-400">뚜뚜 (iOS 아이폰 잠금화면)</p>
                <p className="mt-0.5 font-semibold text-zinc-100">우리둘 캘린더 · 오늘 일정 알림</p>
                <p className="text-zinc-400">오늘 예정된 일정이 있습니다. 시간을 확인해주세요!</p>
              </div>
            </div>

            <button
              onClick={triggerTestPush}
              className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
            >
              내 기기로 실제 알림 테스트 발송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
