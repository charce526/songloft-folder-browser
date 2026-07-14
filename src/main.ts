/// <reference types="@songloft/plugin-sdk" />

import {
  createRouter,
  jsonResponse,
  parseQuery,
  type HTTPRequest,
  type HTTPResponse,
  type Song,
} from '@songloft/plugin-sdk';

const router = createRouter();
const PAGE_SIZE = 1000;
const CACHE_TTL_MS = 15_000;

interface LibrarySnapshot {
  songs: Song[];
  rootPath: string;
  loadedAt: number;
}

interface FolderItem {
  name: string;
  path: string;
  songCount: number;
}

interface ParsedBody {
  [key: string]: unknown;
}

interface EditableSongFields {
  title?: string;
  artist?: string;
  album?: string;
}

let cache: LibrarySnapshot | null = null;

function normalizePath(path: string): string {
  const value = (path || '').replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (value === '/') return '/';
  return value.replace(/\/$/, '');
}

function dirname(path: string): string {
  const value = normalizePath(path);
  const index = value.lastIndexOf('/');
  if (index < 0) return '';
  if (index === 0) return '/';
  return value.slice(0, index);
}

function basename(path: string): string {
  const value = normalizePath(path);
  const index = value.lastIndexOf('/');
  return index < 0 ? value : value.slice(index + 1);
}

function joinPath(parent: string, child: string): string {
  if (!parent) return child;
  if (parent === '/') return `/${child}`;
  return `${parent}/${child}`;
}

function isWithinPath(filePath: string, folderPath: string): boolean {
  const directory = dirname(filePath);
  return directory === folderPath || directory.startsWith(folderPath === '/' ? '/' : `${folderPath}/`);
}

function commonDirectory(songs: Song[]): string {
  const directories = songs
    .filter((song) => song.file_path)
    .map((song) => dirname(song.file_path))
    .filter(Boolean);
  if (!directories.length) return '';

  const absolute = directories[0].startsWith('/');
  const split = directories.map((path) => normalizePath(path).split('/').filter(Boolean));
  const common: string[] = [];
  const shortest = Math.min(...split.map((parts) => parts.length));
  for (let index = 0; index < shortest; index += 1) {
    const segment = split[0][index];
    if (split.every((parts) => parts[index] === segment)) common.push(segment);
    else break;
  }
  if (!common.length) return absolute ? '/' : '';
  return `${absolute ? '/' : ''}${common.join('/')}`;
}

async function loadAllSongs(force = false): Promise<LibrarySnapshot> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache;

  const songs: Song[] = [];
  let offset = 0;
  while (true) {
    const page = await songloft.songs.list({ limit: PAGE_SIZE, offset });
    songs.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += page.length;
  }
  cache = { songs, rootPath: commonDirectory(songs), loadedAt: Date.now() };
  return cache;
}

function invalidateCache(): void {
  cache = null;
}

function parseBody(req: HTTPRequest): ParsedBody {
  if (!req.body) return {};
  try {
    return JSON.parse(String(req.body)) as ParsedBody;
  } catch {
    throw new Error('请求内容不是有效的 JSON');
  }
}

function requiredString(body: ParsedBody, key: string, maxLength = 200): string {
  const value = typeof body[key] === 'string' ? body[key].trim() : '';
  if (!value) throw new Error(`${key} 不能为空`);
  if (value.length > maxLength) throw new Error(`${key} 最多 ${maxLength} 个字符`);
  return value;
}

