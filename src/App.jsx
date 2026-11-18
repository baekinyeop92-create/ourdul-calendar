import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  Heart,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Trash2,
  Pencil,
  Download,
  Smartphone,
  Share,
  Share2,
  Gift,
  Camera,
  X,
  Cloud,
  CloudOff,
  Image as ImageIcon,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBcEUiXLgPpNzpGAipDEisbjH2KTUmGeoE",
  authDomain: "ourdul-calendar.firebaseapp.com",
  projectId: "ourdul-calendar",
  storageBucket: "ourdul-calendar.firebasestorage.app",
  messagingSenderId: "1077364780678",
  appId: "1:1077364780678:web:52e8a0eea680940268eb07"
};

const isFirebaseConfigured = Boolean(
  FIREBASE_CONFIG.apiKey &&
  !FIREBASE_CONFIG.apiKey.startsWith('여기에_') &&
  FIREBASE_CONFIG.projectId &&
  !FIREBASE_CONFIG.projectId.startsWith('여기에_')
);

let db = null;
if (isFirebaseConfigured) {
  try {
    const firebaseApp = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(firebaseApp);
  } catch (err) {
    console.error('Firebase 초기화 오류:', err);
  }
}

// 두 사람의 공유 데이터 경로 (또또 & 뚜뚜 전용 공간)
const COUPLE_ROOM_ID = 'ttotto-ttuttu-shared';
const DEFAULT_START_DATE = '2020-04-19';

// 대한민국 법정공휴일 및 대체공휴일 (2025 ~ 2027)
const KOREAN_HOLIDAYS = {
  '2025-01-01': '신정', '2025-01-28': '설날 연휴', '2025-01-29': '설날', '2025-01-30': '설날 연휴',
  '2025-03-01': '삼일절', '2025-03-03': '대체공휴일', '2025-05-05': '어린이날', '2025-05-06': '대체공휴일',
  '2025-06-06': '현충일', '2025-08-15': '광복절', '2025-10-03': '개천절', '2025-10-05': '추석 연휴',
  '2025-10-06': '추석', '2025-10-07': '추석 연휴', '2025-10-08': '대체공휴일', '2025-10-09': '한글날', '2025-12-25': '성탄절',
  '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일', '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일',
  '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴', '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절',
  '2027-01-01': '신정', '2027-02-06': '설날 연휴', '2027-02-07': '설날', '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일', '2027-03-01': '삼일절', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일', '2027-08-15': '광복절', '2027-08-16': '대체공휴일', '2027-09-14': '추석 연휴',
  '2027-09-15': '추석', '2027-09-16': '추석 연휴', '2027-10-03': '개천절', '2027-10-04': '대체공휴일',
  '2027-10-09': '한글날', '2027-10-11': '대체공휴일', '2027-12-25': '성탄절'
};

