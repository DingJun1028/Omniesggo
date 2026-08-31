import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

/* ========================================
   Constants
   ======================================== */

const SAFETY_CHECKLIST = [
  { id: 'gear', category: '裝備檢查', items: ['登山鞋/運動鞋', '雨具', '防曬用品', '個人藥品', '足夠飲水'] },
  { id: 'health', category: '健康評估', items: ['確認參與者無重大疾病', '準備急救包', '確認最近醫療站位置', '準備緊急連絡卡'] },
  { id: 'weather', category: '天氣確認', items: ['出發前確認天氣預報', '準備備案路線', '確認撤退點位置'] },
  { id: 'safety', category: '安全須知', items: ['行前安全簡報', '確認通訊設備', '指定安全官', '建立緊急連絡群組'] },
];

const PACKING_LIST = [
  { id: 'shoes', icon: '👟', label: '登山鞋/運動鞋' },
  { id: 'rain', icon: '☔', label: '雨具' },
  { id: 'sun', icon: '🧴', label: '防曬用品' },
  { id: 'medicine', icon: '💊', label: '個人藥品' },
  { id: 'water', icon: '💧', label: '足夠飲水' },
  { id: 'snack', icon: '🍫', label: '行動糧' },
  { id: 'bag', icon: '🎒', label: '背包' },
  { id: 'light', icon: '🔦', label: '手電筒/頭燈' },
  { id: 'firstaid', icon: '🩹', label: '急救包' },
  { id: 'phone', icon: '📱', label: '手機+行動電源' },
  { id: 'id', icon: '🪪', label: '身分證件' },
  { id: 'cash', icon: '💵', label: '現金' },
];

const ESG_TASKS = [
  { id: 'cleanup', title: 'Clean-up Walk', icon: '🗑️', unit: '件', color: 'green', fields: [
    { name: 'count', label: '垃圾數量', type: 'number', placeholder: '撿了幾件？' },
    { name: 'weight', label: '預估重量(kg)', type: 'number', placeholder: '有多重？' },
    { name: 'types', label: '垃圾類型', type: 'text', placeholder: '塑膠、玻璃...' },
  ]},
  { id: 'carbon', title: '碳足跡記錄', icon: '🌱', unit: 'kg', color: 'teal', fields: [
    { name: 'distance', label: '距離(km)', type: 'number', placeholder: '移動距離' },
    { name: 'mode', label: '交通方式', type: 'select', options: ['步行', '腳踏車', '公車/捷運', '火車', '汽車', '飛機'] },
    { name: 'passengers', label: '同行人數', type: 'number', placeholder: '共乘人數' },
  ]},
  { id: 'biodiversity', title: '生態觀察', icon: '🦋', unit: '種', color: 'purple', fields: [
    { name: 'species', label: '物種名稱', type: 'text', placeholder: '觀察到什麼？' },
    { name: 'count', label: '數量', type: 'number', placeholder: '幾隻/棵？' },
    { name: 'habitat', label: '棲息環境', type: 'select', options: ['森林', '水域', '草地', '濕地', '農田'] },
  ]},
  { id: 'local', title: '地方支持', icon: '🏪', unit: '元', color: 'orange', fields: [
    { name: 'business', label: '商家名稱', type: 'text', placeholder: '在哪裡消費？' },
    { name: 'amount', label: '消費金額', type: 'number', placeholder: '多少錢？' },
    { name: 'category', label: '消費類型', type: 'select', options: ['餐飲', '住宿', '伴手禮', '體驗活動', '其他'] },
  ]},
  { id: 'water', title: '水資源', icon: '💧', unit: 'L', color: 'blue', fields: [
    { name: 'amount', label: '用水量(L)', type: 'number', placeholder: '用了多少？' },
    { name: 'purpose', label: '用途', type: 'select', options: ['飲用', '清洗', '淋浴', '烹飪', '其他'] },
    { name: 'saved', label: '節約量(L)', type: 'number', placeholder: '節省多少？' },
  ]},
  { id: 'waste', title: '廢棄物減量', icon: '♻️', unit: '件', color: 'emerald', fields: [
    { name: 'items', label: '減少用品', type: 'text', placeholder: '自備了什麼？' },
    { name: 'count', label: '數量', type: 'number', placeholder: '幾件？' },
    { name: 'reusable', label: '替代方案', type: 'select', options: ['自備餐具', '自備水壺', '自備購物袋', '其他'] },
  ]},
];