function songIds(body: ParsedBody): number[] {
  if (!Array.isArray(body.songIds)) throw new Error('songIds 必须是数组');
  const ids = [...new Set(body.songIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) throw new Error('请至少选择一首歌曲');
  if (ids.length > 5000) throw new Error('一次最多操作 5000 首歌曲');
  return ids;
}

function folderPaths(body: ParsedBody): string[] {
  if (!Array.isArray(body.paths)) throw new Error('paths 必须是数组');
  const paths = [...new Set(body.paths
    .filter((path): path is string => typeof path === 'string')
    .map(normalizePath)
    .filter(Boolean))];
  if (!paths.length) throw new Error('请至少选择一个文件夹');
  if (paths.length > 500) throw new Error('一次最多选择 500 个文件夹');
  return paths;
}

function errorResponse(error: unknown): HTTPResponse {
  const message = error instanceof Error ? error.message : String(error);
  songloft.log.error(message);
  return jsonResponse({ error: message }, 400);
}

function breadcrumb(path: string, rootPath: string): Array<{ name: string; path: string }> {
  const result = [{ name: rootPath ? basename(rootPath) || '音乐库' : '音乐库', path: rootPath }];
  if (!path || path === rootPath) return result;
  const relative = rootPath && path.startsWith(rootPath) ? path.slice(rootPath.length).replace(/^\//, '') : path;
  let current = rootPath;
  for (const segment of relative.split('/').filter(Boolean)) {
    current = joinPath(current, segment);
    result.push({ name: segment, path: current });
  }
  return result;
}

router.get('/api/folders', async (req) => {
  try {
    const query = parseQuery(req.query || '');
    const snapshot = await loadAllSongs(query.refresh === '1');
    const requested = normalizePath(query.path || snapshot.rootPath);
    const currentPath = requested || snapshot.rootPath;
    const directSongs: Song[] = [];
    const folders = new Map<string, FolderItem>();

    for (const song of snapshot.songs) {
      if (!song.file_path) continue;
      const directory = dirname(song.file_path);
      if (directory === currentPath) {
        directSongs.push(song);
        continue;
      }
      const prefix = currentPath === '/' ? '/' : currentPath ? `${currentPath}/` : '';
      if (!directory.startsWith(prefix)) continue;
      const relative = directory.slice(prefix.length);
      const name = relative.split('/')[0];
      if (!name) continue;
      const childPath = joinPath(currentPath, name);
      const existing = folders.get(childPath);
      if (existing) existing.songCount += 1;
      else folders.set(childPath, { name, path: childPath, songCount: 1 });
    }

    // 没有本地路径的歌曲放在一个清晰的虚拟分组中。
    const isRoot = currentPath === snapshot.rootPath;
    const looseSongs = snapshot.songs.filter((song) => !song.file_path);
    if (isRoot && looseSongs.length) {
      folders.set('__unfiled__', { name: '未归档歌曲', path: '__unfiled__', songCount: looseSongs.length });
    }
    const songs = currentPath === '__unfiled__' ? looseSongs : directSongs;

    return jsonResponse({
      rootPath: snapshot.rootPath,
      currentPath,
      breadcrumbs: currentPath === '__unfiled__'
        ? [...breadcrumb(snapshot.rootPath, snapshot.rootPath), { name: '未归档歌曲', path: '__unfiled__' }]
        : breadcrumb(currentPath, snapshot.rootPath),
      folders: [...folders.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
      songs: songs.sort((a, b) => (a.title || basename(a.file_path)).localeCompare(b.title || basename(b.file_path), 'zh-CN')),
      totalSongs: snapshot.songs.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
});

router.get('/api/search', async (req) => {
  try {
    const query = parseQuery(req.query || '');
    const keyword = (query.q || '').trim().toLocaleLowerCase();
    const path = normalizePath(query.path || '');
    const snapshot = await loadAllSongs();
    const songs = snapshot.songs.filter((song) => {
      if (path === '__unfiled__' && song.file_path) return false;
      if (path && path !== '__unfiled__' && (!song.file_path || !isWithinPath(song.file_path, path))) return false;
      if (!keyword) return true;
      return [song.title, song.artist, song.album, song.file_path]
        .some((value) => (value || '').toLocaleLowerCase().includes(keyword));
    }).slice(0, 500);
    return jsonResponse({ songs, truncated: songs.length === 500 });
  } catch (error) {
    return errorResponse(error);
  }
});

router.post('/api/folders/songs', async (req) => {
  try {
    const paths = folderPaths(parseBody(req));
    const snapshot = await loadAllSongs();
    const songs = snapshot.songs.filter((song) => paths.some((path) => {
      if (path === '__all__') return true;
      if (path === '__unfiled__') return !song.file_path;
      return !!song.file_path && isWithinPath(song.file_path, path);
    }));
    if (songs.length > 5000) throw new Error('所选文件夹包含超过 5000 首歌曲，请减少选择范围');
    return jsonResponse({ songs });
  } catch (error) {
    return errorResponse(error);
  }
});

router.get('/api/playlists', async () => {
  try {
    const playlists = await songloft.playlists.list();
    return jsonResponse({ playlists: playlists.filter((playlist) => playlist.type === 'normal') });
  } catch (error) {
    return errorResponse(error);
  }
});

router.get('/api/playlists/:id/songs', async (_req, params) => {
  try {
    const playlistId = Number(params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0) throw new Error('无效的歌单 ID');
    const playlist = await songloft.playlists.getById(playlistId);
    if (!playlist) return jsonResponse({ error: '歌单不存在' }, 404);
    const songs = await songloft.playlists.getSongs(playlistId);
    return jsonResponse({ playlist, songs });
  } catch (error) {
    return errorResponse(error);
  }
});

router.post('/api/playlists', async (req) => {
  try {
    const body = parseBody(req);
    const name = requiredString(body, 'name', 100);
    const ids = songIds(body);
    const description = typeof body.description === 'string' ? body.description.slice(0, 500) : '';
    const playlist = await songloft.playlists.create({ name, description, type: 'normal' });
    const result = await songloft.playlists.addSongs(playlist.id, ids);
    return jsonResponse({ playlist, result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

router.post('/api/playlists/:id/songs', async (req, params) => {
  try {
    const playlistId = Number(params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0) throw new Error('无效的歌单 ID');
    const result = await songloft.playlists.addSongs(playlistId, songIds(parseBody(req)));
    return jsonResponse({ result });
  } catch (error) {
    return errorResponse(error);
  }
});

router.post('/api/playlists/:id/remove-songs', async (req, params) => {
  try {
    const playlistId = Number(params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0) throw new Error('无效的歌单 ID');
    const ids = songIds(parseBody(req));
    await songloft.playlists.removeSongs(playlistId, ids);
    return jsonResponse({ removed: ids.length });
  } catch (error) {
    return errorResponse(error);
  }
});

router.put('/api/songs/:id', async (req, params) => {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('无效的歌曲 ID');
    const body = parseBody(req);
    const fields: EditableSongFields = {};
    for (const key of ['title', 'artist', 'album'] as const) {
      if (typeof body[key] === 'string') fields[key] = body[key].trim().slice(0, 300);
    }
    if (!Object.keys(fields).length) throw new Error('没有需要更新的字段');
    const updated = await songloft.songs.update(id, fields);
    invalidateCache();
    return jsonResponse({ song: updated });
  } catch (error) {
    return errorResponse(error);
  }
});

router.post('/api/songs/delete', async (req) => {
  try {
    const ids = songIds(parseBody(req));
    for (const id of ids) await songloft.songs.delete(id);
    invalidateCache();
    return jsonResponse({ deleted: ids.length });
  } catch (error) {
    return errorResponse(error);
  }
});

router.get('/api/songs/:id/play', async (_req, params) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return jsonResponse({ error: '无效的歌曲 ID' }, 400);
  return {
    statusCode: 200,
    headers: { 'Cache-Control': 'private, max-age=3600' },
    serveFile: { songId: id },
  };
});

async function onInit(): Promise<void> {
  songloft.log.info('文件夹浏览已初始化');
}

async function onDeinit(): Promise<void> {
  cache = null;
  songloft.log.info('文件夹浏览已停止');
}

async function onHTTPRequest(req: HTTPRequest): Promise<HTTPResponse> {
  try {
    return await router.handle(req);
  } catch (error) {
    return errorResponse(error);
  }
}

globalThis.onInit = onInit;
globalThis.onDeinit = onDeinit;
globalThis.onHTTPRequest = onHTTPRequest;
