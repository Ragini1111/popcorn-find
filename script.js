const API_KEY = "c4d672d0";
const resultsEl = document.getElementById('results');
const messageEl = document.getElementById('message');
const qEl = document.getElementById('q');
const genreEl = document.getElementById('genre');
const tabSearch = document.getElementById('tabSearch');
const tabFav = document.getElementById('tabFav');
const themeBtn = document.getElementById('themeBtn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

let favorites = JSON.parse(localStorage.getItem('favs')||'[]');
let currentMode = 'search';
let currentList = [];

function saveFavs(){
  localStorage.setItem('favs', JSON.stringify(favorites));
}

function render(list){
  currentList = list;
  resultsEl.innerHTML = '';
  if(!list.length){
    messageEl.textContent = currentMode==='fav' ? 'No favorites yet' : 'No movies found';
    return;
  }
  messageEl.textContent = '';
  list.forEach(m=>{
    const isFav = favorites.some(f=>f.imdbID===m.imdbID);
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openDetails(m.imdbID, m.Title);
    card.innerHTML = `
      <img class="poster" src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${m.Title}">
      <div class="card-body">
        <div class="title">${m.Title} (${m.Year})</div>
        <div class="meta">${m.Type}</div>
        <div class="actions">
          <button class="fav ${isFav?'fav':''}" onclick='event.stopPropagation();toggleFav(${JSON.stringify(m)})'>
            ${isFav?'★ Favorited':'☆ Favorite'}
          </button>
        </div>
      </div>
    `;
    resultsEl.appendChild(card);
  });
}

function toggleFav(movie){
  const idx = favorites.findIndex(f=>f.imdbID===movie.imdbID);
  if(idx>-1) favorites.splice(idx,1);
  else favorites.push(movie);
  saveFavs();
  render(currentMode==='fav' ? favorites : currentList);
}

async function openDetails(id, title){
  modal.style.display = 'flex';
  modalBody.innerHTML = '<div class="msg">Loading...</div>';
  const res = await fetch(`https://www.omdbapi.com/?apikey=c4d672d0&i=${id}&plot=full`);
  const m = await res.json();
  
  // Build YouTube search URL for the trailer
  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`;
  
  modalBody.innerHTML = `
    <img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/300x450?text=No+Image'}">
    <div class="modal-info">
      <h2>${m.Title} (${m.Year})</h2>
      <div class="meta">${m.Rated} • ${m.Runtime} • ${m.Genre}</div>
      <p><strong>IMDb:</strong> ${m.imdbRating}</p>
      <p>${m.Plot}</p>
      <p><strong>Cast:</strong> ${m.Actors}</p>
      <button onclick="window.open('${trailerUrl}','_blank')" style="padding:10px 14px;border-radius:10px;border:none;background:var(--accent);color:#000;font-weight:700;cursor:pointer">Watch Trailer</button>
    </div>
  `;
}

closeModal.onclick = () => modal.style.display = 'none';
modal.onclick = e => { if(e.target===modal) modal.style.display='none'; };

async function searchMovies(query){
  messageEl.textContent = 'Searching…';
  const genre = genreEl.value;
  try{
    const res = await fetch(`https://www.omdbapi.com/?apikey=c4d672d0&s=${encodeURIComponent(query)}`);
    const data = await res.json();
    let movies = data.Search || [];
    if(genre){
      movies = await Promise.all(movies.map(m=>fetch(`https://www.omdbapi.com/?apikey=c4d672d0&i=${m.imdbID}`).then(r=>r.json())));
      movies = movies.filter(m=>m.Genre && m.Genre.includes(genre));
    }
    render(movies);
  }catch(err){
    messageEl.textContent = 'Error fetching movies';
  }
}

document.getElementById('searchBtn').addEventListener('click',()=>{
  const query = qEl.value.trim();
  if(query){
    currentMode='search';
    tabSearch.classList.add('active');
    tabFav.classList.remove('active');
    searchMovies(query);
  }
});

qEl.addEventListener('keypress', e=>{
  if(e.key==='Enter') document.getElementById('searchBtn').click();
});

tabSearch.addEventListener('click',()=>{
  currentMode='search';
  tabSearch.classList.add('active');
  tabFav.classList.remove('active');
  render(currentList);
});

tabFav.addEventListener('click',()=>{
  currentMode='fav';
  tabFav.classList.add('active');
  tabSearch.classList.remove('active');
  render(favorites);
});

themeBtn.addEventListener('click',()=>{
  const cur = document.body.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  themeBtn.textContent = next === 'dark' ? '🌙' : '☀️';
});