const ESG_KNOWLEDGE = {
  before: [
    { id: 'esg_intro', icon: '🌍', title: '什麼是 ESG？', content: 'E（環境）、S（社會）、G（治理）是衡量企業永續發展的三個核心維度。', source: 'GRI Standards' },
    { id: 'sdgs', icon: '🎯', title: '聯合國 SDGs 17 目標', content: '2015 年聯合國公布 17 項永續發展目標，涵蓋消除貧窮、氣候行動等。', source: 'UN SDGs' },
    { id: 'carbon', icon: '🌡️', title: '碳足跡小知識', content: '每人每日平均碳足跡約 19 公斤 CO₂。搭乘捷運比開車減碳約 80%。', source: 'ISO 14064-1' },
    { id: 'lnt', icon: '🏔️', title: '無痕山林 LNT 七原則', content: '事前規劃、在可行走地表露營、適當處理垃圾、維持自然原貌等。', source: 'Leave No Trace' },
  ],
  during: [
    { id: 'cleanup_impact', icon: '🗑️', title: '撿拾垃圾的環境效益', content: '一件塑膠垃圾需 450 年才能分解。每撿拾一份，就減少一份進入海洋的機會。', source: 'Ocean Conservancy' },
    { id: 'biodiversity_value', icon: '🦋', title: '生態觀察的價值', content: '台灣有超過 5 萬種特有物種，記錄物種變化是氣候變遷的重要指標。', source: 'Taiwan Biodiversity' },
    { id: 'local_economy', icon: '🏪', title: '在地消費的乘數效應', content: '每 100 元在地消費，可產生 1.5 倍的在地經濟循環。', source: 'Local Economy Foundation' },
  ],
  after: [
    { id: 'gri', icon: '📊', title: 'GRI 報導準則', content: 'GRI 是全球最廣泛使用的永續報導準則，涵蓋環境、社會、經濟面指標。', source: 'GRI Standards 2021' },
    { id: 'impact_measure', icon: '📈', title: '影響力衡量', content: 'IRIS+ 是全球公認的影響力衡量框架，將社會、環境成果量化。', source: 'GIIN IRIS+' },
  ],
};

/* ========================================
   Helper Functions
   ======================================== */

