(() => {
  'use strict';

  const bridge = window.SongloftPlugin;
  const { apiGet, apiPost, apiPut, getAuthToken } = bridge;

  const icons = {
    library: '<path d="M4 6.5h5l1.7 2H20v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M8 13.5h8M8 16.5h5"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 18 6l2 6M18 15a7 7 0 0 1-11.9 3L4 12"/>',
    checkSquare: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.5 2.5L16 9"/>',
    playlistAdd: '<path d="M4 6h10M4 11h10M4 16h7M18 13v7M14.5 16.5h7"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    folderMusic: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/><path d="M14 10v4.5a1.5 1.5 0 1 1-1-1.4V11l3-.7v3.2a1.5 1.5 0 1 1-1-1.4V10.8l-1 .2Z"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    pause: '<path d="M9 7v10M15 7v10"/>',
    play: '<path d="m9 7 8 5-8 5V7Z"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    music: '<path d="M9 18V6l9-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="15.5" cy="15" r="2.5"/>',
    edit: '<path d="M13.5 6.5 17.5 10.5M4 20l1.2-4.8L15.5 4.9a1.4 1.4 0 0 1 2 0l1.6 1.6a1.4 1.4 0 0 1 0 2L8.8 18.8 4 20Z"/>',
    folder: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/>',
    playlist: '<path d="M4 6h11M4 11h11M4 16h7M18 9v8.5a2.5 2.5 0 1 1-2-2.45V10l4-1v6.5"/>',
    playlistRemove: '<path d="M4 6h11M4 11h11M4 16h7M15 18h7"/><path d="M18.5 9v6.5a2.5 2.5 0 1 1-2-2.45V10l4-1v4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/>',
    collapse: '<path d="M8 4v6H2M16 20v-6h6M3 9l5-5M21 15l-5 5"/>',
    columns: '<path d="M4 5h16v14H4zM10 5v14M15 5v14"/>',
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DEFAULT_COLUMNS = ['title', 'artist', 'album', 'format', 'duration'];
  const SONG_COLUMNS = [
    { key: 'title', label: '歌曲', locked: true },
    { key: 'artist', label: '艺术家' },
    { key: 'album', label: '专辑' },
    { key: 'format', label: '格式' },
    { key: 'duration', label: '时长', numeric: true },
    { key: 'year', label: '年份', numeric: true },
    { key: 'genre', label: '流派' },
    { key: 'bit_rate', label: '码率', numeric: true },
    { key: 'sample_rate', label: '采样率', numeric: true },
    { key: 'file_size', label: '文件大小', numeric: true },
    { key: 'type', label: '类型' },
    { key: 'added_at', label: '加入时间' },
    { key: 'file_modified_at', label: '文件修改时间' },
    { key: 'file_path', label: '文件路径' },
    { key: 'isrc', label: 'ISRC' },
  ];

  function loadVisibleColumns() {
    try {
      const saved = JSON.parse(localStorage.getItem('folder-browser-columns') || '[]');
      const valid = saved.filter((key) => SONG_COLUMNS.some((column) => column.key === key));
      if (valid.length) return [...new Set(['title', ...valid])];
    } catch (_) { /* 使用默认列 */ }
    return [...DEFAULT_COLUMNS];
  }

  const state = {
    rootPath: '', currentPath: '', breadcrumbs: [], folders: [], songs: [], allPlaylists: [],
    selected: new Set(), selectedFolders: new Set(), view: localStorage.getItem('folder-browser-view') || 'list',
    searchTimer: null, searchActive: false, editSong: null, pendingDelete: [],
    playlistSongIds: [], playlistMode: 'existing', selectedPlaylistId: null,
    treeInitialized: false, currentPlaylist: null, playlistBaseSongs: [],
    lastSelectedIndex: null, visibleColumns: loadVisibleColumns(),
    sortKey: localStorage.getItem('folder-browser-sort-key') || 'title',
    sortDirection: localStorage.getItem('folder-browser-sort-direction') === 'desc' ? 'desc' : 'asc',
  };

  function applyHostTheme(theme) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.classList.toggle('theme-dark', resolved === 'dark');
    root.classList.toggle('theme-light', resolved === 'light');
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#151515' : '#f8f7f4');
  }

  function syncThemeFromSongloft() {
    let theme = null;
    try {
      if (typeof bridge.getTheme === 'function') theme = bridge.getTheme();
    } catch (_) { /* 使用宿主写入的主题标记兜底 */ }
    theme ||= document.documentElement.dataset.theme;
    theme ||= localStorage.getItem('songloft-theme');
    theme ||= window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyHostTheme(theme);
  }

  function icon(name) {
    return `<span data-icon="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ''}</svg></span>`;
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((node) => {
      if (!node.querySelector('svg')) node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[node.dataset.icon] || ''}</svg>`;
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function encodeQuery(value) { return encodeURIComponent(value || ''); }
  function formatDuration(seconds) {
    if (!Number.isFinite(Number(seconds))) return '—';
    const total = Math.max(0, Math.floor(Number(seconds)));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
  function formatSize(bytes) {
    const value = Number(bytes);
    if (!value) return '大小未知';
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }
  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
  function filename(path) { return String(path || '').replace(/\\/g, '/').split('/').pop() || ''; }

  function assetUrl(url) {
    if (!url) return '';
    const token = getAuthToken();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${token ? `${separator}access_token=${encodeURIComponent(token)}` : ''}`;
  }

  async function request(action, message = '操作失败') {
    try { return await action(); }
    catch (error) {
      const detail = error?.message || String(error);
      toast(`${message}：${detail}`, 'error');
      throw error;
    }
  }

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `${icon(type === 'success' ? 'check' : 'alert')}<span>${escapeHtml(message)}</span>`;
    $('#toastRegion').append(node);
    setTimeout(() => node.remove(), 3200);
  }

  function setBusy(button, busy, label = '处理中…') {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = label;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
      hydrateIcons(button);
    }
  }

  async function loadPlaylists() {
    const data = await request(() => apiGet('/api/playlists'), '歌单载入失败');
    state.allPlaylists = data.playlists || [];
    const colors = ['var(--accent)', 'var(--md-tertiary, #7d5260)', 'var(--md-secondary, #625b71)', 'var(--md-primary, #6750a4)'];
    $('#playlistNav').innerHTML = state.allPlaylists.length ? state.allPlaylists.slice(0, 8).map((playlist, index) => `
      <button class="playlist-item ${state.currentPlaylist?.id === playlist.id ? 'active' : ''}" data-open-playlist="${playlist.id}" title="${escapeHtml(playlist.name)}"><span class="playlist-dot" style="--dot:${colors[index % colors.length]}"></span><span>${escapeHtml(playlist.name)}</span><span class="nav-count">${playlist.song_count || 0}</span></button>
    `).join('') : '<div class="nav-empty">还没有普通歌单</div>';
  }

  async function navigate(path, options = {}) {
    state.searchActive = false;
    state.currentPlaylist = null;
    state.playlistBaseSongs = [];
    state.lastSelectedIndex = null;
    state.selectedFolders.clear();
    $$('.playlist-item.active', $('#playlistNav')).forEach((item) => item.classList.remove('active'));
    $('#folderPlaylistButton').hidden = false;
    $('#searchInput').value = '';
    $('#loadingState').hidden = false;
    $('#songTableWrap').hidden = true;
    $('#emptyState').hidden = true;
    closeRowMenu();
    clearSelection();
    const suffix = `${path ? `?path=${encodeQuery(path)}` : '?'}${options.refresh ? `${path ? '&' : ''}refresh=1` : ''}`;
    try {
      const data = await request(() => apiGet(`/api/folders${suffix}`), '文件夹载入失败');
      state.rootPath = data.rootPath || '';
      state.currentPath = data.currentPath || state.rootPath;
      state.breadcrumbs = data.breadcrumbs || [];
      state.folders = data.folders || [];
      state.songs = data.songs || [];
      $('#libraryCount').textContent = data.totalSongs ?? 0;
      renderPage(data);
      if (!state.treeInitialized) renderTreeRoot(data);
      syncActiveTree();
    } finally {
      $('#loadingState').hidden = true;
      document.body.classList.remove('tree-open');
    }
  }

  function renderPage(data) {
    renderBreadcrumbs(data.breadcrumbs || []);
    const last = data.breadcrumbs?.[data.breadcrumbs.length - 1];
    $('#folderTitle').textContent = last?.name || '音乐文件夹';
    $('#folderMeta').textContent = `${state.folders.length} 个子文件夹 · ${state.songs.length} 首当前层歌曲`;
    $('#songCount').textContent = `${state.songs.length} 首`;
    $('#songsHeading').textContent = '当前文件夹歌曲';
    renderFolders();
    renderSongs();
  }

  function renderFolders() {
    const section = $('#foldersSection');
    const visible = !state.currentPlaylist && !state.searchActive && state.folders.length > 0;
    section.hidden = !visible;
    $('#folderCount').textContent = `${state.folders.length} 个`;
    $('#folderGrid').innerHTML = state.folders.map((folder) => `
      <article class="folder-card ${state.selectedFolders.has(folder.path) ? 'selected' : ''}" data-folder-card="${escapeHtml(folder.path)}">
        <label class="folder-check" title="选择 ${escapeHtml(folder.name)}"><input class="folder-checkbox" type="checkbox" data-folder-select="${escapeHtml(folder.path)}" ${state.selectedFolders.has(folder.path) ? 'checked' : ''}></label>
        <button class="folder-open" data-folder-path="${escapeHtml(folder.path)}">
          <span class="folder-icon">${icon(folder.path === '__unfiled__' ? 'music' : 'folder')}</span>
          <span class="folder-copy"><strong title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</strong><span>${folder.songCount || 0} 首歌曲</span></span>
          ${icon('chevron')}
        </button>
      </article>
    `).join('');
    updateFolderSelectionUI();
  }

  function updateFolderSelectionUI() {
    const count = state.selectedFolders.size;
    const button = $('#selectedFoldersPlaylist');
    button.disabled = !count;
    $('#selectedFoldersLabel').textContent = count ? `${count} 个文件夹加入歌单` : '加入歌单';
    $('#selectAllFolders').textContent = state.folders.length && state.folders.every((folder) => state.selectedFolders.has(folder.path)) ? '取消全选' : '全选文件夹';
    $$('.folder-checkbox').forEach((checkbox) => { checkbox.checked = state.selectedFolders.has(checkbox.dataset.folderSelect); });
    $$('[data-folder-card]').forEach((card) => card.classList.toggle('selected', state.selectedFolders.has(card.dataset.folderCard)));
  }

  async function addSelectedFoldersToPlaylist() {
    const paths = [...state.selectedFolders];
    if (!paths.length) return;
    const button = $('#selectedFoldersPlaylist');
    setBusy(button, true, '读取歌曲…');
    try {
      const data = await request(() => apiPost('/api/folders/songs', { paths }), '读取文件夹歌曲失败');
      if (!data.songs?.length) return toast('所选文件夹中没有歌曲', 'error');
      await openPlaylistModal(data.songs.map((song) => song.id));
    } finally { setBusy(button, false); }
  }

  function treeNode(folder, depth) {
    return `<div class="tree-node" data-tree-path="${escapeHtml(folder.path)}" data-loaded="0" style="--tree-depth:${depth}">
      <div class="tree-row">
        <button class="tree-toggle" data-tree-toggle aria-label="展开 ${escapeHtml(folder.name)}">${icon('chevron')}</button>
        <button class="tree-label" data-folder-path="${escapeHtml(folder.path)}">
          ${icon(folder.path === '__unfiled__' ? 'music' : 'folder')}<span class="tree-name">${escapeHtml(folder.name)}</span><span class="tree-count">${folder.songCount ?? ''}</span>
        </button>
      </div>
      <div class="tree-children"></div>
    </div>`;
  }

  function renderTreeRoot(data) {
    const rootName = data.breadcrumbs?.[0]?.name || '音乐库';
    $('#folderTree').innerHTML = `<div class="tree-node expanded" data-tree-path="${escapeHtml(data.rootPath)}" data-loaded="1" style="--tree-depth:0">
      <div class="tree-row">
        <button class="tree-toggle" data-tree-toggle aria-label="展开音乐库">${icon('chevron')}</button>
        <button class="tree-label" data-folder-path="${escapeHtml(data.rootPath)}">
          ${icon('library')}<span class="tree-name">${escapeHtml(rootName)}</span><span class="tree-count">${data.totalSongs ?? ''}</span>
        </button>
      </div>
      <div class="tree-children">${(data.folders || []).map((folder) => treeNode(folder, 1)).join('')}</div>
    </div>`;
    state.treeInitialized = true;
  }

  async function refreshFolderTree() {
    const rootData = await request(
      () => apiGet(`/api/folders?path=${encodeQuery(state.rootPath)}`),
      '目录树刷新失败',
    );
    renderTreeRoot(rootData);
    for (const item of state.breadcrumbs.slice(1)) {
      const node = $$('[data-tree-path]', $('#folderTree')).find((entry) => entry.dataset.treePath === item.path);
      if (!node) break;
      await toggleTreeNode(node, true);
    }
    syncActiveTree();
  }

  async function refreshCurrentView() {
    const button = $('#refreshButton');
    const playlistId = state.currentPlaylist?.id;
    const currentPath = state.currentPath;
    setBusy(button, true, '刷新中…');
    try {
      if (playlistId) {
        const rootData = await request(() => apiGet('/api/folders?refresh=1'), '音乐库刷新失败');
        state.rootPath = rootData.rootPath || state.rootPath;
        $('#libraryCount').textContent = rootData.totalSongs ?? 0;
        renderTreeRoot(rootData);
        await openPlaylist(playlistId);
      } else {
        await navigate(currentPath, { refresh: true });
        await refreshFolderTree();
        await loadPlaylists();
      }
      toast('歌曲列表和文件夹目录树已刷新');
    } finally {
      setBusy(button, false);
    }
  }

  async function toggleTreeNode(node, forceOpen = false) {
    if (!node) return;
    const shouldOpen = forceOpen || !node.classList.contains('expanded');
    if (!shouldOpen) { node.classList.remove('expanded'); return; }
    if (node.dataset.loaded !== '1') {
      const path = node.dataset.treePath || '';
      const children = $('.tree-children', node);
      children.innerHTML = '<div class="tree-loading"><span class="tree-spinner"></span>读取中…</div>';
      try {
        const data = await request(() => apiGet(`/api/folders?path=${encodeQuery(path)}`), '目录树载入失败');
        const depth = Number(node.style.getPropertyValue('--tree-depth') || 0) + 1;
        children.innerHTML = (data.folders || []).map((folder) => treeNode(folder, depth)).join('');
        node.dataset.loaded = '1';
        const toggle = $('[data-tree-toggle]', node);
        if (!data.folders?.length) toggle.classList.add('placeholder');
      } catch {
        children.innerHTML = '';
        return;
      }
    }
    node.classList.add('expanded');
  }

  function syncActiveTree() {
    $$('.tree-row', $('#folderTree')).forEach((row) => row.classList.remove('active'));
    if (state.currentPlaylist) return;
    const node = $$('[data-tree-path]', $('#folderTree')).find((item) => item.dataset.treePath === state.currentPath);
    if (node) $('.tree-row', node)?.classList.add('active');
  }

  async function openPlaylist(playlistId) {
    state.searchActive = false;
    $('#searchInput').value = '';
    $('#loadingState').hidden = false;
    $('#songTableWrap').hidden = true;
    $('#emptyState').hidden = true;
    closeRowMenu();
    clearSelection();
    try {
      const data = await request(() => apiGet(`/api/playlists/${playlistId}/songs`), '歌单载入失败');
      state.currentPlaylist = data.playlist;
      state.playlistBaseSongs = data.songs || [];
      state.songs = [...state.playlistBaseSongs];
      renderBreadcrumbs([{ name: '我的歌单', path: '' }, { name: data.playlist.name, path: '' }]);
      $('#folderTitle').textContent = data.playlist.name;
      $('#folderMeta').textContent = data.playlist.description || `共 ${state.songs.length} 首歌曲`;
      $('#songsHeading').textContent = '歌单歌曲';
      $('#songCount').textContent = `${state.songs.length} 首`;
      $('#folderPlaylistButton').hidden = true;
      $('#foldersSection').hidden = true;
      renderSongs();
      syncActiveTree();
      await loadPlaylists();
    } finally {
      $('#loadingState').hidden = true;
      document.body.classList.remove('tree-open');
    }
  }

  function renderBreadcrumbs(items) {
    $('#breadcrumbs').innerHTML = items.map((item, index) => `
      ${index ? '<span class="crumb-sep">/</span>' : ''}
      <button class="crumb" data-folder-path="${escapeHtml(item.path)}">${escapeHtml(item.name)}</button>
    `).join('');
  }

  function songCover(song, withPlay = true) {
    const cover = song.cover_url ? `<img src="${escapeHtml(assetUrl(song.cover_url))}" alt="" loading="lazy" onerror="this.remove()">` : icon('music');
    return `<span class="cover">${cover}${withPlay ? `<button class="cover-play" data-play-id="${song.id}" aria-label="播放 ${escapeHtml(song.title)}">${icon('play')}</button>` : ''}</span>`;
  }

  function sortSongs() {
    const column = SONG_COLUMNS.find((item) => item.key === state.sortKey) || SONG_COLUMNS[0];
    const direction = state.sortDirection === 'desc' ? -1 : 1;
    state.songs.sort((left, right) => {
      let a = left[column.key];
      let b = right[column.key];
      if (column.key === 'title') { a ||= filename(left.file_path); b ||= filename(right.file_path); }
      if (column.numeric) return ((Number(a) || 0) - (Number(b) || 0)) * direction;
      return String(a || '').localeCompare(String(b || ''), 'zh-CN', { numeric: true, sensitivity: 'base' }) * direction;
    });
  }

  function songColumnCell(song, key) {
    if (key === 'title') return `<td class="song-column primary-song-cell col-title"><div class="song-main">${songCover(song)}<div class="song-copy"><strong title="${escapeHtml(song.title)}">${escapeHtml(song.title || filename(song.file_path) || '未知歌曲')}</strong><span title="${escapeHtml(filename(song.file_path))}">${escapeHtml(filename(song.file_path) || song.type)}</span></div></div></td>`;
    if (key === 'format') return `<td class="song-column col-format"><span class="format-tag">${escapeHtml((song.format || song.type || '—').toUpperCase())}</span></td>`;
    if (key === 'duration') return `<td class="song-column col-duration duration-cell">${formatDuration(song.duration)}</td>`;
    if (key === 'file_size') return `<td class="song-column muted-cell col-file_size">${formatSize(song.file_size)}</td>`;
    if (key === 'bit_rate') return `<td class="song-column muted-cell col-bit_rate">${song.bit_rate ? `${Math.round(song.bit_rate >= 1000 ? song.bit_rate / 1000 : song.bit_rate)} kbps` : '—'}</td>`;
    if (key === 'sample_rate') return `<td class="song-column muted-cell col-sample_rate">${song.sample_rate ? `${(song.sample_rate / 1000).toFixed(song.sample_rate % 1000 ? 1 : 0)} kHz` : '—'}</td>`;
    if (key === 'added_at' || key === 'file_modified_at') return `<td class="song-column muted-cell col-${key}">${escapeHtml(formatDate(song[key]))}</td>`;
    if (key === 'type') {
      const labels = { local: '本地', remote: '远程', radio: '电台' };
      return `<td class="song-column muted-cell col-type">${labels[song.type] || escapeHtml(song.type || '—')}</td>`;
    }
    const value = key === 'year' ? (song.year || '—') : (song[key] || '—');
    return `<td class="song-column muted-cell col-${key}" title="${escapeHtml(value)}">${escapeHtml(value)}</td>`;
  }

  function renderColumnSettings() {
    $('#columnChoices').innerHTML = SONG_COLUMNS.map((column) => `
      <label class="column-choice ${column.locked ? 'locked' : ''}"><input class="column-toggle" type="checkbox" value="${column.key}" ${state.visibleColumns.includes(column.key) ? 'checked' : ''} ${column.locked ? 'disabled' : ''}><span>${column.label}</span></label>
    `).join('');
  }

  function renderSongs() {
    sortSongs();
    const wrap = $('#songTableWrap');
    $('#emptyState').hidden = !!state.songs.length;
    wrap.hidden = !state.songs.length;
    wrap.classList.toggle('grid-view', state.view === 'grid');
    wrap.style.setProperty('--column-count', String(state.visibleColumns.length));
    $$('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
    $('#songTableHead').innerHTML = `
      <th class="check-cell"><input id="masterCheckbox" type="checkbox" aria-label="选择全部歌曲"></th>
      ${state.visibleColumns.map((key) => {
        const column = SONG_COLUMNS.find((item) => item.key === key);
        const active = state.sortKey === key;
        return `<th class="song-column-head col-${key}"><button class="sort-button ${active ? 'active' : ''}" data-sort-key="${key}">${column.label}<span class="sort-indicator">${active ? (state.sortDirection === 'asc' ? '▲' : '▼') : ''}</span></button></th>`;
      }).join('')}
      <th class="actions-head"></th>`;
    $('#songTableBody').innerHTML = state.songs.map((song) => `
      <tr data-song-id="${song.id}" class="${state.selected.has(song.id) ? 'selected' : ''}">
        <td class="check-cell"><input class="song-checkbox" type="checkbox" data-song-id="${song.id}" ${state.selected.has(song.id) ? 'checked' : ''} aria-label="选择 ${escapeHtml(song.title)}"></td>
        ${state.visibleColumns.map((key) => songColumnCell(song, key)).join('')}
        <td class="row-menu actions-cell"><button class="icon-button row-menu-button" data-menu-id="${song.id}" aria-label="更多操作">${icon('more')}</button></td>
      </tr>
    `).join('');
    $('#songGrid').innerHTML = state.songs.map((song) => `
      <article class="song-card" data-song-id="${song.id}">
        <label class="song-card-check"><input class="song-checkbox" type="checkbox" data-song-id="${song.id}" ${state.selected.has(song.id) ? 'checked' : ''}></label>
        ${songCover(song)}<strong>${escapeHtml(song.title || filename(song.file_path))}</strong><span>${escapeHtml(song.artist || '未知艺术家')}</span>
      </article>
    `).join('');
    renderColumnSettings();
    updateSelectionUI();
    scheduleScrollRailUpdate();
  }

  function updateSelectionUI() {
    const count = state.selected.size;
    $('#selectedCount').textContent = count;
    $('#bulkBar').hidden = !count;
    $('#bulkRemovePlaylist').hidden = !count || !state.currentPlaylist;
    const allSelected = state.songs.length > 0 && state.songs.every((song) => state.selected.has(song.id));
    const masterCheckbox = $('#masterCheckbox');
    if (masterCheckbox) masterCheckbox.checked = allSelected;
    $$('.song-checkbox').forEach((checkbox) => { checkbox.checked = state.selected.has(Number(checkbox.dataset.songId)); });
    $$('[data-song-id]').forEach((row) => row.classList.toggle('selected', state.selected.has(Number(row.dataset.songId))));
  }

  function toggleSong(id, selected, selectRange = false) {
    const currentIndex = state.songs.findIndex((song) => song.id === id);
    if (selectRange && state.lastSelectedIndex !== null && currentIndex >= 0) {
      const start = Math.min(state.lastSelectedIndex, currentIndex);
      const end = Math.max(state.lastSelectedIndex, currentIndex);
      state.songs.slice(start, end + 1).forEach((song) => {
        if (selected) state.selected.add(song.id); else state.selected.delete(song.id);
      });
    } else if (selected) state.selected.add(id);
    else state.selected.delete(id);
    if (currentIndex >= 0) state.lastSelectedIndex = currentIndex;
    updateSelectionUI();
  }
  function clearSelection() { state.selected.clear(); state.lastSelectedIndex = null; updateSelectionUI(); }
  function selectedIds() { return [...state.selected]; }

  function isSongRowControl(target) {
    return !!target.closest('button, input, label, a, select, textarea, [data-action]');
  }

  function songSelectionTarget(target) {
    if (!(target instanceof Element) || isSongRowControl(target)) return null;
    return target.closest('[data-song-id]');
  }

  function setSongSelection(id, selected) {
    if (!Number.isInteger(id) || id <= 0) return;
    if (selected) state.selected.add(id); else state.selected.delete(id);
    const index = state.songs.findIndex((song) => song.id === id);
    if (index >= 0) state.lastSelectedIndex = index;
    updateSelectionUI();
  }

  let mouseSelectionDrag = null;
  let touchSelectionPending = null;
  let touchSelectionDrag = null;
  let suppressSongClickUntil = 0;

  function applySelectionDrag(drag, target) {
    const row = songSelectionTarget(target);
    const id = Number(row?.dataset.songId);
    if (!row || !Number.isInteger(id) || drag.visited.has(id)) return;
    drag.visited.add(id);
    setSongSelection(id, drag.selected);
  }

  function autoScrollSongSelection(clientY) {
    const pane = $('.content-pane');
    const rect = pane.getBoundingClientRect();
    const edge = Math.min(72, rect.height * 0.16);
    let delta = 0;
    if (clientY < rect.top + edge) delta = -Math.min(24, Math.ceil((rect.top + edge - clientY) / 3));
    else if (clientY > rect.bottom - edge) delta = Math.min(24, Math.ceil((clientY - rect.bottom + edge) / 3));
    if (!delta) return;
    pane.scrollTop += delta;
    scheduleScrollRailUpdate();
  }

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || Date.now() < suppressSongClickUntil) return;
    const row = songSelectionTarget(event.target);
    if (!row) return;
    const id = Number(row.dataset.songId);
    if (!Number.isInteger(id)) return;
    event.preventDefault();
    const selected = !state.selected.has(id);
    mouseSelectionDrag = { selected, visited: new Set(), startX: event.clientX, startY: event.clientY };
    if (event.shiftKey) {
      toggleSong(id, selected, true);
      mouseSelectionDrag.visited.add(id);
    } else {
      applySelectionDrag(mouseSelectionDrag, row);
    }
    document.body.classList.add('song-selection-dragging');
  });

  document.addEventListener('mousemove', (event) => {
    if (!mouseSelectionDrag || !(event.buttons & 1)) return;
    event.preventDefault();
    autoScrollSongSelection(event.clientY);
    applySelectionDrag(mouseSelectionDrag, document.elementFromPoint(event.clientX, event.clientY));
  });

  document.addEventListener('mouseup', () => {
    if (!mouseSelectionDrag) return;
    mouseSelectionDrag = null;
    suppressSongClickUntil = Date.now() + 350;
    document.body.classList.remove('song-selection-dragging');
  });

  document.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) return;
    const row = songSelectionTarget(event.target);
    if (!row) return;
    const touch = event.touches[0];
    const id = Number(row.dataset.songId);
    const pending = {
      id,
      row,
      startX: touch.clientX,
      startY: touch.clientY,
      timer: null,
    };
    pending.timer = setTimeout(() => {
      if (touchSelectionPending !== pending) return;
      touchSelectionDrag = { selected: !state.selected.has(id), visited: new Set() };
      applySelectionDrag(touchSelectionDrag, row);
      touchSelectionPending = null;
      document.body.classList.add('song-selection-dragging');
      navigator.vibrate?.(18);
    }, 360);
    touchSelectionPending = pending;
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    if (touchSelectionDrag) {
      event.preventDefault();
      autoScrollSongSelection(touch.clientY);
      applySelectionDrag(touchSelectionDrag, document.elementFromPoint(touch.clientX, touch.clientY));
      return;
    }
    if (!touchSelectionPending) return;
    if (Math.hypot(touch.clientX - touchSelectionPending.startX, touch.clientY - touchSelectionPending.startY) > 9) {
      clearTimeout(touchSelectionPending.timer);
      touchSelectionPending = null;
    }
  }, { passive: false });

  document.addEventListener('touchend', (event) => {
    if (touchSelectionPending) {
      clearTimeout(touchSelectionPending.timer);
      touchSelectionPending = null;
    }
    if (!touchSelectionDrag) return;
    event.preventDefault();
    touchSelectionDrag = null;
    suppressSongClickUntil = Date.now() + 500;
    document.body.classList.remove('song-selection-dragging');
  }, { passive: false });

  document.addEventListener('touchcancel', () => {
    if (touchSelectionPending) clearTimeout(touchSelectionPending.timer);
    touchSelectionPending = null;
    touchSelectionDrag = null;
    document.body.classList.remove('song-selection-dragging');
  });

  let scrollRailFrame = 0;
  let scrollThumbDrag = null;

  function updateScrollRail() {
    scrollRailFrame = 0;
    const pane = $('.content-pane');
    const rail = $('#mobileScrollRail');
    const thumb = $('#mobileScrollThumb');
    if (!pane || !rail || !thumb) return;
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
    rail.classList.toggle('visible', mobile && maxScroll > 8);
    if (!mobile || maxScroll <= 8) return;
    const trackHeight = rail.clientHeight;
    const thumbHeight = Math.max(52, Math.round(trackHeight * pane.clientHeight / pane.scrollHeight));
    const travel = Math.max(0, trackHeight - thumbHeight);
    const top = maxScroll ? Math.round((pane.scrollTop / maxScroll) * travel) : 0;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${top}px)`;
  }

  function scheduleScrollRailUpdate() {
    if (scrollRailFrame) cancelAnimationFrame(scrollRailFrame);
    scrollRailFrame = requestAnimationFrame(updateScrollRail);
  }

  function scrollPaneFromRail(clientY, grabOffset) {
    const pane = $('.content-pane');
    const rail = $('#mobileScrollRail');
    const thumb = $('#mobileScrollThumb');
    const rect = rail.getBoundingClientRect();
    const thumbHeight = thumb.offsetHeight;
    const travel = Math.max(1, rect.height - thumbHeight);
    const top = Math.max(0, Math.min(travel, clientY - rect.top - grabOffset));
    const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
    pane.scrollTop = (top / travel) * maxScroll;
  }

  async function search(keyword) {
    const query = keyword.trim();
    if (state.currentPlaylist) {
      state.songs = query ? state.playlistBaseSongs.filter((song) => [song.title, song.artist, song.album]
        .some((value) => (value || '').toLocaleLowerCase().includes(query.toLocaleLowerCase()))) : [...state.playlistBaseSongs];
      $('#folderTitle').textContent = query ? `“${query}”的搜索结果` : state.currentPlaylist.name;
      $('#folderMeta').textContent = query ? `在歌单“${state.currentPlaylist.name}”中找到 ${state.songs.length} 首歌曲` : (state.currentPlaylist.description || `共 ${state.songs.length} 首歌曲`);
      $('#songsHeading').textContent = query ? '搜索结果' : '歌单歌曲';
      $('#songCount').textContent = `${state.songs.length} 首`;
      clearSelection();
      renderSongs();
      return;
    }
    if (!query) { await navigate(state.currentPath); return; }
    state.searchActive = true;
    state.selectedFolders.clear();
    $('#foldersSection').hidden = true;
    $('#loadingState').hidden = false;
    $('#songTableWrap').hidden = true;
    $('#emptyState').hidden = true;
    clearSelection();
    try {
      const data = await request(() => apiGet(`/api/search?q=${encodeQuery(query)}&path=${encodeQuery(state.currentPath)}`), '搜索失败');
      state.songs = data.songs || [];
      $('#folderTitle').textContent = `“${query}”的搜索结果`;
      $('#folderMeta').textContent = `在当前文件夹及全部子文件夹中找到 ${state.songs.length} 首歌曲${data.truncated ? '（仅显示前 500 首）' : ''}`;
      $('#songsHeading').textContent = '搜索结果';
      $('#songCount').textContent = `${state.songs.length} 首`;
      renderSongs();
    } finally { $('#loadingState').hidden = true; }
  }

  function openRowMenu(id, button) {
    closeRowMenu();
    const song = state.songs.find((item) => item.id === id);
    if (!song) return;
    const rect = button.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'row-menu-pop';
    menu.dataset.openMenu = String(id);
    menu.innerHTML = `
      <button data-action="play" data-id="${id}">${icon('play')}播放</button>
      <button data-action="playlist" data-id="${id}">${icon('playlistAdd')}加入歌单</button>
      <button data-action="edit" data-id="${id}">${icon('edit')}编辑信息</button>
      ${state.currentPlaylist ? `<button data-action="remove-playlist" data-id="${id}">${icon('playlistRemove')}从当前歌单移除</button>` : ''}
      <button class="danger" data-action="delete" data-id="${id}">${icon('trash')}从音乐库移除</button>`;
    menu.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - (state.currentPlaylist ? 216 : 178))}px`;
    menu.style.left = `${Math.min(rect.right - 150, window.innerWidth - 160)}px`;
    document.body.append(menu);
  }
  function closeRowMenu() { $('.row-menu-pop')?.remove(); }

  function playSong(id) {
    const song = state.songs.find((item) => item.id === id);
    if (!song) return;
    const audio = $('#audio');
    const token = getAuthToken();
    audio.src = `api/songs/${id}/play${token ? `?access_token=${encodeURIComponent(token)}` : ''}`;
    $('#playerTitle').textContent = song.title || filename(song.file_path);
    $('#playerArtist').textContent = song.artist || '未知艺术家';
    $('#player').hidden = false;
    document.body.classList.add('has-player');
    audio.play().then(() => setPlayerIcon(true)).catch(() => toast('无法播放这首歌曲', 'error'));
  }
  function setPlayerIcon(playing) { $('#playerPlay').innerHTML = icon(playing ? 'pause' : 'play'); }

  function openModal(modal) { modal.hidden = false; setTimeout(() => $('input', modal)?.focus(), 30); }
  function closeModal(modal) { modal.hidden = true; }

  async function openPlaylistModal(ids) {
    let songIds = ids.filter(Boolean);
    if (!songIds.length) {
      if (state.currentPlaylist) songIds = state.playlistBaseSongs.map((song) => song.id);
      else {
        const data = await request(() => apiPost('/api/folders/songs', { paths: [state.currentPath || '__all__'] }), '读取文件夹歌曲失败');
        songIds = (data.songs || []).map((song) => song.id);
      }
    }
    if (!songIds.length) return toast('当前文件夹没有可加入歌单的歌曲', 'error');
    state.playlistSongIds = songIds;
    state.selectedPlaylistId = state.allPlaylists[0]?.id || null;
    state.playlistMode = state.allPlaylists.length ? 'existing' : 'create';
    renderPlaylistModal();
    openModal($('#playlistModal'));
  }

  function renderPlaylistModal() {
    const existing = state.playlistMode === 'existing';
    $$('[data-tab]', $('#playlistTabs')).forEach((button) => button.classList.toggle('active', button.dataset.tab === state.playlistMode));
    $('#existingPlaylistPanel').hidden = !existing;
    $('#createPlaylistPanel').hidden = existing;
    $('#playlistSelectionHint').textContent = `${state.playlistSongIds.length} 首歌曲`;
    $('#playlistChoices').innerHTML = state.allPlaylists.length ? state.allPlaylists.map((playlist) => `
      <button class="playlist-choice ${playlist.id === state.selectedPlaylistId ? 'active' : ''}" data-playlist-id="${playlist.id}">
        <span class="playlist-choice-icon">${icon('playlist')}</span><div><strong>${escapeHtml(playlist.name)}</strong><span>${playlist.song_count || 0} 首歌曲</span></div>${playlist.id === state.selectedPlaylistId ? icon('check') : ''}
      </button>
    `).join('') : '<div class="empty-state"><h3>还没有歌单</h3><p>切换到“创建新歌单”开始整理。</p></div>';
  }

  async function confirmPlaylist() {
    const button = $('#confirmPlaylist');
    setBusy(button, true);
    try {
      if (state.playlistMode === 'create') {
        const name = $('#playlistName').value.trim();
        if (!name) { toast('请输入歌单名称', 'error'); return; }
        const data = await request(() => apiPost('/api/playlists', { name, description: $('#playlistDescription').value.trim(), songIds: state.playlistSongIds }), '创建歌单失败');
        toast(`已创建歌单“${data.playlist.name}”，加入 ${data.result.added} 首歌曲`);
      } else {
        if (!state.selectedPlaylistId) { toast('请选择一个歌单', 'error'); return; }
        const data = await request(() => apiPost(`/api/playlists/${state.selectedPlaylistId}/songs`, { songIds: state.playlistSongIds }), '加入歌单失败');
        toast(`已加入 ${data.result.added} 首歌曲${data.result.skipped ? `，跳过 ${data.result.skipped} 首` : ''}`);
      }
      closeModal($('#playlistModal'));
      clearSelection();
      await loadPlaylists();
    } finally { setBusy(button, false); }
  }

  function openEdit(id) {
    const song = state.songs.find((item) => item.id === id);
    if (!song) return;
    state.editSong = song;
    $('#editTitle').value = song.title || '';
    $('#editArtist').value = song.artist || '';
    $('#editAlbum').value = song.album || '';
    openModal($('#editModal'));
  }

  async function saveEdit() {
    if (!state.editSong) return;
    const button = $('#saveSong');
    setBusy(button, true);
    try {
      const data = await request(() => apiPut(`/api/songs/${state.editSong.id}`, {
        title: $('#editTitle').value, artist: $('#editArtist').value, album: $('#editAlbum').value,
      }), '歌曲信息保存失败');
      const index = state.songs.findIndex((song) => song.id === state.editSong.id);
      if (index >= 0) state.songs[index] = data.song;
      renderSongs();
      closeModal($('#editModal'));
      toast('歌曲信息已保存');
    } finally { setBusy(button, false); }
  }

  async function removeFromCurrentPlaylist(ids) {
    if (!state.currentPlaylist || !ids.length) return;
    const playlistId = state.currentPlaylist.id;
    const data = await request(() => apiPost(`/api/playlists/${playlistId}/remove-songs`, { songIds: ids }), '从歌单移除失败');
    toast(`已从歌单移除 ${data.removed} 首歌曲`);
    await openPlaylist(playlistId);
  }

  function askDelete(ids) {
    if (!ids.length) return;
    state.pendingDelete = ids;
    $('#confirmTitle').textContent = ids.length > 1 ? `确定从音乐库移除这 ${ids.length} 首歌曲？` : '确定从音乐库移除这首歌曲？';
    $('#deleteAcknowledgement').checked = false;
    $('#confirmDelete').disabled = true;
    openModal($('#confirmModal'));
  }

  async function confirmDelete() {
    if (!$('#deleteAcknowledgement').checked) return;
    const button = $('#confirmDelete');
    setBusy(button, true, '移除中…');
    try {
      const data = await request(() => apiPost('/api/songs/delete', { songIds: state.pendingDelete }), '移除失败');
      closeModal($('#confirmModal'));
      toast(`已从音乐库移除 ${data.deleted} 首歌曲`);
      state.pendingDelete = [];
      if (state.currentPlaylist) await openPlaylist(state.currentPlaylist.id);
      else await navigate(state.currentPath, { refresh: true });
    } finally { setBusy(button, false); }
  }

  document.addEventListener('click', async (event) => {
    const target = event.target;
    const sortButton = target.closest('[data-sort-key]');
    if (sortButton) {
      const key = sortButton.dataset.sortKey;
      state.sortDirection = state.sortKey === key && state.sortDirection === 'asc' ? 'desc' : 'asc';
      state.sortKey = key;
      localStorage.setItem('folder-browser-sort-key', state.sortKey);
      localStorage.setItem('folder-browser-sort-direction', state.sortDirection);
      state.lastSelectedIndex = null;
      renderSongs();
      return;
    }
    if (target.closest('#columnSettingsButton')) {
      const panel = $('#columnSettingsPanel');
      panel.hidden = !panel.hidden;
      $('#columnSettingsButton').setAttribute('aria-expanded', String(!panel.hidden));
      return;
    }
    if (target.closest('#resetColumns')) {
      state.visibleColumns = [...DEFAULT_COLUMNS];
      localStorage.setItem('folder-browser-columns', JSON.stringify(state.visibleColumns));
      renderSongs();
      return;
    }
    const songCheckbox = target.closest('.song-checkbox');
    if (songCheckbox && event.shiftKey) {
      event.stopPropagation();
      toggleSong(Number(songCheckbox.dataset.songId), songCheckbox.checked, true);
      return;
    }
    const treeToggle = target.closest('[data-tree-toggle]');
    if (treeToggle) {
      event.stopPropagation();
      await toggleTreeNode(treeToggle.closest('.tree-node'));
      return;
    }
    const treeLabel = target.closest('.tree-label');
    if (treeLabel) {
      const node = treeLabel.closest('.tree-node');
      await toggleTreeNode(node, true);
      await navigate(treeLabel.dataset.folderPath);
      return;
    }
    const folderButton = target.closest('[data-folder-path]');
    if (folderButton) { await navigate(folderButton.dataset.folderPath); return; }
    if (target.closest('[data-go-root]')) { await navigate(state.rootPath); return; }
    const openPlaylistButton = target.closest('[data-open-playlist]');
    if (openPlaylistButton) { await openPlaylist(Number(openPlaylistButton.dataset.openPlaylist)); return; }
    if (target.closest('[data-close-modal]')) { closeModal(target.closest('.modal-backdrop')); return; }
    if (target.classList.contains('modal-backdrop')) { closeModal(target); return; }
    const viewButton = target.closest('[data-view]');
    if (viewButton) { state.view = viewButton.dataset.view; localStorage.setItem('folder-browser-view', state.view); renderSongs(); return; }
    const playButton = target.closest('[data-play-id]');
    if (playButton) { playSong(Number(playButton.dataset.playId)); return; }
    const menuButton = target.closest('[data-menu-id]');
    if (menuButton) { event.stopPropagation(); openRowMenu(Number(menuButton.dataset.menuId), menuButton); return; }
    const menuAction = target.closest('[data-action]');
    if (menuAction) {
      const id = Number(menuAction.dataset.id); const action = menuAction.dataset.action; closeRowMenu();
      if (action === 'play') playSong(id);
      if (action === 'playlist') await openPlaylistModal([id]);
      if (action === 'edit') openEdit(id);
      if (action === 'remove-playlist') await removeFromCurrentPlaylist([id]);
      if (action === 'delete') askDelete([id]);
      return;
    }
    const songRow = songSelectionTarget(target);
    if (songRow) {
      if (Date.now() < suppressSongClickUntil) return;
      const id = Number(songRow.dataset.songId);
      toggleSong(id, !state.selected.has(id), event.shiftKey);
      return;
    }
    const playlistChoice = target.closest('[data-playlist-id]');
    if (playlistChoice) { state.selectedPlaylistId = Number(playlistChoice.dataset.playlistId); renderPlaylistModal(); return; }
    const tab = target.closest('[data-tab]');
    if (tab) { state.playlistMode = tab.dataset.tab; renderPlaylistModal(); return; }
    if (!target.closest('.row-menu-pop')) closeRowMenu();
    if (!target.closest('.column-settings-wrap')) {
      $('#columnSettingsPanel').hidden = true;
      $('#columnSettingsButton').setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('.song-checkbox')) toggleSong(Number(event.target.dataset.songId), event.target.checked);
    if (event.target.matches('#masterCheckbox')) {
      state.songs.forEach((song) => event.target.checked ? state.selected.add(song.id) : state.selected.delete(song.id));
      updateSelectionUI();
    }
    if (event.target.matches('.folder-checkbox')) {
      const path = event.target.dataset.folderSelect;
      if (event.target.checked) state.selectedFolders.add(path); else state.selectedFolders.delete(path);
      updateFolderSelectionUI();
    }
    if (event.target.matches('.column-toggle')) {
      const key = event.target.value;
      if (event.target.checked) state.visibleColumns.push(key);
      else state.visibleColumns = state.visibleColumns.filter((columnKey) => columnKey !== key);
      state.visibleColumns = SONG_COLUMNS.map((column) => column.key).filter((columnKey) => state.visibleColumns.includes(columnKey));
      localStorage.setItem('folder-browser-columns', JSON.stringify(state.visibleColumns));
      renderSongs();
      $('#columnSettingsPanel').hidden = false;
      $('#columnSettingsButton').setAttribute('aria-expanded', 'true');
    }
  });

  $('#selectAllButton').addEventListener('click', () => {
    const all = state.songs.length && state.songs.every((song) => state.selected.has(song.id));
    state.songs.forEach((song) => all ? state.selected.delete(song.id) : state.selected.add(song.id));
    updateSelectionUI();
  });
  $('#clearSelection').addEventListener('click', clearSelection);
  $('#bulkPlaylist').addEventListener('click', () => openPlaylistModal(selectedIds()));
  $('#bulkRemovePlaylist').addEventListener('click', () => removeFromCurrentPlaylist(selectedIds()));
  $('#bulkDelete').addEventListener('click', () => askDelete(selectedIds()));
  $('#folderPlaylistButton').addEventListener('click', () => openPlaylistModal([]));
  $('#selectedFoldersPlaylist').addEventListener('click', addSelectedFoldersToPlaylist);
  $('#selectAllFolders').addEventListener('click', () => {
    const allSelected = state.folders.length && state.folders.every((folder) => state.selectedFolders.has(folder.path));
    state.folders.forEach((folder) => allSelected ? state.selectedFolders.delete(folder.path) : state.selectedFolders.add(folder.path));
    updateFolderSelectionUI();
  });
  $('#newPlaylistSide').addEventListener('click', () => openPlaylistModal(selectedIds()));
  $('#confirmPlaylist').addEventListener('click', confirmPlaylist);
  $('#saveSong').addEventListener('click', saveEdit);
  $('#confirmDelete').addEventListener('click', confirmDelete);
  $('#deleteAcknowledgement').addEventListener('change', (event) => { $('#confirmDelete').disabled = !event.target.checked; });
  $('#refreshButton').addEventListener('click', refreshCurrentView);
  $('#menuButton').addEventListener('click', () => document.body.classList.add('tree-open'));
  $('#treeScrim').addEventListener('click', () => document.body.classList.remove('tree-open'));
  $('#collapseTree').addEventListener('click', () => {
    $$('.tree-node.expanded', $('#folderTree')).forEach((node, index) => { if (index > 0) node.classList.remove('expanded'); });
  });
  $('#playlistSectionToggle').addEventListener('click', () => {
    const section = $('#playlistSection');
    const collapsed = section.classList.toggle('collapsed');
    $('#playlistSectionToggle').setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem('folder-browser-playlists-collapsed', collapsed ? '1' : '0');
  });

  $('#searchInput').addEventListener('input', (event) => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => search(event.target.value), 320);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchInput').focus(); }
    if (event.key === 'Escape') { $$('.modal-backdrop:not([hidden])').forEach(closeModal); closeRowMenu(); }
  });

  const audio = $('#audio');
  $('#playerPlay').addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
  $('#closePlayer').addEventListener('click', () => { audio.pause(); audio.removeAttribute('src'); $('#player').hidden = true; document.body.classList.remove('has-player'); });
  audio.addEventListener('play', () => setPlayerIcon(true));
  audio.addEventListener('pause', () => setPlayerIcon(false));
  audio.addEventListener('timeupdate', () => {
    $('#playerTime').textContent = formatDuration(audio.currentTime);
    $('#playerDuration').textContent = formatDuration(audio.duration);
    $('#playerSeek').value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : '0';
  });
  $('#playerSeek').addEventListener('input', (event) => { if (audio.duration) audio.currentTime = (Number(event.target.value) / 100) * audio.duration; });

  const contentPane = $('.content-pane');
  const scrollRail = $('#mobileScrollRail');
  const scrollThumb = $('#mobileScrollThumb');
  contentPane.addEventListener('scroll', scheduleScrollRailUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollRailUpdate);
  scrollThumb.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const rect = scrollThumb.getBoundingClientRect();
    scrollThumbDrag = { pointerId: event.pointerId, grabOffset: event.clientY - rect.top };
    scrollThumb.setPointerCapture?.(event.pointerId);
    document.body.classList.add('scroll-thumb-dragging');
  });
  scrollRail.addEventListener('pointerdown', (event) => {
    if (event.target === scrollThumb) return;
    event.preventDefault();
    const grabOffset = scrollThumb.offsetHeight / 2;
    scrollThumbDrag = { pointerId: event.pointerId, grabOffset };
    scrollPaneFromRail(event.clientY, grabOffset);
    scrollRail.setPointerCapture?.(event.pointerId);
    document.body.classList.add('scroll-thumb-dragging');
  });
  document.addEventListener('pointermove', (event) => {
    if (!scrollThumbDrag || event.pointerId !== scrollThumbDrag.pointerId) return;
    event.preventDefault();
    scrollPaneFromRail(event.clientY, scrollThumbDrag.grabOffset);
  });
  document.addEventListener('pointerup', (event) => {
    if (!scrollThumbDrag || event.pointerId !== scrollThumbDrag.pointerId) return;
    scrollThumbDrag = null;
    document.body.classList.remove('scroll-thumb-dragging');
  });
  document.addEventListener('pointercancel', () => {
    scrollThumbDrag = null;
    document.body.classList.remove('scroll-thumb-dragging');
  });
  if (typeof ResizeObserver === 'function') {
    const scrollObserver = new ResizeObserver(scheduleScrollRailUpdate);
    scrollObserver.observe(contentPane);
    scrollObserver.observe($('.content'));
  }

  syncThemeFromSongloft();
  if (typeof bridge.onThemeChange === 'function') bridge.onThemeChange(applyHostTheme);
  window.addEventListener('songloft-theme-change', (event) => applyHostTheme(event.detail?.theme || event.detail));
  hydrateIcons();
  if (localStorage.getItem('folder-browser-playlists-collapsed') === '1') {
    $('#playlistSection').classList.add('collapsed');
    $('#playlistSectionToggle').setAttribute('aria-expanded', 'false');
  }
  scheduleScrollRailUpdate();
  Promise.all([navigate(''), loadPlaylists()]).catch(() => {});
})();
