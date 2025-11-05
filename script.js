// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAk-0bfLE8m00HMHGR4HFctW58KRWi_Psw",
    authDomain: "xbibz-tools.firebaseapp.com",
    databaseURL: "https://xbibz-tools-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xbibz-tools",
    storageBucket: "xbibz-tools.firebasestorage.app",
    messagingSenderId: "728866559765",
    appId: "1:728866559765:web:c44d19112638a86a377b1c",
    measurementId: "G-LFGHF7JXBN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let currentSurah = null;
let currentAyah = null;
let surahs = [];
let userSettings = {
    arabicFontSize: 24,
    translationFontSize: 16,
    selectedQari: 1,
    theme: 'light'
};
let audioPlayer = null;
let isPlaying = false;
let userLocation = null;
let prayerTimes = null;
let kiblatDirection = null;

// API Base URL
const API_BASE = 'https://quranapi.pages.dev/api';

// DOM Elements
const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section'),
    themeToggle: document.getElementById('themeToggle'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Quran Section
    searchInput: document.getElementById('searchInput'),
    surahList: document.getElementById('surahList'),
    ayahViewer: document.getElementById('ayahViewer'),
    backBtn: document.getElementById('backBtn'),
    currentSurahName: document.getElementById('currentSurahName'),
    currentSurahInfo: document.getElementById('currentSurahInfo'),
    ayahContent: document.getElementById('ayahContent'),
    playBtn: document.getElementById('playBtn'),
    
    // Hafalan Section
    addHafalanBtn: document.getElementById('addHafalanBtn'),
    totalHafalan: document.getElementById('totalHafalan'),
    hafalanSelesai: document.getElementById('hafalanSelesai'),
    hafalanProses: document.getElementById('hafalanProses'),
    hafalanList: document.getElementById('hafalanList'),
    
    // Prayer Times Section
    currentLocation: document.getElementById('currentLocation'),
    prayerTimes: document.getElementById('prayerTimes'),
    nextPrayer: document.getElementById('nextPrayer'),
    
    // Kiblat Section
    compass: document.getElementById('compass'),
    compassNeedle: document.getElementById('compassNeedle'),
    kaabaDirection: document.getElementById('kaabaDirection'),
    kiblatDegree: document.getElementById('kiblatDegree'),
    distanceToMakkah: document.getElementById('distanceToMakkah'),
    
    // Modals
    settingsModal: document.getElementById('settingsModal'),
    addHafalanModal: document.getElementById('addHafalanModal'),
    tafsirModal: document.getElementById('tafsirModal'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Settings
    arabicFontSize: document.getElementById('arabicFontSize'),
    arabicFontSizeValue: document.getElementById('arabicFontSizeValue'),
    translationFontSize: document.getElementById('translationFontSize'),
    translationFontSizeValue: document.getElementById('translationFontSizeValue'),
    qariSelect: document.getElementById('qariSelect'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importDataInput: document.getElementById('importDataInput'),
    
    // Hafalan Form
    hafalanSurahSelect: document.getElementById('hafalanSurahSelect'),
    hafalanAyatMulai: document.getElementById('hafalanAyatMulai'),
    hafalanAyatSelesai: document.getElementById('hafalanAyatSelesai'),
    hafalanTarget: document.getElementById('hafalanTarget'),
    hafalanCatatan: document.getElementById('hafalanCatatan'),
    saveHafalanBtn: document.getElementById('saveHafalanBtn'),
    
    // Tafsir
    tafsirTitle: document.getElementById('tafsirTitle'),
    tafsirContent: document.getElementById('tafsirContent'),
    
    // Audio
    audioPlayer: document.getElementById('audioPlayer')
};

// Utility Functions
const showLoading = () => {
    elements.loadingOverlay.classList.add('active');
};

const hideLoading = () => {
    elements.loadingOverlay.classList.remove('active');
};

const showModal = (modalId) => {
    document.getElementById(modalId).classList.add('active');
};

const hideModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const calculateKiblatDirection = (lat, lon) => {
    const makkahLat = 21.4225;
    const makkahLon = 39.8262;
    
    const dLon = (makkahLon - lon) * Math.PI / 180;
    const lat1 = lat * Math.PI / 180;
    const lat2 = makkahLat * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    
    return bearing;
};

// API Functions
const fetchSurahs = async () => {
    try {
        const response = await fetch(`${API_BASE}/surah.json`);
        const data = await response.json();
        surahs = data;
        return data;
    } catch (error) {
        console.error('Error fetching surahs:', error);
        return [];
    }
};

const fetchSurah = async (surahNo) => {
    try {
        const response = await fetch(`${API_BASE}/${surahNo}.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching surah:', error);
        return null;
    }
};

const fetchAyah = async (surahNo, ayahNo) => {
    try {
        const response = await fetch(`${API_BASE}/${surahNo}/${ayahNo}.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ayah:', error);
        return null;
    }
};

const fetchTafsir = async (surahNo, ayahNo) => {
    try {
        const response = await fetch(`${API_BASE}/tafsir/${surahNo}_${ayahNo}.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tafsir:', error);
        return null;
    }
};

const fetchPrayerTimes = async (lat, lon) => {
    try {
        const date = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=2`);
        const data = await response.json();
        return data.data.timings;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
};

// Theme Functions
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    userSettings.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    userSettings.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
};

const updateThemeIcon = () => {
    const icon = elements.themeToggle.querySelector('i');
    if (userSettings.theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
};

// Navigation Functions
const initNavigation = () => {
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
};

const switchSection = (sectionName) => {
    // Update navigation
    elements.navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionName) {
            btn.classList.add('active');
        }
    });
    
    // Update sections
    elements.sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionName}-section`) {
            section.classList.add('active');
        }
    });
    
    // Load section-specific data
    switch (sectionName) {
        case 'quran':
            if (surahs.length === 0) {
                loadSurahs();
            }
            break;
        case 'hafalan':
            loadHafalan();
            break;
        case 'sholat':
            loadPrayerTimes();
            break;
        case 'kiblat':
            initKiblat();
            break;
    }
};

// Quran Functions
const loadSurahs = async () => {
    showLoading();
    try {
        const surahData = await fetchSurahs();
        renderSurahList(surahData);
        populateHafalanSurahSelect(surahData);
    } catch (error) {
        console.error('Error loading surahs:', error);
    } finally {
        hideLoading();
    }
};

const renderSurahList = (surahData) => {
    const html = surahData.map(surah => `
        <div class="surah-card" onclick="openSurah(${surah.surahNo || surahs.indexOf(surah) + 1})">
            <div class="surah-header">
                <div class="surah-number">${surah.surahNo || surahs.indexOf(surah) + 1}</div>
                <div class="surah-info">
                    <h3>${surah.surahName}</h3>
                    <p>${surah.surahNameTranslation}</p>
                </div>
            </div>
            <div class="surah-arabic">${surah.surahNameArabic}</div>
            <div class="surah-meta">
                <span class="revelation-place">${surah.revelationPlace}</span>
                <span>${surah.totalAyah} Ayat</span>
            </div>
        </div>
    `).join('');
    
    elements.surahList.innerHTML = html;
};

const openSurah = async (surahNo) => {
    showLoading();
    try {
        const surahData = await fetchSurah(surahNo);
        if (surahData) {
            currentSurah = surahData;
            renderSurahViewer(surahData);
            elements.surahList.style.display = 'none';
            elements.ayahViewer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error opening surah:', error);
    } finally {
        hideLoading();
    }
};

const renderSurahViewer = (surahData) => {
    // Update header
    elements.currentSurahName.textContent = `${surahData.surahName} (${surahData.surahNameArabic})`;
    elements.currentSurahInfo.textContent = `${surahData.surahNameTranslation} • ${surahData.revelationPlace} • ${surahData.totalAyah} Ayat`;
    
    // Render ayahs
    let ayahsHtml = '';
    
    if (Array.isArray(surahData.arabic1)) {
        // Full surah data
        ayahsHtml = surahData.arabic1.map((arabic, index) => {
            const ayahNo = index + 1;
            return `
                <div class="ayah-card" data-surah="${surahData.surahNo}" data-ayah="${ayahNo}">
                    <div class="ayah-number">${ayahNo}</div>
                    <div class="ayah-arabic" style="font-size: ${userSettings.arabicFontSize}px;">${arabic}</div>
                    <div class="ayah-translation" style="font-size: ${userSettings.translationFontSize}px;">
                        ${surahData.english ? surahData.english[index] : ''}
                    </div>
                    <div class="ayah-actions">
                        <button class="ayah-btn" onclick="playAyah(${surahData.surahNo}, ${ayahNo})">
                            <i class="fas fa-play"></i>
                            Putar
                        </button>
                        <button class="ayah-btn" onclick="showTafsir(${surahData.surahNo}, ${ayahNo})">
                            <i class="fas fa-book"></i>
                            Tafsir
                        </button>
                        <button class="ayah-btn" onclick="toggleBookmark(${surahData.surahNo}, ${ayahNo})" id="bookmark-${surahData.surahNo}-${ayahNo}">
                            <i class="fas fa-bookmark"></i>
                            Tandai
                        </button>
                        <button class="ayah-btn" onclick="toggleHighlight(${surahData.surahNo}, ${ayahNo})" id="highlight-${surahData.surahNo}-${ayahNo}">
                            <i class="fas fa-highlighter"></i>
                            Sorot
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    elements.ayahContent.innerHTML = ayahsHtml;
    
    // Load bookmarks and highlights
    loadBookmarksAndHighlights();
};