const SUBJECT_META = {
  boyfriend: {
    label: '또또',
    badge: 'bg-sky-500 text-zinc-950 font-bold',
    calendarBar: 'bg-sky-500/30 text-sky-200',
    dot: 'bg-sky-400',
    card: 'border-sky-500/35 bg-sky-950/40'
  },
  girlfriend: {
    label: '뚜뚜',
    badge: 'bg-amber-400 text-zinc-950 font-bold',
    calendarBar: 'bg-amber-400/30 text-amber-200',
    dot: 'bg-amber-400',
    card: 'border-amber-500/35 bg-amber-950/40'
  },
  together: {
    label: '함께',
    badge: 'bg-rose-500 text-white font-bold',
    calendarBar: 'bg-rose-500/30 text-rose-200',
    dot: 'bg-rose-400',
    card: 'border-rose-500/35 bg-rose-950/40'
  }
};

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 외부 링크 프로토콜 자동 보정
function formatExternalUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// 사진을 Firestore에 바로 저장할 수 있도록 경량 Base64 이미지로 압축
function compressImageFile(file, maxSize = 720, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const [activeTab, setActiveTab] = useState('calendar');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('couple_current_user') || 'boyfriend');
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [filterCategory, setFilterCategory] = useState('all');
  const [syncConnected, setSyncConnected] = useState(false);

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('couple_events_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishes, setWishes] = useState(() => {
    const saved = localStorage.getItem('couple_wishes_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // 처음 만난 날: 2020-04-19 기본 적용
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('couple_start_date');
    if (!saved || saved === '2025-05-01') return DEFAULT_START_DATE;
    return saved;
  });

  const [memories, setMemories] = useState(() => {
    if (db) return [];
    const saved = localStorage.getItem('couple_memories_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // 일정 추가/편집 모달 상태
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventDateInput, setEventDateInput] = useState(todayKey);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('18:30');
  const [newCategory, setNewCategory] = useState('together');
  const [newLocation, setNewLocation] = useState('');

  // 위시리스트 추가/편집 상태 (사진 & 링크 포함)
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishLoc, setNewWishLoc] = useState('');
  const [newWishLink, setNewWishLink] = useState('');
  const [newWishImage, setNewWishImage] = useState('');
  const [newWishAuthor, setNewWishAuthor] = useState('boyfriend');

  const [showWishEditModal, setShowWishEditModal] = useState(false);
  const [editingWishId, setEditingWishId] = useState(null);
  const [editWishTitle, setEditWishTitle] = useState('');
  const [editWishLoc, setEditWishLoc] = useState('');
  const [editWishLink, setEditWishLink] = useState('');
  const [editWishImage, setEditWishImage] = useState('');
  const [editWishAuthor, setEditWishAuthor] = useState('boyfriend');

  // 사진 원본 확대 보기 모달
  const [previewImage, setPreviewImage] = useState(null);

  // 추억 & 알림 모달 상태
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemNote, setNewMemNote] = useState('');

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    localStorage.setItem('couple_current_user', currentUser);
    setNewWishAuthor(currentUser);
  }, [currentUser]);

  // Firebase Firestore 실시간 양방향 구독 (AOS <-> iOS)
  useEffect(() => {
    if (!db) return;

    const eventsRef = collection(db, 'couples', COUPLE_ROOM_ID, 'events');
    const unsubEvents = onSnapshot(
      eventsRef,
      async (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        setEvents(list);
        setSyncConnected(true);

        if (localStorage.getItem('couple_events_migrated_v1') !== 'true') {
          localStorage.setItem('couple_events_migrated_v1', 'true');
          const localSaved = localStorage.getItem('couple_events_v1');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const ev of parsed) {
                  if (ev && ev.id && ev.title) {
                    await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'events', String(ev.id)), ev, { merge: true });
                  }
                }
              }
            } catch (e) {
              console.error('기존 일정 마이그레이션 오류:', e);
            }
          }
        }
      },
      (error) => {
        console.error('일정 동기화 오류:', error);
        setSyncConnected(false);
      }
    );

    const wishesRef = collection(db, 'couples', COUPLE_ROOM_ID, 'wishes');
    const unsubWishes = onSnapshot(wishesRef, async (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setWishes(list);

      if (localStorage.getItem('couple_wishes_migrated_v1') !== 'true') {
        localStorage.setItem('couple_wishes_migrated_v1', 'true');
        const localWishes = localStorage.getItem('couple_wishes_v1');
        if (localWishes) {
          try {
            const parsed = JSON.parse(localWishes);
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const w of parsed) {
                if (w && w.id && w.title) {
                  await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'wishes', String(w.id)), w, { merge: true });
                }
              }
            }
          } catch (e) {
            console.error('기존 위시리스트 마이그레이션 오류:', e);
          }
        }
      }
    });

    const memoriesRef = collection(db, 'couples', COUPLE_ROOM_ID, 'memories');
    const unsubMemories = onSnapshot(memoriesRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setMemories(list);
    });

    const settingsRef = doc(db, 'couples', COUPLE_ROOM_ID, 'settings', 'main');
    const unsubSettings = onSnapshot(settingsRef, async (docSnap) => {
      if (docSnap.exists() && docSnap.data().startDate && docSnap.data().startDate !== '2025-05-01') {
        const remoteDate = docSnap.data().startDate;
        setStartDate(remoteDate);
        localStorage.setItem('couple_start_date', remoteDate);
      } else {
        setStartDate(DEFAULT_START_DATE);
        localStorage.setItem('couple_start_date', DEFAULT_START_DATE);
        try {
          await setDoc(settingsRef, { startDate: DEFAULT_START_DATE }, { merge: true });
        } catch (e) {
          console.error('기념일 초기 동기화 오류:', e);
        }
      }
    });

    return () => {
      unsubEvents();
      unsubWishes();
      unsubMemories();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('couple_start_date', startDate);
  }, [startDate]);

  useEffect(() => {
    if (!db) localStorage.setItem('couple_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (!db) localStorage.setItem('couple_wishes_v1', JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    if (!db) localStorage.setItem('couple_memories_v1', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // D-Day 계산
  const dDayCount = useMemo(() => {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const startObj = new Date(sy, sm - 1, sd);
    const todayObj = new Date(ty, tm - 1, td);
    const diff = Math.round((todayObj - startObj) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `D+${diff + 1}` : `D${diff}`;
  }, [startDate, todayKey]);

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

  const openCreateEventModal = () => {
    setEditingEventId(null);
    setEventDateInput(selectedDate);
    setNewCategory('together');
    setNewTitle('');
    setNewTime('18:30');
    setNewLocation('');
    setShowEventModal(true);
  };

  const openEditEventModal = (ev) => {
    setEditingEventId(ev.id);
    setEventDateInput(ev.date || selectedDate);
    setNewCategory(ev.category || 'together');
    setNewTitle(ev.title || '');
    setNewTime(ev.time || '18:30');
    setNewLocation(ev.location || '');
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const isEditing = Boolean(editingEventId);
    const id = isEditing ? editingEventId : Date.now().toString();
    const payload = {
      id,
      date: eventDateInput || selectedDate,
      time: newTime,
      title: newTitle.trim(),
      category: newCategory,
      location: newLocation.trim(),
      author: currentUser,
      notifySameDay: true,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'events', id), payload, { merge: true });
        showToast(
          isEditing
            ? `[${SUBJECT_META[newCategory].label}] 일정이 수정되었습니다!`
            : `[${SUBJECT_META[newCategory].label}] 일정이 실시간 공유되었습니다!`
        );
      } catch (err) {
        console.error(err);
        showToast('저장 실패: Firestore 보안 규칙을 확인해주세요.');
        return;
      }
    } else {
      if (isEditing) {
        setEvents((prev) => prev.map((item) => (item.id === id ? payload : item)));
      } else {
        setEvents((prev) => [...prev, payload]);
      }
      showToast(isEditing ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
    }

    setSelectedDate(eventDateInput || selectedDate);
    setShowEventModal(false);
    setEditingEventId(null);
    setNewTitle('');
    setNewLocation('');
  };

  const handleDeleteEvent = async (id) => {
    if (db) {
      await deleteDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'events', id));
      showToast('일정이 삭제되었습니다.');
    } else {
      setEvents((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 위시리스트 사진 선택 및 압축 처리
  const handleWishImageSelect = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file);
      if (isEdit) {
        setEditWishImage(compressedDataUrl);
      } else {
        setNewWishImage(compressedDataUrl);
      }
      showToast('사진이 첨부되었습니다.');
    } catch (err) {
      console.error('이미지 처리 오류:', err);
      showToast('사진을 불러오지 못했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  // 위시리스트 등록 (주체, 제목, 장소/메모, 링크, 사진 포함)
  const handleAddWish = async (e) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;
    const id = Date.now().toString();
    const formattedLink = formatExternalUrl(newWishLink);
    const item = {
      id,
      title: newWishTitle.trim(),
      location: newWishLoc.trim(),
      link: formattedLink,
      imageUrl: newWishImage || '',
      author: newWishAuthor,
      createdAt: new Date().toISOString()
    };
    if (db) {
      try {
        await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'wishes', id), item);
        showToast(`[${SUBJECT_META[newWishAuthor]?.label || '또또'}] 위시리스트가 실시간 공유되었습니다!`);
      } catch (err) {
        console.error(err);
        showToast('위시 저장 실패: 사진 용량이나 규칙을 확인해주세요.');
        return;
      }
    } else {
      setWishes((prev) => [item, ...prev]);
      showToast(`[${SUBJECT_META[newWishAuthor]?.label || '또또'}] 위시리스트가 추가되었습니다.`);
    }
    setNewWishTitle('');
    setNewWishLoc('');
    setNewWishLink('');
    setNewWishImage('');
  };

  // 위시리스트 편집 모달 열기
  const openEditWishModal = (w) => {
    setEditingWishId(w.id);
    setEditWishTitle(w.title || '');
    setEditWishLoc(w.location || '');
    setEditWishLink(w.link || '');
    setEditWishImage(w.imageUrl || '');
    setEditWishAuthor(w.author === 'girlfriend' ? 'girlfriend' : 'boyfriend');
    setShowWishEditModal(true);
  };

  // 위시리스트 수정 저장
  const handleSaveWishEdit = async (e) => {
    e.preventDefault();
    if (!editWishTitle.trim() || !editingWishId) return;
    const formattedLink = formatExternalUrl(editWishLink);
    const updated = {
      id: editingWishId,
      title: editWishTitle.trim(),
      location: editWishLoc.trim(),
      link: formattedLink,
      imageUrl: editWishImage || '',
      author: editWishAuthor,
      updatedAt: new Date().toISOString()
    };
    if (db) {
      await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'wishes', editingWishId), updated, { merge: true });
    } else {
      setWishes((prev) => prev.map((w) => (w.id === editingWishId ? { ...w, ...updated } : w)));
    }
    setShowWishEditModal(false);
    setEditingWishId(null);
    showToast('위시리스트가 수정되었습니다.');
  };

  const handleDeleteWish = async (id) => {
    if (db) {
      await deleteDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'wishes', id));
    } else {
      setWishes((prev) => prev.filter((w) => w.id !== id));
    }
    showToast('위시리스트가 삭제되었습니다.');
  };

  // 개별 위시리스트 공유 (링크 포함)
  const handleShareWish = async (w) => {
    const authorLabel = w.author === 'girlfriend' ? '뚜뚜' : '또또';
    const mapUrl = w.location ? `https://map.naver.com/p/search/${encodeURIComponent(w.location)}` : '';
    const lines = [
      `💝 [우리둘 위시리스트 · ${authorLabel}]`,
      `• ${w.title}`,
      w.location ? `📍 장소/메모: ${w.location}` : null,
      w.link ? `🔗 참고 링크: ${w.link}` : null,
      !w.link && mapUrl ? `🗺️ 지도 보기: ${mapUrl}` : null
    ].filter(Boolean);
    const shareText = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `우리둘 위시리스트 · ${w.title}`,
          text: shareText,
          url: w.link || window.location.origin
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('위시리스트 내용이 복사되었습니다! 카톡이나 메시지에 붙여넣어 공유하세요.');
        return;
      } catch (err) {
        console.error(err);
      }
    }
    showToast('공유 기능을 실행할 수 없습니다.');
  };

  // 전체 위시리스트 목록 한 번에 공유
  const handleShareAllWishes = async () => {
    if (wishes.length === 0) {
      showToast('공유할 위시리스트가 없습니다.');
      return;
    }
    const itemLines = wishes.map((w, idx) => {
      const label = w.author === 'girlfriend' ? '뚜뚜' : '또또';
      const locText = w.location ? ` (${w.location})` : '';
      const linkText = w.link ? `\n   🔗 ${w.link}` : '';
      return `${idx + 1}. [${label}] ${w.title}${locText}${linkText}`;
    });
    const shareText = [
      `💝 [또또 ♥ 뚜뚜 우리둘 위시리스트 (${wishes.length}건)]`,
      ...itemLines,
      `\n📅 우리둘 캘린더: ${window.location.origin}`
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: '또또 ♥ 뚜뚜 위시리스트',
          text: shareText
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('전체 위시리스트가 복사되었습니다! 카톡에 붙여넣어 공유하세요.');
        return;
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateStartDate = async (val) => {
    setStartDate(val);
    localStorage.setItem('couple_start_date', val);
    if (db) {
      await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'settings', 'main'), { startDate: val }, { merge: true });
      showToast('처음 만난 날이 양쪽 기기에 동기화되었습니다.');
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemTitle.trim()) return;
    const id = Date.now().toString();
    const item = { id, date: selectedDate, title: newMemTitle.trim(), note: newMemNote.trim() };
    if (db) {
      await setDoc(doc(db, 'couples', COUPLE_ROOM_ID, 'memories', id), item);
    } else {
      setMemories((prev) => [item, ...prev]);
    }
    setNewMemTitle('');
    setNewMemNote('');
    showToast('추억 로그가 기록되었습니다.');
  };

  const triggerTestPush = async () => {
    const todayEvents = events.filter((ev) => ev.date === todayKey);
    const bodyText =
      todayEvents.length > 0
        ? `오늘 일정: ${todayEvents
            .map((e) => `[${SUBJECT_META[e.category]?.label || '함께'}] ${e.time} ${e.title}`)
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
      {toastMsg && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs font-medium text-zinc-100 shadow-xl backdrop-blur">
          {toastMsg}
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-1 text-[10.5px]">
                {syncConnected ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Cloud className="h-3 w-3" /> 또또 · 뚜뚜 실시간 동기화 중
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <CloudOff className="h-3 w-3" /> {isFirebaseConfigured ? '서버 연결 확인 중...' : '로컬 모드'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentUser((u) => (u === 'boyfriend' ? 'girlfriend' : 'boyfriend'))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                currentUser === 'boyfriend'
                  ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40'
                  : 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40'
              }`}
              title="내 기기 사용자 설정"
            >
              {currentUser === 'boyfriend' ? '또또' : '뚜뚜'}
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

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'calendar' && (
          <div className="space-y-2.5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-zinc-100">
                  {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
                </span>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`rounded-full px-2 py-0.5 font-semibold transition ${
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
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition ${
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
                    {SUBJECT_META[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-zinc-500">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                <div key={w} className={idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-sky-400' : ''}>
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateObj, idx) => {
                if (!dateObj) return <div key={`empty-${idx}`} className="min-h-[58px]" />;
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
                const maxVisible = holiday ? 1 : 2;
                const hiddenCount = dayEvents.length - maxVisible;

                return (
                  <button
                    key={dKey}
                    onClick={() => setSelectedDate(dKey)}
                    className={`flex min-h-[58px] flex-col items-stretch justify-start overflow-hidden rounded-xl border p-0.5 text-left transition ${
                      isSelected
                        ? 'border-rose-500 bg-zinc-900 ring-1 ring-rose-500'
                        : 'border-zinc-800/70 bg-zinc-900/50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-0.5 px-0.5">
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

                    <div className="mt-0.5 flex w-full flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, maxVisible).map((ev) => {
                        const meta = SUBJECT_META[ev.category] || SUBJECT_META.together;
                        return (
                          <div
                            key={ev.id}
                            title={`${meta.label}: ${ev.title}`}
                            className={`w-full truncate rounded-[3px] px-1 py-[1px] text-[9px] font-medium leading-tight ${meta.calendarBar}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <span className="pr-0.5 text-right text-[8px] font-medium leading-none text-zinc-400">
                          +{hiddenCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/95 p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100">{selectedDate}</span>
                  {selectedHoliday && (
                    <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-rose-300">
                      {selectedHoliday}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400">({selectedDayEvents.length}건)</span>
                </div>
                <button
                  onClick={openCreateEventModal}
                  className="flex items-center gap-1 rounded-xl bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  <Plus className="h-3.5 w-3.5" /> 일정 추가
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p className="py-3 text-center text-xs text-zinc-500">
                  등록된 일정이 없습니다. 우측 상단 [+ 일정 추가]를 눌러 등록해보세요!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayEvents.map((ev) => {
                    const meta = SUBJECT_META[ev.category] || SUBJECT_META.together;
                    return (
                      <div
                        key={ev.id}
                        className={`flex items-start justify-between rounded-xl border p-2.5 ${meta.card}`}
                      >
                        <div
                          onClick={() => openEditEventModal(ev)}
                          className="min-w-0 flex-1 cursor-pointer space-y-1 pr-2"
                        >
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
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-0.5 text-rose-300 underline"
                              >
                                <MapPin className="h-3 w-3" /> {ev.location}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEditEventModal(ev)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                            title="일정 수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-rose-400"
                            title="일정 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-100">우리둘 위시리스트</h2>
                <p className="text-[11px] text-zinc-400">
                  사진 · 링크 첨부 및 카톡 실시간 공유
                </p>
              </div>
              <button
                onClick={handleShareAllWishes}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/30"
                title="위시리스트 전체 공유"
              >
                <Share2 className="h-3.5 w-3.5" /> 전체 공유
              </button>
            </div>

            {/* 위시리스트 등록 폼: 주체 + 제목 + 장소 + 링크 + 사진 첨부 */}
            <form onSubmit={handleAddWish} className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400">작성 주체 선택</span>
                <div className="flex gap-1.5">
                  {(['boyfriend', 'girlfriend']).map((key) => {
                    const meta = SUBJECT_META[key];
                    const active = newWishAuthor === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setNewWishAuthor(key)}
                        className={`rounded-xl px-3 py-1 text-xs transition ${
                          active ? meta.badge : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
                value={newWishTitle}
                onChange={(e) => setNewWishTitle(e.target.value)}
                placeholder="가고 싶은 맛집, 여행지, 갖고 싶은 아이템"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />

              <input
                type="text"
                value={newWishLoc}
                onChange={(e) => setNewWishLoc(e.target.value)}
                placeholder="장소 또는 간단 메모 (선택 입력)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />

              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={newWishLink}
                  onChange={(e) => setNewWishLink(e.target.value)}
                  placeholder="참고 링크 붙여넣기 (인스타, 블로그, 네이버지도 등)"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {newWishImage && (
                <div className="relative inline-block overflow-hidden rounded-xl border border-zinc-700">
                  <img
                    src={newWishImage}
                    alt="첨부 미리보기"
                    className="h-24 w-auto max-w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setNewWishImage('')}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/75 p-1 text-zinc-200 hover:bg-rose-500 hover:text-white"
                    title="사진 제거"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800">
                  <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
                  <span>{newWishImage ? '사진 변경' : '사진 첨부'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleWishImageSelect(e, false)}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  위시리스트 등록
                </button>
              </div>
            </form>

            {/* 위시리스트 카드 목록 */}
            {wishes.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                아직 등록된 위시리스트가 없습니다. 사진이나 링크와 함께 위시를 남겨보세요!
              </p>
            ) : (
              <div className="space-y-2.5">
                {wishes.map((w) => {
                  const authorKey = w.author === 'girlfriend' ? 'girlfriend' : 'boyfriend';
                  const meta = SUBJECT_META[authorKey];
                  const validLink = formatExternalUrl(w.link);

                  return (
                    <div
                      key={w.id}
                      className={`space-y-2.5 rounded-2xl border p-3 ${meta.card}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => openEditWishModal(w)}
                          className="min-w-0 flex-1 cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] ${meta.badge}`}>
                              {meta.label}
                            </span>
                            <p className="break-words text-xs font-bold text-zinc-100">{w.title}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {w.location && (
                              <a
                                href={`https://map.naver.com/p/search/${encodeURIComponent(w.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] text-zinc-300 underline decoration-zinc-500 hover:text-rose-300"
                              >
                                <MapPin className="h-3 w-3 text-rose-400" /> {w.location}
                              </a>
                            )}

                            {validLink && (
                              <a
                                href={validLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/40 transition hover:bg-rose-500/30"
                              >
                                <ExternalLink className="h-3 w-3" /> 링크 열기
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => handleShareWish(w)}
                            className="flex items-center gap-1 rounded-xl bg-zinc-800/90 px-2 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-zinc-700"
                            title="이 위시 공유하기"
                          >
                            <Share2 className="h-3 w-3" /> 공유
                          </button>
                          <button
                            onClick={() => openEditWishModal(w)}
                            className="flex items-center gap-1 rounded-xl bg-zinc-800/90 px-2 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-zinc-700"
                            title="위시 수정"
                          >
                            <Pencil className="h-3 w-3" /> 수정
                          </button>
                          <button
                            onClick={() => handleDeleteWish(w.id)}
                            className="rounded-xl bg-zinc-800/90 p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-rose-400"
                            title="위시 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {w.imageUrl && (
                        <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/60">
                          <img
                            src={w.imageUrl}
                            alt={w.title}
                            onClick={() => setPreviewImage(w.imageUrl)}
                            className="max-h-48 w-full cursor-zoom-in object-cover transition hover:opacity-95"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 p-4 text-white shadow-lg shadow-rose-950/50">
              <p className="text-xs opacity-90">또또 ♥ 뚜뚜 함께한 시간</p>
              <p className="mt-1 text-2xl font-extrabold">{dDayCount}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span>처음 만난 날:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleUpdateStartDate(e.target.value)}
                  className="rounded bg-black/25 px-2 py-0.5 text-white"
                />
              </div>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
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

      {/* 캘린더 일정 추가 / 수정 모달 */}
      {showEventModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSaveEvent}
            className="w-full max-w-md space-y-3.5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                {editingEventId ? '등록된 일정 수정' : `${selectedDate} 새 일정 등록`}
              </h3>
              <button type="button" onClick={() => setShowEventModal(false)}>
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400">주체자</label>
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
                type="date"
                value={eventDateInput}
                onChange={(e) => setEventDateInput(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-rose-500 focus:outline-none"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="장소 (지도 연동 · 선택 입력)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
            >
              {editingEventId
                ? `[${SUBJECT_META[newCategory].label}] 일정 수정 저장`
                : `[${SUBJECT_META[newCategory].label}] 일정 등록하기`}
            </button>
          </form>
        </div>
      )}

      {/* 위시리스트 수정 모달 (사진 및 링크 수정 지원) */}
      {showWishEditModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSaveWishEdit}
            className="w-full max-w-md space-y-3.5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">위시리스트 수정</h3>
              <button type="button" onClick={() => setShowWishEditModal(false)}>
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400">작성 주체</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['boyfriend', 'girlfriend']).map((key) => {
                  const meta = SUBJECT_META[key];
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setEditWishAuthor(key)}
                      className={`rounded-xl py-2 text-xs transition ${
                        editWishAuthor === key ? meta.badge : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
              value={editWishTitle}
              onChange={(e) => setEditWishTitle(e.target.value)}
              placeholder="위시리스트 내용"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
            />

            <input
              type="text"
              value={editWishLoc}
              onChange={(e) => setEditWishLoc(e.target.value)}
              placeholder="장소 또는 메모 (선택 입력)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
            />

            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={editWishLink}
                onChange={(e) => setEditWishLink(e.target.value)}
                placeholder="참고 링크 (https://...)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {editWishImage && (
                <div className="relative inline-block overflow-hidden rounded-xl border border-zinc-700">
                  <img
                    src={editWishImage}
                    alt="수정 미리보기"
                    className="h-28 w-auto max-w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditWishImage('')}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/75 p-1 text-zinc-200 hover:bg-rose-500 hover:text-white"
                    title="사진 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800">
                  <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
                  <span>{editWishImage ? '다른 사진으로 변경' : '사진 첨부하기'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleWishImageSelect(e, true)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
            >
              수정 내용 저장하기
            </button>
          </form>
        </div>
      )}

      {/* 첨부 사진 원본 확대 모달 */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[85vh] max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-2.5 top-2.5 rounded-full bg-black/75 p-1.5 text-zinc-200 hover:bg-rose-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewImage}
              alt="확대 이미지"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}

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
