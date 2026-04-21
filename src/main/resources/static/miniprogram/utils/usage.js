const STORAGE_KEY = 'tingyu_usage_stats_v1'
const api = require('./api')

function getTodayKey(date) {
  const target = date instanceof Date ? date : new Date(date || Date.now())
  const year = target.getFullYear()
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readState() {
  const state = wx.getStorageSync(STORAGE_KEY)
  if (state && typeof state === 'object') {
    if (typeof state.totalSearches !== 'number') {
      state.totalSearches = 0
    }
    if (typeof state.totalExcerpts !== 'number') {
      state.totalExcerpts = 0
    }
    if (typeof state.totalFavorites !== 'number') {
      state.totalFavorites = 0
    }
    if (!state.daily || typeof state.daily !== 'object') {
      state.daily = {}
    }
    return state
  }
  return {
    firstSeenAt: Date.now(),
    totalPoems: 0,
    totalViews: 0,
    totalSearches: 0,
    totalExcerpts: 0,
    totalFavorites: 0,
    uniquePoemIds: [],
    daily: {}
  }
}

function saveState(state) {
  wx.setStorageSync(STORAGE_KEY, state)
}

function ensureDay(state, dayKey) {
  if (!state.daily[dayKey]) {
    state.daily[dayKey] = {
      poems: 0,
      views: 0
    }
  }
  return state.daily[dayKey]
}

function recordPoemView(poemId) {
  if (!poemId) return
  const state = readState()
  const dayKey = getTodayKey()
  const day = ensureDay(state, dayKey)
  day.views += 1
  state.totalViews += 1

  if (state.uniquePoemIds.indexOf(poemId) === -1) {
    state.uniquePoemIds.push(poemId)
    state.totalPoems += 1
    day.poems += 1
  }

  saveState(state)
  api.request('/api/usage/track', 'POST', { type: 'POEM_VIEW' }).catch(() => {})
}

function recordSearch() {
  const state = readState()
  state.totalSearches += 1
  saveState(state)
  api.request('/api/usage/track', 'POST', { type: 'SEARCH' }).catch(() => {})
}

function recordExcerpt() {
  const state = readState()
  state.totalExcerpts += 1
  saveState(state)
  api.request('/api/usage/track', 'POST', { type: 'EXCERPT' }).catch(() => {})
}

function recordFavorite() {
  const state = readState()
  state.totalFavorites += 1
  saveState(state)
  api.request('/api/usage/track', 'POST', { type: 'FAVORITE' }).catch(() => {})
}

function getSummary() {
  const state = readState()
  const today = new Date()
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - state.firstSeenAt) / (24 * 60 * 60 * 1000)) + 1)
  const series = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const dayKey = getTodayKey(date)
    const day = state.daily[dayKey] || { poems: 0, views: 0 }
    series.push({
      dayKey: dayKey,
      poems: day.poems,
      views: day.views
    })
  }

  return {
    daysElapsed: daysElapsed,
    totalPoems: state.totalPoems,
    totalViews: state.totalViews,
    totalSearches: state.totalSearches || 0,
    totalExcerpts: state.totalExcerpts || 0,
    totalFavorites: state.totalFavorites || 0,
    series: series
  }
}

module.exports = {
  recordPoemView,
  recordSearch,
  recordExcerpt,
  recordFavorite,
  getSummary
}
