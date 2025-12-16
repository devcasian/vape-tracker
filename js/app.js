let userData = JSON.parse(localStorage.getItem('vapeData')) || {};
let currentFilter = 'all';

function saveData() { localStorage.setItem('vapeData', JSON.stringify(userData)); }
function getUserData(id) {
    if (!userData[id]) userData[id] = { fav: false, tried: false, rating: 0, comment: '' };
    return userData[id];
}

const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');

function render() {
    grid.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();

    let filtered = database.filter(item => {
        const data = getUserData(item.id);
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                              item.desc.toLowerCase().includes(searchTerm) || 
                              item.num.includes(searchTerm);
        
        if (!matchesSearch) return false;
        if (currentFilter === 'fav') return data.fav;
        if (currentFilter === 'tried') return data.tried;
        return true;
    });

    filtered.sort((a, b) => {
        const da = getUserData(a.id);
        const db = getUserData(b.id);
        
        if (da.fav !== db.fav) return db.fav ? 1 : -1;
        if (da.rating !== db.rating) return db.rating - da.rating;
        return 0;
    });

    filtered.forEach(item => {
        const data = getUserData(item.id);
        const hasNote = data.comment && data.comment.trim().length > 0;
        const card = document.createElement('div');
        card.className = 'card';
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star ${i <= data.rating ? 'filled' : ''}" onclick="rate('${item.id}', ${i}, event)">★</span>`;
        }

        card.innerHTML = `
            <div class="card-top">
                <span class="num-badge">№${item.num}</span>
                <button class="icon-btn fav-btn ${data.fav ? 'active' : ''}" onclick="toggleFav('${item.id}', this)">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
            </div>
            
            <div class="name">${item.name}</div>
            <div class="desc">${item.desc}</div>

            <div class="card-actions">
                <div class="stars">${starsHtml}</div>
                <div class="right-actions">
                    <button class="icon-btn action-icon tried-btn ${data.tried ? 'active' : ''}" onclick="toggleTried('${item.id}')" title="Пробовал">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </button>
                    <button class="icon-btn action-icon note-btn ${hasNote ? 'has-note' : ''}" onclick="toggleNote(this)" title="Заметка">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                </div>
            </div>

            <div class="note-area">
                <textarea rows="3" placeholder="Заметка..." oninput="saveComment('${item.id}', this.value)">${data.comment}</textarea>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.toggleFav = (id, btn) => {
    const data = getUserData(id);
    data.fav = !data.fav;
    saveData();
    render(); 
};

window.toggleTried = (id) => {
    const data = getUserData(id);
    data.tried = !data.tried;
    saveData();
    render();
};

window.toggleNote = (btn) => {
    const noteArea = btn.closest('.card').querySelector('.note-area');
    const isActive = noteArea.classList.toggle('visible');
    btn.classList.toggle('active', isActive);
    if(isActive) {
        setTimeout(() => noteArea.querySelector('textarea').focus(), 100);
    }
};

window.rate = (id, rating, e) => {
    e.stopPropagation();
    const data = getUserData(id);
    if (data.rating === rating) {
        data.rating = 0;
    } else {
        data.rating = rating;
        if (rating > 0) data.tried = true;
    }
    saveData();
    render();
};

window.saveComment = (id, text) => {
    const data = getUserData(id);
    data.comment = text;
    saveData();
    const card = document.activeElement.closest('.card');
    const noteBtn = card.querySelector('.note-btn');
    if(text.trim().length > 0) noteBtn.classList.add('has-note');
    else noteBtn.classList.remove('has-note');
};

window.setFilter = (filterType) => {
    currentFilter = filterType;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    render();
};

window.toggleSettings = () => {
    document.getElementById('dataControls').classList.toggle('visible');
};

window.showExport = () => {
    const area = document.getElementById('ioTextarea');
    const btn = document.getElementById('confirmImportBtn');
    
    area.value = btoa(JSON.stringify(userData));
    area.style.display = 'block';
    area.readOnly = true;
    area.select();
    btn.style.display = 'none';
    
    try {
        document.execCommand('copy');
        alert('Код скопирован в буфер обмена!');
    } catch (e) {
        alert('Скопируйте код из текстового поля вручную.');
    }
};

window.showImport = () => {
    const area = document.getElementById('ioTextarea');
    const btn = document.getElementById('confirmImportBtn');
    
    area.value = '';
    area.style.display = 'block';
    area.readOnly = false;
    area.placeholder = 'Вставьте код сюда...';
    area.focus();
    btn.style.display = 'block';
};

window.performImport = () => {
    const input = document.getElementById('ioTextarea').value.trim();
    if (!input) return;

    try {
        const decoded = atob(input);
        const parsed = JSON.parse(decoded);
        
        if (typeof parsed !== 'object') throw new Error('Invalid format');
        
        if (confirm('Внимание! Текущие данные будут полностью заменены. Продолжить?')) {
            userData = parsed;
            saveData();
            render();
            alert('Данные успешно загружены!');
            document.getElementById('ioTextarea').value = '';
            document.getElementById('dataControls').classList.remove('visible');
        }
    } catch (e) {
        alert('Ошибка: Неверный код. Проверьте правильность вставки.');
        console.error(e);
    }
};

searchInput.addEventListener('input', render);
render();

// --- SMART HEADER LOGIC ---
let lastScrollTop = 0;
const header = document.querySelector('.sticky-header');
const headerHeight = header.offsetHeight;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
        // Scroll Down
        header.classList.add('header-hidden');
    } else {
        // Scroll Up
        header.classList.remove('header-hidden');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
}, { passive: true });

// Register Service Worker for PWA