const closeSurahViewer = () => {
    elements.ayahViewer.style.display = 'none';
    elements.surahList.style.display = 'grid';
    currentSurah = null;
    
    // Stop audio if playing
    if (isPlaying) {
        stopAudio();
    }
};

const searchSurahs = (query) => {
    const filteredSurahs = surahs.filter(surah => 
        surah.surahName.toLowerCase().includes(query.toLowerCase()) ||
        surah.surahNameTranslation.toLowerCase().includes(query.toLowerCase()) ||
        surah.surahNameArabic.includes(query)
    );
    renderSurahList(filteredSurahs);
};

// Audio Functions
const playAyah = async (surahNo, ayahNo) => {
    try {
        if (isPlaying) {
            stopAudio();
        }
        
        const ayahData = await fetchAyah(surahNo, ayahNo);
        if (ayahData && ayahData.audio && ayahData.audio[userSettings.selectedQari]) {
            const audioUrl = ayahData.audio[userSettings.selectedQari].url;
            elements.audioPlayer.src = audioUrl;
            elements.audioPlayer.play();
            isPlaying = true;
            
            // Update play button
            elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            elements.playBtn.classList.add('playing');
            
            // Handle audio end
            elements.audioPlayer.onended = () => {
                stopAudio();
            };
        }
    } catch (error) {
        console.error('Error playing ayah:', error);
    }
};

