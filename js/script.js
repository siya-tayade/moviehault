// Configuration
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
let API_KEY = localStorage.getItem('tmdb_api_key') || '';

// State
let currentPage = 1;
let currentQuery = '';
let currentFilter = 'popular'; // popular, top_rated, upcoming
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let isDemoMode = false;

// DOM Elements
const elements = {
    grid: document.getElementById('movieGrid'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    prevBtn: document.getElementById('prevPage'),
    nextBtn: document.getElementById('nextPage'),
    currentParams: document.getElementById('currentPage'),
    modal: document.getElementById('movieModal'),
    modalBody: document.getElementById('modalBody'),
    closeModal: document.querySelector('.close-modal'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    sortSelect: document.getElementById('sortSelect'),
    genreSelect: document.getElementById('genreSelect'),
    themeToggle: document.getElementById('themeToggle'),
    navHome: document.getElementById('navHome'),
    navWatchlist: document.getElementById('navWatchlist'),
    watchlistCount: document.getElementById('watchlistCount'),
    sectionTitle: document.getElementById('sectionTitle'),
    gridToggle: document.getElementById('gridStats'),
    listToggle: document.getElementById('listStats'),
    apiModal: document.getElementById('apiModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveKeyBtn: document.getElementById('saveKeyBtn'),
    useDemoBtn: document.getElementById('useDemoBtn'),
    todoCheckboxes: document.querySelectorAll('.todo-list input')
};

// Demo Data (Fallback)
const DEMO_MOVIES = [
    { id: 1, title: 'Inception', release_date: '2010-07-15', vote_average: 8.8, poster_path: 'images/Inception.jfif', overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.', genre_ids: [28, 878] },
    { id: 2, title: 'Interstellar', release_date: '2014-11-05', vote_average: 8.6, poster_path: 'images/Interstellar.jfif', overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.', genre_ids: [18, 878] },
    { id: 3, title: 'The Dark Knight', release_date: '2008-07-14', vote_average: 9.0, poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.', genre_ids: [18, 28, 80] },
    { id: 4, title: 'Avengers: Endgame', release_date: '2019-04-24', vote_average: 8.3, poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', overview: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.', genre_ids: [12, 878, 28] },
    { id: 5, title: 'Spider-Man: Into the Spider-Verse', release_date: '2018-12-14', vote_average: 8.4, poster_path: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', overview: 'Miles Morales is juggling his life between being a high school student and being a spider-man. When Wilson "Kingpin" Fisk uses a super collider, others from across the Spider-Verse are transported to this dimension.', genre_ids: [28, 12, 16, 878] },
    { id: 6, title: 'The Matrix', release_date: '1999-03-30', vote_average: 8.7, poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.', genre_ids: [28, 878] },
    { id: 7, title: 'Pulp Fiction', release_date: '1994-10-14', vote_average: 8.5, poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.', genre_ids: [53, 80] },
    { id: 8, title: 'Fight Club', release_date: '1999-10-15', vote_average: 8.4, poster_path: 'images/fight Club.jfif', overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.', genre_ids: [18] }
];

// --- Initialization ---
function init() {
    updateWatchlistCount();
    loadTodos();
    
    // Check API Key
    if (!API_KEY) {
        elements.apiModal.style.display = 'flex';
    } else {
        fetchMovies();
        fetchGenres();
    }

    // Event Listeners
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
    elements.prevBtn.addEventListener('click', () => changePage(-1));
    elements.nextBtn.addEventListener('click', () => changePage(1));
    elements.closeModal.addEventListener('click', () => elements.modal.classList.remove('active'));
    window.addEventListener('click', (e) => e.target === elements.modal && elements.modal.classList.remove('active'));
    
    elements.filterBtns.forEach(btn => btn.addEventListener('click', handleFilterClick));
    elements.sortSelect.addEventListener('change', () => fetchMovies());
    elements.genreSelect.addEventListener('change', () => fetchMovies());
    
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.gridToggle.addEventListener('click', () => setView('grid'));
    elements.listToggle.addEventListener('click', () => setView('list'));
    
    elements.navHome.addEventListener('click', showHome);
    elements.navWatchlist.addEventListener('click', showWatchlist);
    
    elements.saveKeyBtn.addEventListener('click', saveApiKey);
    elements.useDemoBtn.addEventListener('click', enableDemoMode);
    
    elements.todoCheckboxes.forEach(box => {
        box.addEventListener('change', saveTodos);
    });
}

// --- API Logic ---
async function fetchMovies() {
    if (isDemoMode) {
        let results = [...DEMO_MOVIES];
        const sort = elements.sortSelect.value;
        const genre = parseInt(elements.genreSelect.value);
        
        // Filter by Genre
        if (genre) {
            results = results.filter(m => m.genre_ids.includes(genre));
        }
        
        // Filter by Search
        if (currentQuery) {
            results = results.filter(m => m.title.toLowerCase().includes(currentQuery.toLowerCase()));
        }

        // Sort
        if (sort === 'vote_average.desc') results.sort((a, b) => b.vote_average - a.vote_average);
        else if (sort === 'primary_release_date.desc') results.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        else if (sort === 'primary_release_date.asc') results.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        
        renderMovies(results);
        return;
    }

    showLoader();
    const sort = elements.sortSelect.value;
    const genre = elements.genreSelect.value;
    
    let url = '';
    if (currentQuery) {
        url = `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentQuery}&page=${currentPage}`;
    } else {
        url = `${API_BASE_URL}/movie/${currentFilter}?api_key=${API_KEY}&page=${currentPage}`;
        // Note: Sort and Genre filtering usually requires /discover/movie endpoint for more complex queries
        if (sort || genre) {
            url = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&page=${currentPage}&sort_by=${sort}`;
            if (genre) url += `&with_genres=${genre}`;
        }
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success === false) throw new Error(data.status_message);
        
        renderMovies(data.results);
        updatePagination(data.page, data.total_pages);
    } catch (error) {
        console.error(error);
        if (error.message.includes('Invalid API key')) {
            alert('Invalid API Key. Switching to Demo Mode.');
            localStorage.removeItem('tmdb_api_key');
            enableDemoMode();
        } else {
            elements.grid.innerHTML = `<div class="error-msg">Error loading movies: ${error.message}</div>`;
        }
    }
}

async function fetchGenres() {
    if (isDemoMode) {
        const demoGenres = [
            { id: 28, name: 'Action' },
            { id: 878, name: 'Science Fiction' },
            { id: 18, name: 'Drama' },
            { id: 12, name: 'Adventure' },
            { id: 16, name: 'Animation' },
            { id: 35, name: 'Comedy' },
            { id: 80, name: 'Crime' },
            { id: 53, name: 'Thriller' }
        ];
        elements.genreSelect.innerHTML = '<option value="">All Genres</option>' + 
            demoGenres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
        const data = await res.json();
        elements.genreSelect.innerHTML = '<option value="">All Genres</option>' + 
            data.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    } catch (e) { console.log('Genre fetch failed'); }
}

async function fetchMovieDetails(id) {
    if (isDemoMode) {
        const movie = DEMO_MOVIES.find(m => m.id === id);
        openModal(movie);
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=videos,credits`);
        const data = await res.json();
        openModal(data);
    } catch (error) {
        console.error(error);
    }
}

// --- UI Logic ---
function renderMovies(movies) {
    elements.grid.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        elements.grid.innerHTML = '<div class="no-results">No movies found.</div>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        let poster;
        if (movie.poster_path) {
            poster = movie.poster_path.startsWith('/') 
                ? IMAGE_BASE_URL + movie.poster_path 
                : movie.poster_path;
        } else {
            poster = 'https://via.placeholder.com/500x750?text=No+Image';
        }
        
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';

        card.innerHTML = `
            <div class="card-poster">
                <img src="${poster}" alt="${movie.title}" loading="lazy">
                <div class="card-rating"><i class="fas fa-star"></i> ${rating}</div>
            </div>
            <div class="card-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${year}</span>
                    <button class="watchlist-btn-mini ${isInWatchlist(movie.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}', '${movie.release_date}', ${movie.vote_average})">
                        <i class="fas ${isInWatchlist(movie.id) ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => fetchMovieDetails(movie.id));
        elements.grid.appendChild(card);
    });
}

function openModal(movie) {
    const backdrop = movie.backdrop_path ? BACKDROP_BASE_URL + movie.backdrop_path : '';
    let poster;
    if (movie.poster_path) {
        poster = movie.poster_path.startsWith('/') 
            ? IMAGE_BASE_URL + movie.poster_path 
            : movie.poster_path;
    } else {
        poster = 'https://via.placeholder.com/500x750?text=No+Image';
    }

    const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
    const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'Unknown';
    const trailer = movie.videos?.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    
    const inWatchlist = isInWatchlist(movie.id);

    elements.modalBody.innerHTML = `
        <div class="movie-detail-header" style="background-image: url('${backdrop}')"></div>
        <div class="movie-detail-content">
            <div class="poster-wrapper">
                <img src="${poster}" alt="${movie.title}">
            </div>
            <div class="detail-text">
                <h2>${movie.title} <span style="font-size: 1.5rem; color: var(--text-muted);">(${year})</span></h2>
                <p class="tagline">${movie.tagline || ''}</p>
                
                <div class="meta-tags">
                    <span class="meta-tag"><i class="fas fa-star" style="color: gold;"></i> ${movie.vote_average.toFixed(1)}</span>
                    <span class="meta-tag"><i class="fas fa-clock"></i> ${movie.runtime || '??'} min</span>
                    <span class="meta-tag">${genres}</span>
                </div>

                <div class="action-buttons">
                    <button class="primary-btn" onclick="toggleWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}', '${movie.release_date}', ${movie.vote_average}, true)">
                        <i class="fas ${inWatchlist ? 'fa-check' : 'fa-plus'}"></i> ${inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                    ${trailer ? `<button class="secondary-btn" onclick="window.open('https://www.youtube.com/watch?v=${trailer.key}', '_blank')"><i class="fab fa-youtube"></i> Watch Trailer</button>` : ''}
                </div>

                <h3>Overview</h3>
                <p class="overview">${movie.overview}</p>
            </div>
        </div>
    `;
    
    elements.modal.classList.add('active');
}

function showLoader() {
    elements.grid.innerHTML = '<div class="loader"></div>';
}

function updatePagination(current, total) {
    elements.currentParams.textContent = `Page ${current} of ${Math.min(total, 500)}`; // TMDB limit
    elements.prevBtn.disabled = current === 1;
    elements.nextBtn.disabled = current >= total;
}

// --- Interaction Handlers ---
function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        elements.sectionTitle.textContent = `Results for "${query}"`;
        fetchMovies();
    }
}

function handleFilterClick(e) {
    elements.filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.filter;
    currentQuery = '';
    elements.searchInput.value = '';
    currentPage = 1;
    
    const titles = { popular: 'Popular Movies', top_rated: 'Top Rated Movies', upcoming: 'Upcoming Movies' };
    elements.sectionTitle.textContent = titles[currentFilter];
    
    fetchMovies();
}

function changePage(delta) {
    currentPage += delta;
    fetchMovies();
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const icon = elements.themeToggle.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

function setView(view) {
    if (view === 'grid') {
        elements.grid.classList.remove('list-view');
        elements.gridToggle.classList.add('active');
        elements.listToggle.classList.remove('active');
    } else {
        elements.grid.classList.add('list-view');
        elements.listToggle.classList.add('active');
        elements.gridToggle.classList.remove('active');
    }
}

// --- Watchlist Logic ---
function isInWatchlist(id) {
    return watchlist.some(m => m.id === id);
}

function toggleWatchlist(id, title, poster_path, release_date, vote_average, refreshModal = false) {
    const index = watchlist.findIndex(m => m.id === id);
    
    if (index === -1) {
        watchlist.push({ id, title, poster_path, release_date, vote_average });
        showToast(`Added ${title} to Watchlist`);
    } else {
        watchlist.splice(index, 1);
        showToast(`Removed ${title} from Watchlist`);
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
    
    // Refresh UI if needed
    if (document.body.dataset.page === 'watchlist') {
        renderMovies(watchlist);
    } else {
        // Re-render current view to update icons without full reload if possible, 
        // or just find the button and toggle class
        const btn = document.querySelector(`button[onclick*="${id}"]`);
        if (btn && !refreshModal) {
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-plus');
            icon.classList.toggle('fa-check');
        }
    }
    
    if (refreshModal) {
        // Close and re-open or just update text (Simpler to just update text logic here if complex)
        // For now, let's just re-fetch details or manually update button
        const modalBtn = document.querySelector('.modal .primary-btn');
        if (modalBtn) {
            const inList = isInWatchlist(id);
            modalBtn.innerHTML = `<i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i> ${inList ? 'In Watchlist' : 'Add to Watchlist'}`;
        }
    }
}

function showWatchlist() {
    document.body.dataset.page = 'watchlist';
    elements.sectionTitle.textContent = 'My Watchlist';
    elements.navHome.classList.remove('active');
    elements.navWatchlist.classList.add('active');
    renderMovies(watchlist);
    elements.pagination.style.display = 'none';
}

function showHome() {
    document.body.dataset.page = 'home';
    elements.sectionTitle.textContent = 'Popular Movies';
    elements.navWatchlist.classList.remove('active');
    elements.navHome.classList.add('active');
    elements.pagination.style.display = 'flex';
    currentQuery = '';
    fetchMovies();
}

function updateWatchlistCount() {
    elements.watchlistCount.textContent = watchlist.length;
}

// --- API Key & Demo Logic ---
function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
        API_KEY = key;
        localStorage.setItem('tmdb_api_key', key);
        elements.apiModal.style.display = 'none';
        fetchMovies();
        fetchGenres();
    } else {
        alert('Please enter a valid key');
    }
}

function enableDemoMode() {
    isDemoMode = true;
    elements.apiModal.style.display = 'none';
    showToast('Demo Mode Activated');
    renderMovies(DEMO_MOVIES);
}

// --- Helpers ---
function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'var(--primary-color)';
    toast.style.color = 'white';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = 'var(--radius)';
    toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    toast.style.zIndex = '2000';
    toast.style.animation = 'slideUp 0.3s ease-out';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function loadTodos() {
    const saved = JSON.parse(localStorage.getItem('movieAppTodos')) || {};
    elements.todoCheckboxes.forEach(box => {
        if (saved[box.id]) box.checked = true;
    });
}

function saveTodos() {
    const state = {};
    elements.todoCheckboxes.forEach(box => {
        state[box.id] = box.checked;
    });
    localStorage.setItem('movieAppTodos', JSON.stringify(state));
}

// Start
document.addEventListener('DOMContentLoaded', init);
window.toggleWatchlist = toggleWatchlist; // Expose to global scope for inline onclick