const formatTime = (s) => {
  const mins = Math.floor(s / 60).toString().padStart(2, '0');
  const secs = (s % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatStopwatch = (ms) => {
  const mins = Math.floor(ms / 6000).toString().padStart(2, '0');
  const secs = Math.floor((ms % 6000) / 100).toString().padStart(2, '0');
  const cs = (ms % 100).toString().padStart(2, '0');
  return `${mins}:${secs}.${cs}`;
};

/* ========================================
   Main Component
   ======================================== */

export function JourneyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('ftg_token');

  // Core state
  const [journey, setJourney] = useState(null);
  const [prep, setPrep] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('safety');
  const [safetyChecked, setSafetyChecked] = useState({});
  const [checkinCount, setCheckinCount] = useState(0);
  const [checkinRate, setCheckinRate] = useState(0);

  // ESG state
  const [esgTasks, setEsgTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [taskForm, setTaskForm] = useState({});
  const [taskLog, setTaskLog] = useState([]);
  const [totalImpact, setTotalImpact] = useState({});
  const [userBadges, setUserBadges] = useState([]);
  const [badgeNotification, setBadgeNotification] = useState(null);

  // Tools state
  const [toolStage, setToolStage] = useState('before');
  const [packingChecked, setPackingChecked] = useState({});
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackMood, setFeedbackMood] = useState(null);

  // Location state
  const [myLocation, setMyLocation] = useState(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const locationRef = useRef(null);

  // Stories & Knowledge state
  const [stories, setStories] = useState([]);
  const [storyForm, setStoryForm] = useState({ title: '', content: '', spot_name: '', mood: '😊' });
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [activeKnowledge, setActiveKnowledge] = useState(null);

  // Suggestions & Lost Items
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionForm, setSuggestionForm] = useState({ type: '建議', title: '', content: '', is_anonymous: false });
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [lostItems, setLostItems] = useState([]);
  const [lostItemForm, setLostItemForm] = useState({ type: 'lost', item_name: '', location: '', description: '', contact: '' });
  const [showLostItemForm, setShowLostItemForm] = useState(false);

  // Todo, Calendar, Weather
  const [toolView, setToolView] = useState('calendar');
  const [weather, setWeather] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [todos, setTodos] = useState([]);
  const [todoForm, setTodoForm] = useState({ text: '', priority: 'normal', due_date: '' });
  const [showTodoForm, setShowTodoForm] = useState(false);

  // Alarms & Memos
  const [alarms, setAlarms] = useState([]);
  const [alarmForm, setAlarmForm] = useState({ time: '08:00', label: '起床', repeat: 'once' });
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [now, setNow] = useState(new Date());
  const clockRef = useRef(null);
  const [memos, setMemos] = useState([]);
  const [memoForm, setMemoForm] = useState({ title: '', content: '', pinned: false });
  const [showMemoForm, setShowMemoForm] = useState(false);

  // Team & Rooms
  const [teamMembers, setTeamMembers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [rooms, setRooms] = useState([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ number: '', leader: '', members: '', floor: '' });
  const [groups, setGroups] = useState([]);
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', leader: '', members: [], color: '#10243f' });

  // Mood & Travel Logs & Moments
  const [moods, setMoods] = useState([]);
  const [moodForm, setMoodForm] = useState({ mood: '😊', energy: 5, note: '' });
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [travelLogs, setTravelLogs] = useState([]);
  const [travelLogForm, setTravelLogForm] = useState({ title: '', content: '', weather: '', location: '' });
  const [showTravelLogForm, setShowTravelLogForm] = useState(false);
  const [moments, setMoments] = useState([]);
  const [momentForm, setMomentForm] = useState({ title: '', content: '', emotion: '😍' });
  const [showMomentForm, setShowMomentForm] = useState(false);

  // Bus Stops & Navigation
  const [busStops, setBusStops] = useState([]);
  const [showBusStopForm, setShowBusStopForm] = useState(false);
  const [busStopForm, setBusStopForm] = useState({ name: '', location: '', time: '', note: '' });
  const [navigating, setNavigating] = useState(false);
  const [destination, setDestination] = useState(null);

  // Utilities: Flashlight, Stopwatch, Timer, Recording
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchRef = useRef(null);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // QR Code
  const [qrCode, setQrCode] = useState('');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Flights, Hotels, Transport
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transports, setTransports] = useState([]);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [flightForm, setFlightForm] = useState({ airline: '', flight_no: '', departure: '', arrival: '', date: '', seat: '', carbon: '' });
  const [hotelForm, setHotelForm] = useState({ name: '', check_in: '', check_out: '', room: '', green_cert: '' });
  const [transportForm, setTransportForm] = useState({ type: '', company: '', route: '', date: '', carbon: '' });

  /* ========================================
     Data Fetching
     ======================================== */

  useEffect(() => {
    fetch(`${API_BASE}/api/journeys/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setJourney);
    fetch(`${API_BASE}/api/journeys/${id}/prep`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setPrep);
    fetch(`${API_BASE}/api/journeys/${id}/schedule`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setSchedule);
    fetch(`${API_BASE}/api/journeys/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setNotes);
    fetch(`${API_BASE}/api/journeys/${id}/checkins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setCheckins(data);
      setCheckinCount(data.length);
    });
    fetch(`${API_BASE}/api/journeys/${id}/summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setSummary(data);
      if (data?.stats) setCheckinRate(data.stats.checkin_rate);
    });
    fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setEsgTasks(data.tasks || []);
      setTaskLog(data.logs || []);
      setTotalImpact(data.totals || {});
    });
    fetch(`${API_BASE}/api/me/badges`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setUserBadges);
  }, [id, token]);

  /* ========================================
     Computed Values
     ======================================== */

  const completedSafety = Object.values(safetyChecked).filter(Boolean).length;
  const totalSafety = SAFETY_CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedPacking = Object.values(packingChecked).filter(Boolean).length;

  const getCountdown = () => {
    if (!journey?.start_date) return 0;
    const start = new Date(journey.start_date);
    const now = new Date();
    return Math.max(0, Math.ceil((start - now) / (1000 * 60 * 60 * 24)));
  };

  const activeAlarms = alarms.filter(a => a.active);

  /* ========================================
     Event Handlers
     ======================================== */

  const toggleSafety = (item) => setSafetyChecked(prev => ({ ...prev, [item]: !prev[item] }));
  const togglePacking = (id) => setPackingChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const showBadgeToast = (badges) => {
    if (badges?.length > 0) {
      setBadgeNotification(badges[0]);
      setTimeout(() => setBadgeNotification(null), 4000);
    }
  };

  const refreshAfterAction = async () => {
    const badges = await fetch(`${API_BASE}/api/me/badges`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    setUserBadges(badges);
  };

  // Checkin
  const handleCheckin = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const res = await fetch(`${API_BASE}/api/journeys/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(loc),
      });
      const data = await res.json();
      if (data.newBadges) showBadgeToast(data.newBadges);
      const updated = await fetch(`${API_BASE}/api/journeys/${id}/checkins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setCheckins(updated);
      setCheckinCount(updated.length);
      refreshAfterAction();
    });
  };

  // ESG Tasks
  const openTask = (task) => {
    setActiveTask(task);
    const initialForm = {};
    task.fields.forEach(f => { initialForm[f.name] = ''; });
    setTaskForm(initialForm);
  };

  const submitTask = async () => {
    if (!activeTask) return;
    const res = await fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ task_id: activeTask.id, data: taskForm }),
    });
    const data = await res.json();
    if (data.newBadges) showBadgeToast(data.newBadges);
    const updated = await fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    setEsgTasks(updated.tasks || []);
    setTaskLog(updated.logs || []);
    setTotalImpact(updated.totals || {});
    setActiveTask(null);
    setTaskForm({});
    refreshAfterAction();
  };

  // Location
  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    setLocationTracking(true);
    locationRef.current = navigator.geolocation.watchPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  };

  const stopLocationTracking = () => {
    if (locationRef.current) navigator.geolocation.clearWatch(locationRef.current);
    setLocationTracking(false);
  };

  // Stopwatch
  const toggleStopwatch = () => {
    if (stopwatchRunning) {
      clearInterval(stopwatchRef.current);
    } else {
      stopwatchRef.current = setInterval(() => setStopwatchMs(s => s + 10), 10);
    }
    setStopwatchRunning(!stopwatchRunning);
  };

  const resetStopwatch = () => {
    clearInterval(stopwatchRef.current);
    setStopwatchRunning(false);
    setStopwatchMs(0);
  };

  // Timer
  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    } else {
      if (timerSeconds === 0) setTimerSeconds(timerMinutes * 60);
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
      setTimerRunning(true);
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (e) { alert('無法存取麥克風'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: base64 }),
      }).then(r => r.json()).then(data => {
        if (data.url) setPhotos(prev => [...prev, { url: data.url, created_at: Date.now() }]);
      });
    };
    reader.readAsDataURL(file);
  };

  // ========================================
  // RENDER
  // ========================================

  if (!journey) return <div className="py-12 text-center">載入中...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button className="btn-outline" onClick={() => navigate('/')}>← 返回</button>
        <button className="btn-primary" onClick={() => navigate(`/journey/${id}/impact-note`)}>📊 Impact Note</button>
      </div>

      <div className="card mb-6">
        <h1 className="text-2xl font-extrabold text-primary">{journey.title}</h1>
        <p className="text-gray-500 mt-2">{journey.destination} · {journey.start_date} ~ {journey.end_date}</p>
      </div>

      {/* Badge Notification */}
      <AnimatePresence>
        {badgeNotification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-yellow-900 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="text-4xl">{badgeNotification.icon}</div>
            <div>
              <div className="text-sm font-bold">🎉 獲得勳章！</div>
              <div className="text-lg font-extrabold">{badgeNotification.name}</div>
              <div className="text-xs">{badgeNotification.description}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'safety', label: '⚠️ 安全' },
          { id: 'prep', label: '✅ 準備' },
          { id: 'esg', label: '🌱 ESG' },
          { id: 'schedule', label: '📅 行程' },
          { id: 'notes', label: '📝 筆記' },
          { id: 'checkin', label: '📍 簽到' },
          { id: 'summary', label: '📊 摘要' },
          { id: 'badges', label: '🏆 勳章' },
          { id: 'tools', label: '🔧 工具' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'safety' && (
        <div className="space-y-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">安全檢查進度</span>
              <span className="text-yellow-700 font-bold">{completedSafety}/{totalSafety}</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${totalSafety ? (completedSafety/totalSafety)*100 : 0}%` }} />
            </div>
          </div>
          {SAFETY_CHECKLIST.map(cat => (
            <div key={cat.id} className="card">
              <h3 className="font-bold text-primary mb-3">{cat.category}</h3>
              {cat.items.map(item => (
                <label key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={!!safetyChecked[item]} onChange={() => toggleSafety(item)} className="w-5 h-5 rounded" />
                  <span className={safetyChecked[item] ? 'line-through text-gray-400' : ''}>{item}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'prep' && (
        <div className="space-y-2">
          {prep.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <input type="checkbox" checked={!!p.done} readOnly className="w-5 h-5" />
              <span className={p.done ? 'line-through text-gray-400' : ''}>{p.text}</span>
              <span className="badge badge-info ml-auto">{p.category}</span>
            </div>
          ))}
          {prep.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增準備事項</p>}
        </div>
      )}

      {tab === 'esg' && (
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">ESG 任務影響力</span>
              <span className="text-green-700 font-bold">{taskLog.length} 筆記錄</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalImpact.cleanup || 0}</div>
                <div className="text-xs text-green-600">件垃圾</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{Math.round(totalImpact.carbon || 0)}</div>
                <div className="text-xs text-green-600">kg CO₂</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalImpact.biodiversity || 0}</div>
                <div className="text-xs text-green-600">種觀察</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ESG_TASKS.map(task => (
              <motion.div key={task.id} whileHover={{ scale: 1.02 }} className="card-hoverable" onClick={() => openTask(task)}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{task.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary">{task.title}</h4>
                  </div>
                  {totalImpact[task.id] && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">{totalImpact[task.id]}</div>
                      <div className="text-xs text-gray-400">{task.unit}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {taskLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-primary">任務紀錄</h4>
              {taskLog.map(log => (
                <div key={log.id} className="card">
                  <div className="flex items-center gap-2">
                    <span>{ESG_TASKS.find(t => t.id === log.task_id)?.icon}</span>
                    <span className="font-semibold">{ESG_TASKS.find(t => t.id === log.task_id)?.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(log.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ESG Task Modal */}
      <AnimatePresence>
        {activeTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveTask(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{activeTask.icon}</div>
                <h3 className="text-xl font-bold text-primary">{activeTask.title}</h3>
              </div>
              <div className="space-y-3">
                {activeTask.fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="w-full p-2 border border-gray-200 rounded-lg" value={taskForm[field.name] || ''}
                        onChange={e => setTaskForm(prev => ({ ...prev, [field.name]: e.target.value }))}>
                        <option value="">請選擇...</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} placeholder={field.placeholder} className="w-full p-2 border border-gray-200 rounded-lg"
                        value={taskForm[field.name] || ''} onChange={e => setTaskForm(prev => ({ ...prev, [field.name]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <button className="btn-primary flex-1" onClick={submitTask}>提交記錄</button>
                <button className="btn-outline" onClick={() => setActiveTask(null)}>取消</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === 'schedule' && (
        <div className="space-y-2">
          {schedule.map(s => (
            <div key={s.id} className="card">
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-gray-500">{s.date} {s.time} · {s.location}</div>
            </div>
          ))}
          {schedule.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增行程</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="card">
              <div className="text-xs text-gray-500">{n.date} · {n.mood}</div>
              <div className="mt-1">{n.text}</div>
            </div>
          ))}
          {notes.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增筆記</p>}
        </div>
      )}

      {tab === 'checkin' && (
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">現場簽到</span>
              <span className="text-green-700 font-bold">{checkinCount} 人</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${checkinRate}%` }} />
            </div>
            <p className="text-sm text-green-600 mt-2">簽到率 {checkinRate}%</p>
          </div>
          <button className="btn-primary w-full" onClick={handleCheckin}>📍 立即簽到</button>
          <div className="space-y-2">
            <h4 className="font-bold text-primary">簽到記錄</h4>
            {checkins.length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚無簽到紀錄</p>
            ) : (
              checkins.map(c => (
                <div key={c.id} className="card">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString('zh-TW')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          {summary ? (
            <>
              <div className="card bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">旅程摘要</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.member_count}</div>
                    <div className="text-xs text-blue-600">成員數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.checkin_count}</div>
                    <div className="text-xs text-blue-600">簽到數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.prep_rate}%</div>
                    <div className="text-xs text-blue-600">準備完成率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.note_count}</div>
                    <div className="text-xs text-blue-600">筆記數</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h4 className="font-bold text-primary mb-3">數據統計</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>行程數</span><span className="font-semibold">{summary.stats.schedule_count}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>準備完成率</span><span className="font-semibold">{summary.stats.prep_done}/{summary.stats.prep_total}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>簽到率</span><span className="font-semibold">{summary.stats.checkin_rate}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>影響力指標</span><span className="font-semibold">{summary.stats.impact_count}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center">
                摘要生成於 {new Date(summary.generated_at).toLocaleString('zh-TW')}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">載入中...</p>
          )}
        </div>
      )}

      {tab === 'badges' && (
        <div className="space-y-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">🏆 我的永續勳章</span>
              <span className="text-yellow-700 font-bold">{userBadges.length} 枚</span>
            </div>
            <p className="text-sm text-yellow-600 mt-2">每完成一項任務，即可獲得對應的永續標誌！</p>
          </div>
          {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userBadges.map(ub => (
                <motion.div key={ub.id} whileHover={{ scale: 1.05 }} className="card text-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="text-5xl mb-3">{ub.icon}</div>
                  <div className="font-bold text-primary">{ub.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{ub.description}</div>
                  <div className="text-xs text-yellow-600 mt-2">✦ {ub.requirement}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-500">尚未獲得任何勳章</p>
              <p className="text-sm text-gray-400 mt-2">完成 ESG 任務、簽到、寫筆記即可獲得勳章！</p>
            </div>
          )}
        </div>
      )}

      {/* TOOLS TAB — MECE 分類 */}
      {tab === 'tools' && (
        <div className="space-y-6">
          {/* Stage Selector */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {['before', 'during', 'after'].map(stage => (
              <button key={stage} className={toolStage === stage ? 'btn-primary' : 'btn-outline'} onClick={() => setToolStage(stage)}>
                {stage === 'before' ? '⬆️ 行前' : stage === 'during' ? '🚶 行中' : '⬇️ 行後'}
              </button>
            ))}
          </div>

          {/* BEFORE TRIP */}
          {toolStage === 'before' && (
            <div className="space-y-4">
              {/* Countdown */}
              <div className="card bg-blue-50 border border-blue-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-blue-800">⏰ 出發倒數</h4>
                  <span className="text-3xl font-extrabold text-blue-700">{getCountdown()} 天</span>
                </div>
              </div>

              {/* Packing List */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">🎒 裝備清單 ({completedPacking}/{PACKING_LIST.length})</h4>
                <div className="space-y-2">
                  {PACKING_LIST.map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={!!packingChecked[item.id]} onChange={() => togglePacking(item.id)} className="w-5 h-5 rounded" />
                      <span className={packingChecked[item.id] ? 'line-through text-gray-400' : ''}>{item.icon} {item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📞 緊急連絡卡</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-sm font-bold text-red-700 mb-1">緊急報案</div>
                    <div className="text-lg font-extrabold text-red-800">110 / 119</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-bold text-orange-700 mb-1">急救電話</div>
                    <div className="text-lg font-extrabold text-orange-800">119</div>
                  </div>
                </div>
              </div>

              {/* ESG Knowledge - Before */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📚 ESG 知識點 — 行前</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ESG_KNOWLEDGE.before.map(k => (
                    <div key={k.id} className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100" onClick={() => setActiveKnowledge(k)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{k.icon}</span>
                        <span className="font-semibold text-green-800">{k.title}</span>
                      </div>
                      <p className="text-xs text-green-600 line-clamp-2">{k.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DURING TRIP */}
          {toolStage === 'during' && (
            <div className="space-y-4">
              {/* Quick Note */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📝 快速筆記</h4>
                <textarea className="w-full p-3 border border-gray-200 rounded-lg" rows={3} placeholder="記錄當下..." value={quickNote} onChange={e => setQuickNote(e.target.value)} />
                <button className="btn-primary w-full mt-2" onClick={saveQuickNote}>儲存筆記</button>
              </div>

              {/* Photo + Album */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📸 拍照 + 相簿</h4>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="w-full" />
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {photos.map((p, i) => (
                      <img key={i} src={p.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>

              {/* Location Tracking */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📍 即時定位</h4>
                {!locationTracking ? (
                  <button className="btn-primary w-full" onClick={startLocationTracking}>開始定位追蹤</button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700">定位中</div>
                      {myLocation && <div className="text-xs text-green-600">{myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}</div>}
                    </div>
                    <button className="btn-outline w-full" onClick={stopLocationTracking}>停止追蹤</button>
                  </div>
                )}
              </div>

              {/* Utilities: Flashlight, Stopwatch, Timer, Recording */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">🔧 實用工具</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Flashlight */}
                  <div className={`p-4 rounded-lg text-center cursor-pointer ${flashlightOn ? 'bg-yellow-300' : 'bg-gray-100'}`} onClick={() => setFlashlightOn(!flashlightOn)}>
                    <div className="text-3xl mb-1">🔦</div>
                    <div className="text-sm font-semibold">{flashlightOn ? '開啟' : '關閉'}</div>
                  </div>
                  {/* Stopwatch */}
                  <div className="p-4 rounded-lg text-center bg-gray-100">
                    <div className="text-2xl font-mono font-bold text-primary">{formatStopwatch(stopwatchMs)}</div>
                    <div className="flex gap-1 mt-2">
                      <button className="btn-primary flex-1 text-xs" onClick={toggleStopwatch}>{stopwatchRunning ? '停' : '跑'}</button>
                      <button className="btn-outline text-xs" onClick={resetStopwatch}>重</button>
                    </div>
                  </div>
                  {/* Timer */}
                  <div className="p-4 rounded-lg text-center bg-gray-100">
                    <div className="text-2xl font-mono font-bold text-primary">{formatTime(timerSeconds)}</div>
                    <div className="flex gap-1 mt-2">
                      <button className="btn-primary flex-1 text-xs" onClick={toggleTimer}>{timerRunning ? '停' : '跑'}</button>
                      <button className="btn-outline text-xs" onClick={resetTimer}>重</button>
                    </div>
                    {!timerRunning && timerSeconds === 0 && (
                      <select className="w-full mt-2 p-1 border rounded text-xs" value={timerMinutes} onChange={e => setTimerMinutes(Number(e.target.value))}>
                        {[1, 3, 5, 10, 15, 30].map(m => <option key={m} value={m}>{m} 分鐘</option>)}
                      </select>
                    )}
                  </div>
                  {/* Recording */}
                  <div className="p-4 rounded-lg text-center bg-gray-100">
                    <div className="text-3xl mb-1">{recording ? '🔴' : '🎙️'}</div>
                    <button className={`w-full text-xs ${recording ? 'btn-danger' : 'btn-primary'}`} onClick={recording ? stopRecording : startRecording}>
                      {recording ? '停止' : '錄音'}
                    </button>
                    {audioURL && <audio controls src={audioURL} className="w-full mt-2" />}
                  </div>
                </div>
              </div>

              {/* ESG Knowledge - During */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📚 ESG 知識點 — 行中</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ESG_KNOWLEDGE.during.map(k => (
                    <div key={k.id} className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100" onClick={() => setActiveKnowledge(k)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{k.icon}</span>
                        <span className="font-semibold text-green-800">{k.title}</span>
                      </div>
                      <p className="text-xs text-green-600 line-clamp-2">{k.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AFTER TRIP */}
          {toolStage === 'after' && (
            <div className="space-y-4">
              {/* Feedback */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">💬 旅程回饋</h4>
                <div className="flex gap-2 mb-3">
                  {['😍', '😊', '😐', '😔'].map(mood => (
                    <button key={mood} className={`text-3xl p-2 rounded-lg ${feedbackMood === mood ? 'bg-yellow-200' : 'hover:bg-gray-100'}`}
                      onClick={() => setFeedbackMood(mood)}>{mood}</button>
                  ))}
                </div>
                <textarea className="w-full p-3 border border-gray-200 rounded-lg" rows={3} placeholder="分享你的旅程心得..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                <button className="btn-primary w-full mt-2" onClick={() => { setFeedback(''); setFeedbackMood(null); alert('感謝你的回饋！'); }}>送出回饋</button>
              </div>

              {/* ESG Knowledge - After */}
              <div className="card">
                <h4 className="font-bold text-primary mb-3">📚 ESG 知識點 — 行後</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ESG_KNOWLEDGE.after.map(k => (
                    <div key={k.id} className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100" onClick={() => setActiveKnowledge(k)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{k.icon}</span>
                        <span className="font-semibold text-green-800">{k.title}</span>
                      </div>
                      <p className="text-xs text-green-600 line-clamp-2">{k.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Modal */}
          <AnimatePresence>
            {activeKnowledge && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveKnowledge(null)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">{activeKnowledge.icon}</div>
                    <h3 className="text-xl font-bold text-primary">{activeKnowledge.title}</h3>
                  </div>
                  <p className="text-gray-700 mb-4">{activeKnowledge.content}</p>
                  <p className="text-xs text-gray-400">來源：{activeKnowledge.source}</p>
                  <button className="btn-primary w-full mt-4" onClick={() => setActiveKnowledge(null)}>關閉</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