const stopAudio = () => {
    elements.audioPlayer.pause();
    elements.audioPlayer.currentTime = 0;
    isPlaying = false;
    
    // Update play button
    elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.playBtn.classList.remove('playing');
};

// Bookmark and Highlight Functions
const toggleBookmark = (surahNo, ayahNo) => {
    const key = `bookmark-${surahNo}-${ayahNo}`;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    
    if (bookmarks[key]) {
        delete bookmarks[key];
    } else {
        bookmarks[key] = {
            surahNo,
            ayahNo,
            timestamp: Date.now()
        };
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarkButton(surahNo, ayahNo);
};

const toggleHighlight = (surahNo, ayahNo) => {
    const key = `highlight-${surahNo}-${ayahNo}`;
    const highlights = JSON.parse(localStorage.getItem('highlights') || '{}');
    
    if (highlights[key]) {
        delete highlights[key];
    } else {
        highlights[key] = {
            surahNo,
            ayahNo,
            timestamp: Date.now()
        };
    }
    
    localStorage.setItem('highlights', JSON.stringify(highlights));
    updateHighlightButton(surahNo, ayahNo);
};

const loadBookmarksAndHighlights = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    const highlights = JSON.parse(localStorage.getItem('highlights') || '{}');
    
    Object.keys(bookmarks).forEach(key => {
        const bookmark = bookmarks[key];
        updateBookmarkButton(bookmark.surahNo, bookmark.ayahNo);
    });
    
    Object.keys(highlights).forEach(key => {
        const highlight = highlights[key];
        updateHighlightButton(highlight.surahNo, highlight.ayahNo);
    });
};

