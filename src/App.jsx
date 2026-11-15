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
  CheckCircle2,
  Circle,
  Sparkles,
  Trash2,
  Download,
  Smartphone,
  Share,
  Gift,
  Camera,
  X
} from 'lucide-react';

// 대한민국 법정공휴일 및 대체공휴일 (2025 ~ 2027)
const KOREAN_HOLIDAYS = {
  // 2025
  '2025-01-01': '신정',
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-01': '삼일절',
  '2025-03-03': '대체공휴일(삼일절)',
  '2025-05-05': '어린이날·부처님오신날',
  '2025-05-06': '대체공휴일',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일(추석)',
  '2025-10-09': '한글날',
  '2025-12-25': '성탄절',
  // 2026
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일(삼일절)',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일(부처님오신날)',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일(광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일(개천절)',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',
  // 2027
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일(설날)',
  '2027-03-01': '삼일절',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-08-15': '광복절',
  '2027-08-16': '대체공휴일(광복절)',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '대체공휴일(개천절)',
  '2027-10-09': '한글날',
  '2027-10-11': '대체공휴일(한글날)',
  '2027-12-25': '성탄절'
};

const CATEGORY_META = {
  together: { label: '함께', badge: 'bg-rose-500 text-white', dot: 'bg-rose-500', card: 'border-rose-200 bg-rose-50/70' },
  boyfriend: { label: '남자친구 (AOS)', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500', card: 'border-blue-200 bg-blue-50/70' },
  girlfriend: { label: '여자친구 (iOS)', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500', card: 'border-amber-200 bg-amber-50/70' }
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
  const [currentUser, setCurrentUser] = useState('boyfriend'); // boyfriend (AOS) | girlfriend (iOS)
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
        title: '저녁 맛집 데이트',
        category: 'together',
        location: '성수동',
        author: 'boyfriend',
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
    const parsedTime = timeMatch ? `${String(Number(timeMatch[1]) < 12 && quickInput.includes('저녁') ? Number(timeMatch[1]) + 12 : timeMatch[1]).padStart(2, '0')}:00` : '19:00';

    const created = {
      id: Date.now().toString(),
      date: targetDate,
      time: parsedTime,
      title: quickInput.trim(),
      category: 'together',
      location: '',
      author: currentUser,
      notifySameDay: true,
      isNew: true
    };
    setEvents((prev) => [...prev, created]);
    setSelectedDate(targetDate);
    setQuickInput('');
    showToast('일정 등록 완료! 상대방 화면에도 실시간 반영됩니다.');
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
    showToast('새 일정이 등록되었습니다.');
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
    showToast(`'${wish.title}' 일정이 ${selectedDate}에 추가되었습니다!`);
  };

  const triggerTestPush = async () => {
    const todayEvents = events.filter((ev) => ev.date === todayKey);
    const bodyText =
      todayEvents.length > 0
        ? `오늘 일정: ${todayEvents.map((e) => `${e.time} ${e.title}`).join(', ')}`
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-rose-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-slate-900">우리둘 캘린더</h1>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">{dDayCount}</span>
              </div>
              <p className="text-[11px] text-slate-400">AOS · iOS 실시간 커플 동기화</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* OS Switcher */}
            <button
              onClick={() => setCurrentUser((u) => (u === 'boyfriend' ? 'girlfriend' : 'boyfriend'))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                currentUser === 'boyfriend' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
              }`}
            >
              {currentUser === 'boyfriend' ? '나 (AOS)' : '여자친구 (iOS)'}
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className="relative rounded-full p-2 text-slate-600 hover:bg-rose-50"
              title="당일 알림 설정"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <button
              onClick={triggerInstallPWA}
              className="rounded-full bg-rose-500 p-2 text-white shadow-sm hover:bg-rose-600"
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
          <div className="space-y-3 p-4">
            {/* Quick Add */}
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-2">
              <Sparkles className="ml-1 h-4 w-4 shrink-0 text-rose-500" />
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="예: 내일 저녁 7시 강남 파스타 데이트"
                className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <button type="submit" className="shrink-0 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">
                등록
              </button>
            </form>

            {/* Month Nav & Filter */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="rounded-lg p-1.5 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-slate-800">
                  {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
                </span>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="rounded-lg p-1.5 hover:bg-slate-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-1 text-[11px]">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'together', label: '함께' },
                  { id: 'boyfriend', label: 'AOS' },
                  { id: 'girlfriend', label: 'iOS' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterCategory(f.id)}
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      filterCategory === f.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                <div key={w} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : ''}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateObj, idx) => {
                if (!dateObj) return <div key={`empty-${idx}`} className="h-14" />;
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

                return (
                  <button
                    key={dKey}
                    onClick={() => setSelectedDate(dKey)}
                    className={`flex h-14 flex-col items-center rounded-xl p-1 text-left transition ${
                      isSelected ? 'bg-rose-50 ring-2 ring-rose-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-rose-500 text-white'
                          : isRed
                          ? 'text-rose-500'
                          : isBlue
                          ? 'text-blue-500'
                          : 'text-slate-700'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                    {holiday && (
                      <span className="w-full truncate text-center text-[9px] font-medium text-rose-500">{holiday}</span>
                    )}
                    <div className="mt-auto flex gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span key={ev.id} className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[ev.category].dot}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Date Detail */}
            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800">{selectedDate}</span>
                  {selectedHoliday && (
                    <span className="ml-2 rounded-md bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
                      {selectedHoliday}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> 일정 추가
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">등록된 일정이 없습니다. 위에서 일정을 추가해보세요!</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`flex items-start justify-between rounded-xl border p-3 ${CATEGORY_META[ev.category].card}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CATEGORY_META[ev.category].badge}`}>
                            {CATEGORY_META[ev.category].label}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{ev.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {ev.time}
                          </span>
                          {ev.location && (
                            <a
                              href={`https://map.naver.com/p/search/${encodeURIComponent(ev.location)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-0.5 text-rose-600 underline"
                            >
                              <MapPin className="h-3 w-3" /> {ev.location}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setEvents((prev) => prev.filter((item) => item.id !== ev.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="space-y-4 p-4">
            <h2 className="text-base font-bold text-slate-900">데이트 위시리스트</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWishTitle.trim()) return;
                setWishes((prev) => [
                  ...prev,
                  { id: Date.now().toString(), title: newWishTitle, location: newWishLoc || '서울', tag: '데이트', author: currentUser }
                ]);
                setNewWishTitle('');
                setNewWishLoc('');
              }}
              className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3"
            >
              <input
                type="text"
                value={newWishTitle}
                onChange={(e) => setNewWishTitle(e.target.value)}
                placeholder="가고 싶은 맛집, 전시, 여행지"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWishLoc}
                  onChange={(e) => setNewWishLoc(e.target.value)}
                  placeholder="위치 (예: 연남동)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />
                <button type="submit" className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white">
                  담기
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {wishes.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{w.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {w.location} · {w.author === 'boyfriend' ? '남자친구 추천' : '여자친구 추천'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleConvertWish(w)}
                    className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
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
            <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 p-4 text-white shadow">
              <p className="text-xs opacity-90">우리가 함께한 시간</p>
              <p className="mt-1 text-2xl font-extrabold">{dDayCount}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span>사귄 날:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded bg-white/20 px-2 py-0.5 text-white"
                />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMemTitle.trim()) return;
                setMemories((prev) => [{ id: Date.now().toString(), date: selectedDate, title: newMemTitle, note: newMemNote }, ...prev]);
                setNewMemTitle('');
                setNewMemNote('');
              }}
              className="space-y-2 rounded-2xl border border-slate-100 p-3"
            >
              <input
                type="text"
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                placeholder="추억 제목 (예: 첫 해외여행)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemNote}
                  onChange={(e) => setNewMemNote(e.target.value)}
                  placeholder="한 줄 기록"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
                <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white">
                  기록
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {memories.map((m) => (
                <div key={m.id} className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                  <div className="flex justify-between text-[11px] text-rose-500">
                    <span>{m.date}</span>
                    <span>추억 로그</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-800">{m.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className="space-y-4 p-4">
            <h2 className="text-base font-bold text-slate-900">AOS · iOS 스마트폰 앱 설치 가이드</h2>
            <p className="text-xs leading-relaxed text-slate-600">
              이 앱은 스토어 심사 없이 안드로이드와 아이폰 모두 <strong>홈 화면 앱 아이콘</strong>으로 다운로드하여 전체 화면 네이티브 앱처럼 사용할 수 있도록 제작되었습니다.
            </p>

            {deferredPrompt && (
              <button
                onClick={triggerInstallPWA}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white shadow"
              >
                <Download className="h-4 w-4" /> 지금 바로 스마트폰에 앱 다운로드
              </button>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <Smartphone className="h-4 w-4" /> 남자친구 (Android / 갤럭시) 설치 방법
              </div>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1">
                <li>크롬(Chrome) 브라우저에서 배포된 앱 주소로 접속합니다.</li>
                <li>우측 상단 <strong>[⋮ 더보기]</strong> 메뉴를 누릅니다.</li>
                <li><strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 선택하면 앱 서랍에 설치됩니다.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Share className="h-4 w-4" /> 여자친구 (iOS / 아이폰) 설치 방법
              </div>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1">
                <li>사파리(Safari) 브라우저에서 배포된 앱 주소로 접속합니다.</li>
                <li>하단 중앙의 <strong>[공유 아이콘 (네모 위 화살표)]</strong>을 누릅니다.</li>
                <li><strong>[홈 화면에 추가]</strong>를 누르면 바탕화면에 앱 아이콘이 생성됩니다.</li>
                <li>설치된 앱을 실행 후 종 모양 아이콘을 눌러 <strong>알림 허용</strong>을 켜주세요.</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 px-2 py-2 backdrop-blur">
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
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
                active ? 'text-rose-500' : 'text-slate-400'
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
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={handleCreateEvent} className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{selectedDate} 새 일정 등록</h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setNewCategory(key)}
                  className={`rounded-xl py-2 text-xs font-semibold ${
                    newCategory === key ? meta.badge : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="일정 제목 (예: 기념일 저녁 식사)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="장소 (지도 연동)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <button type="submit" className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow">
              등록 및 상대방에게 공유
            </button>
          </form>
        </div>
      )}

      {/* Notification Preview Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">당일 오전 8:30 양방향 알림 미리보기</h3>
              <button onClick={() => setShowNotifModal(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-100 p-3 text-xs">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold text-blue-600">Android (남자친구 기기)</p>
                <p className="mt-0.5 font-semibold text-slate-800">우리둘 캘린더 · 오늘 일정 알림</p>
                <p className="text-slate-500">오늘 예정된 일정이 있습니다. 시간을 확인해주세요!</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold text-amber-600">iOS (여자친구 아이폰 잠금화면)</p>
                <p className="mt-0.5 font-semibold text-slate-800">우리둘 캘린더 · 오늘 일정 알림</p>
                <p className="text-slate-500">오늘 예정된 일정이 있습니다. 시간을 확인해주세요!</p>
              </div>
            </div>

            <button
              onClick={triggerTestPush}
              className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow"
            >
              내 기기로 실제 알림 테스트 발송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