const updateBookmarkButton = (surahNo, ayahNo) => {
    const btn = document.getElementById(`bookmark-${surahNo}-${ayahNo}`);
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    const key = `bookmark-${surahNo}-${ayahNo}`;
    
    if (btn) {
        if (bookmarks[key]) {
            btn.classList.add('bookmarked');
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Ditandai';
        } else {
            btn.classList.remove('bookmarked');
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Tandai';
        }
    }
};

const updateHighlightButton = (surahNo, ayahNo) => {
    const btn = document.getElementById(`highlight-${surahNo}-${ayahNo}`);
    const highlights = JSON.parse(localStorage.getItem('highlights') || '{}');
    const key = `highlight-${surahNo}-${ayahNo}`;
    
    if (btn) {
        if (highlights[key]) {
            btn.classList.add('highlighted');
            btn.innerHTML = '<i class="fas fa-highlighter"></i> Disorot';
        } else {
            btn.classList.remove('highlighted');
            btn.innerHTML = '<i class="fas fa-highlighter"></i> Sorot';
        }
    }
};

// Tafsir Functions
const showTafsir = async (surahNo, ayahNo) => {
    showLoading();
    try {
        const tafsirData = await fetchTafsir(surahNo, ayahNo);
        if (tafsirData) {
            renderTafsir(tafsirData);
            showModal('tafsirModal');
        }
    } catch (error) {
        console.error('Error loading tafsir:', error);
    } finally {
        hideLoading();
    }
};

const renderTafsir = (tafsirData) => {
    elements.tafsirTitle.textContent = `Tafsir ${tafsirData.surahName} Ayat ${tafsirData.ayahNo}`;
    
    const html = tafsirData.tafsirs.map(tafsir => `
        <div class="tafsir-section">
            <div class="tafsir-author">${tafsir.author}</div>
            ${tafsir.groupVerse ? `<p><em>${tafsir.groupVerse}</em></p>` : ''}
            <div class="tafsir-text">${tafsir.content}</div>
        </div>
    `).join('');
    
    elements.tafsirContent.innerHTML = html;
};

// Hafalan Functions
const loadHafalan = () => {
    const hafalanRef = database.ref('hafalan');
    hafalanRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        renderHafalanStats(data);
        renderHafalanList(data);
    });
};

const renderHafalanStats = (hafalanData) => {
    const hafalan = Object.values(hafalanData);
    const total = hafalan.length;
    const selesai = hafalan.filter(h => h.status === 'selesai').length;
    const proses = hafalan.filter(h => h.status === 'proses').length;
    
    elements.totalHafalan.textContent = total;
    elements.hafalanSelesai.textContent = selesai;
    elements.hafalanProses.textContent = proses;
};

const renderHafalanList = (hafalanData) => {
    const hafalan = Object.entries(hafalanData);
    
    if (hafalan.length === 0) {
        elements.hafalanList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Belum ada hafalan</h3>
                <p>Mulai tambahkan hafalan Al Qur'an Anda</p>
            </div>
        `;
        return;
    }
    
    const html = hafalan.map(([id, data]) => {
        const progress = calculateHafalanProgress(data);
        return `
            <div class="hafalan-card">
                <div class="hafalan-header-card">
                    <div class="hafalan-info">
                        <h3>${data.surahName} Ayat ${data.ayatMulai}-${data.ayatSelesai}</h3>
                        <p>Target: ${new Date(data.target).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div class="hafalan-status ${data.status}">
                        ${data.status === 'selesai' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-clock"></i>'}
                    </div>
                </div>
                <div class="hafalan-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
                ${data.catatan ? `<p class="hafalan-catatan">${data.catatan}</p>` : ''}
                <div class="hafalan-actions">
                    <button class="ayah-btn" onclick="updateHafalanProgress('${id}')">
                        <i class="fas fa-edit"></i>
                        Update Progress
                    </button>
                    <button class="ayah-btn" onclick="deleteHafalan('${id}')">
                        <i class="fas fa-trash"></i>
                        Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    elements.hafalanList.innerHTML = html;
};

const calculateHafalanProgress = (hafalan) => {
    if (hafalan.status === 'selesai') return 100;
    
    const totalAyat = hafalan.ayatSelesai - hafalan.ayatMulai + 1;
    const completedAyat = hafalan.completedAyat || 0;
    return Math.round((completedAyat / totalAyat) * 100);
};

const addHafalan = () => {
    const surahNo = elements.hafalanSurahSelect.value;
    const ayatMulai = parseInt(elements.hafalanAyatMulai.value);
    const ayatSelesai = parseInt(elements.hafalanAyatSelesai.value);
    const target = elements.hafalanTarget.value;
    const catatan = elements.hafalanCatatan.value;
    
    if (!surahNo || !ayatMulai || !ayatSelesai || !target) {
        alert('Mohon lengkapi semua field yang diperlukan');
        return;
    }
    
    if (ayatMulai > ayatSelesai) {
        alert('Ayat mulai tidak boleh lebih besar dari ayat selesai');
        return;
    }
    
    const surah = surahs.find(s => s.surahNo == surahNo || surahs.indexOf(s) + 1 == surahNo);
    if (!surah) {
        alert('Surah tidak ditemukan');
        return;
    }
    
    const hafalanData = {
        surahNo: parseInt(surahNo),
        surahName: surah.surahName,
        ayatMulai,
        ayatSelesai,
        target,
        catatan,
        status: 'proses',
        completedAyat: 0,
        createdAt: Date.now()
    };
    
    const hafalanRef = database.ref('hafalan').push();
    hafalanRef.set(hafalanData).then(() => {
        hideModal('addHafalanModal');
        resetHafalanForm();
    }).catch(error => {
        console.error('Error adding hafalan:', error);
        alert('Gagal menambahkan hafalan');
    });
};

const updateHafalanProgress = (hafalanId) => {
    const completedAyat = prompt('Berapa ayat yang sudah dihafal?');
    if (completedAyat !== null) {
        const hafalanRef = database.ref(`hafalan/${hafalanId}`);
        hafalanRef.once('value').then(snapshot => {
            const data = snapshot.val();
            const totalAyat = data.ayatSelesai - data.ayatMulai + 1;
            const completed = Math.min(parseInt(completedAyat) || 0, totalAyat);
            const status = completed === totalAyat ? 'selesai' : 'proses';
            
            hafalanRef.update({
                completedAyat: completed,
                status: status,
                updatedAt: Date.now()
            });
        });
    }
};

const deleteHafalan = (hafalanId) => {
    if (confirm('Apakah Anda yakin ingin menghapus hafalan ini?')) {
        database.ref(`hafalan/${hafalanId}`).remove();
    }
};

const resetHafalanForm = () => {
    elements.hafalanSurahSelect.value = '';
    elements.hafalanAyatMulai.value = '1';
    elements.hafalanAyatSelesai.value = '1';
    elements.hafalanTarget.value = '';
    elements.hafalanCatatan.value = '';
};

const populateHafalanSurahSelect = (surahData) => {
    const options = surahData.map((surah, index) => 
        `<option value="${surah.surahNo || index + 1}">${surah.surahName} (${surah.surahNameTranslation})</option>`
    ).join('');
    
    elements.hafalanSurahSelect.innerHTML = '<option value="">Pilih Surah</option>' + options;
};

// Prayer Times Functions
const loadPrayerTimes = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                
                await loadLocationName();
                await loadPrayerTimesData();
                startPrayerTimeCountdown();
            },
            (error) => {
                console.error('Error getting location:', error);
                elements.currentLocation.textContent = 'Lokasi tidak tersedia';
            }
        );
    } else {
        elements.currentLocation.textContent = 'Geolocation tidak didukung';
    }
};

const loadLocationName = async () => {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation.lat}&longitude=${userLocation.lon}&localityLanguage=id`);
        const data = await response.json();
        elements.currentLocation.textContent = `${data.city || data.locality}, ${data.countryName}`;
    } catch (error) {
        console.error('Error loading location name:', error);
        elements.currentLocation.textContent = `${userLocation.lat.toFixed(2)}, ${userLocation.lon.toFixed(2)}`;
    }
};

const loadPrayerTimesData = async () => {
    try {
        prayerTimes = await fetchPrayerTimes(userLocation.lat, userLocation.lon);
        renderPrayerTimes();
    } catch (error) {
        console.error('Error loading prayer times:', error);
    }
};

const renderPrayerTimes = () => {
    if (!prayerTimes) return;
    
    const prayers = [
        { name: 'Subuh', time: prayerTimes.Fajr },
        { name: 'Dzuhur', time: prayerTimes.Dhuhr },
        { name: 'Ashar', time: prayerTimes.Asr },
        { name: 'Maghrib', time: prayerTimes.Maghrib },
        { name: 'Isya', time: prayerTimes.Isha }
    ];
    
    const currentTime = new Date();
    const currentPrayer = getCurrentPrayer(prayers, currentTime);
    
    const html = prayers.map((prayer, index) => `
        <div class="prayer-card ${index === currentPrayer ? 'current' : ''}">
            <h3>${prayer.name}</h3>
            <div class="time">${formatTime(prayer.time)}</div>
        </div>
    `).join('');
    
    elements.prayerTimes.innerHTML = html;
};

const getCurrentPrayer = (prayers, currentTime) => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    for (let i = 0; i < prayers.length; i++) {
        const prayerTime = new Date(`2000-01-01T${prayers[i].time}`);
        const prayerMinutes = prayerTime.getHours() * 60 + prayerTime.getMinutes();
        
        if (currentMinutes < prayerMinutes) {
            return i;
        }
    }
    
    return 0; // Next day's Fajr
};

const startPrayerTimeCountdown = () => {
    setInterval(() => {
        updateNextPrayerCountdown();
    }, 1000);
};

const updateNextPrayerCountdown = () => {
    if (!prayerTimes) return;
    
    const prayers = [
        { name: 'Subuh', time: prayerTimes.Fajr },
        { name: 'Dzuhur', time: prayerTimes.Dhuhr },
        { name: 'Ashar', time: prayerTimes.Asr },
        { name: 'Maghrib', time: prayerTimes.Maghrib },
        { name: 'Isya', time: prayerTimes.Isha }
    ];
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayer = null;
    let nextPrayerMinutes = 0;
    
    for (let i = 0; i < prayers.length; i++) {
        const prayerTime = new Date(`2000-01-01T${prayers[i].time}`);
        const prayerMinutes = prayerTime.getHours() * 60 + prayerTime.getMinutes();
        
        if (currentMinutes < prayerMinutes) {
            nextPrayer = prayers[i];
            nextPrayerMinutes = prayerMinutes;
            break;
        }
    }
    
    if (!nextPrayer) {
        // Next day's Fajr
        nextPrayer = prayers[0];
        nextPrayerMinutes = 24 * 60 + new Date(`2000-01-01T${prayers[0].time}`).getHours() * 60 + new Date(`2000-01-01T${prayers[0].time}`).getMinutes();
    }
    
    const remainingMinutes = nextPrayerMinutes - currentMinutes;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    elements.nextPrayer.innerHTML = `
        <h2>Sholat Berikutnya: ${nextPrayer.name}</h2>
        <div class="countdown">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}</div>
        <p>pada ${formatTime(nextPrayer.time)}</p>
    `;
};

// Kiblat Functions
const initKiblat = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                
                calculateKiblatData();
                initCompass();
            },
            (error) => {
                console.error('Error getting location:', error);
                elements.kiblatDegree.textContent = 'Lokasi tidak tersedia';
            }
        );
    }
};

const calculateKiblatData = () => {
    if (!userLocation) return;
    
    const makkahLat = 21.4225;
    const makkahLon = 39.8262;
    
    kiblatDirection = calculateKiblatDirection(userLocation.lat, userLocation.lon);
    const distance = calculateDistance(userLocation.lat, userLocation.lon, makkahLat, makkahLon);
    
    elements.kiblatDegree.textContent = `${Math.round(kiblatDirection)}°`;
    elements.distanceToMakkah.textContent = `${Math.round(distance)} km`;
    
    // Update Kaaba direction indicator
    elements.kaabaDirection.style.transform = `rotate(${kiblatDirection}deg)`;
};

const initCompass = () => {
    if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
    } else {
        console.log('Device orientation not supported');
    }
};

const handleOrientation = (event) => {
    const alpha = event.alpha; // Compass heading
    if (alpha !== null) {
        elements.compassNeedle.style.transform = `translate(-50%, -50%) rotate(${alpha}deg)`;
        
        if (kiblatDirection !== null) {
            const kiblatRelative = (kiblatDirection - alpha + 360) % 360;
            elements.kaabaDirection.style.transform = `rotate(${kiblatRelative}deg)`;
        }
    }
};

// Settings Functions
const initSettings = () => {
    // Load saved settings
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
    }
    
    // Update UI
    elements.arabicFontSize.value = userSettings.arabicFontSize;
    elements.arabicFontSizeValue.textContent = `${userSettings.arabicFontSize}px`;
    elements.translationFontSize.value = userSettings.translationFontSize;
    elements.translationFontSizeValue.textContent = `${userSettings.translationFontSize}px`;
    elements.qariSelect.value = userSettings.selectedQari;
    
    // Event listeners
    elements.arabicFontSize.addEventListener('input', (e) => {
        userSettings.arabicFontSize = parseInt(e.target.value);
        elements.arabicFontSizeValue.textContent = `${userSettings.arabicFontSize}px`;
        updateArabicFontSize();
        saveSettings();
    });
    
    elements.translationFontSize.addEventListener('input', (e) => {
        userSettings.translationFontSize = parseInt(e.target.value);
        elements.translationFontSizeValue.textContent = `${userSettings.translationFontSize}px`;
        updateTranslationFontSize();
        saveSettings();
    });
    
    elements.qariSelect.addEventListener('change', (e) => {
        userSettings.selectedQari = parseInt(e.target.value);
        saveSettings();
    });
};

const updateArabicFontSize = () => {
    const arabicElements = document.querySelectorAll('.ayah-arabic');
    arabicElements.forEach(el => {
        el.style.fontSize = `${userSettings.arabicFontSize}px`;
    });
};

const updateTranslationFontSize = () => {
    const translationElements = document.querySelectorAll('.ayah-translation');
    translationElements.forEach(el => {
        el.style.fontSize = `${userSettings.translationFontSize}px`;
    });
};

const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
};

// Data Export/Import Functions
const exportData = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    const highlights = JSON.parse(localStorage.getItem('highlights') || '{}');
    
    database.ref('hafalan').once('value').then(snapshot => {
        const hafalan = snapshot.val() || {};
        
        const exportData = {
            bookmarks,
            highlights,
            hafalan,
            settings: userSettings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alquran-digital-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
};

const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Import bookmarks and highlights
            if (data.bookmarks) {
                localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
            }
            if (data.highlights) {
                localStorage.setItem('highlights', JSON.stringify(data.highlights));
            }
            
            // Import settings
            if (data.settings) {
                userSettings = { ...userSettings, ...data.settings };
                saveSettings();
                initSettings();
            }
            
            // Import hafalan
            if (data.hafalan) {
                const hafalanRef = database.ref('hafalan');
                hafalanRef.set(data.hafalan);
            }
            
            alert('Data berhasil diimpor!');
            location.reload();
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Gagal mengimpor data. File mungkin rusak.');
        }
    };
    reader.readAsText(file);
};

// Event Listeners
const initEventListeners = () => {
    // Navigation
    initNavigation();
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Settings
    elements.settingsBtn.addEventListener('click', () => showModal('settingsModal'));
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        searchSurahs(e.target.value);
    });
    
    // Back button
    elements.backBtn.addEventListener('click', closeSurahViewer);
    
    // Play button
    elements.playBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopAudio();
        } else if (currentSurah) {
            playAyah(currentSurah.surahNo, 1);
        }
    });
    
    // Hafalan
    elements.addHafalanBtn.addEventListener('click', () => showModal('addHafalanModal'));
    elements.saveHafalanBtn.addEventListener('click', addHafalan);
    
    // Data export/import
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataBtn.addEventListener('click', () => elements.importDataInput.click());
    elements.importDataInput.addEventListener('change', importData);
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.closest('.close-btn').dataset.modal;
            hideModal(modalId);
        });
    });
    
    // Modal backdrop close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
};

// Initialize App
const initApp = () => {
    initTheme();
    initSettings();
    initEventListeners();
    loadSurahs();
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

