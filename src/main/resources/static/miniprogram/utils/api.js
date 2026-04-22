const app = getApp()

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const authToken = wx.getStorageSync('authToken')
    const envId = app.globalData.cloudEnvId || 'prod-4gnit1gx2a365651'
    const serviceName = app.globalData.serviceName
    const options = {
      config: {
        env: envId,
        service: serviceName
      },
      path,
      method,
      header: {
        'X-WX-SERVICE': serviceName
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          resolve(res.data.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          reject(new Error(msg))
        }
      },
      fail: (error) => {
        reject(error)
      }
    }
    if (data && method === 'POST') {
      options.data = data
      options.header['content-type'] = 'application/json'
    }
    if (authToken) {
      options.header.Token = authToken
      options.header.Authorization = `Bearer ${authToken}`
    }
    wx.cloud.callContainer(options)
  })
}

function buildQuery(params) {
  const parts = []
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      parts.push(`${key}=${encodeURIComponent(params[key])}`)
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

function getDailyPoem() {
  return request('/api/poems/daily')
}

function getRandomPoem(excludeIds) {
  const query = buildQuery({
    excludeIds: excludeIds && excludeIds.length ? excludeIds.join(',') : '',
    t: Date.now()
  })
  return request(`/api/poems/random${query}`)
}

function getPoemDetail(id) {
  return request(`/api/poems/${id}`)
}

function getPoemList(params) {
  const query = buildQuery(params)
  return request(`/api/poems/list${query}`)
}

function getTagsGrouped() {
  return request('/api/tags/grouped')
}

function getAllTags() {
  return request('/api/tags')
}

function getDynasties() {
  return request('/api/meta/dynasties')
}

function getAuthors(dynasty) {
  const query = dynasty ? `?dynasty=${encodeURIComponent(dynasty)}` : ''
  return request(`/api/meta/authors${query}`)
}

function getAuthorByName(name) {
  return request(`/api/authors/by-name?name=${encodeURIComponent(name)}`)
}

function getAppConfig() {
  return request('/api/meta/config')
}

function getPinyin(text) {
  return request('/api/tools/pinyin', 'POST', { text: text })
}

function getUserProfile() {
  return request('/api/user/profile')
}

function loginUser() {
  return request('/api/user/login', 'POST', {})
}

function registerUser(data) {
  return request('/api/user/register', 'POST', data)
}

function updateRainPushPreference(enabled) {
  return request('/api/user/rain-push', 'POST', {
    enabled: !!enabled
  })
}

function getFavorites(type) {
  const query = buildQuery({
    type: type || ''
  })
  return request(`/api/favorites${query}`)
}

function getFavoriteStatus(poemId, sentenceIndex) {
  const query = buildQuery({
    poemId: poemId,
    sentenceIndex: sentenceIndex
  })
  return request(`/api/favorites/status${query}`)
}

function toggleFullFavorite(poemId) {
  return request('/api/favorites/full/toggle', 'POST', {
    poemId: poemId
  })
}

function toggleSentenceFavorite(poemId, sentenceIndex, sentenceText) {
  return request('/api/favorites/sentence/toggle', 'POST', {
    poemId: poemId,
    sentenceIndex: sentenceIndex,
    sentenceText: sentenceText
  })
}

function deleteFavorite(id) {
  return request(`/api/favorites/${id}`, 'DELETE')
}

function getExcerpts() {
  return request('/api/excerpts')
}

function addExcerpt(data) {
  return request('/api/excerpts', 'POST', data)
}

function updateExcerpt(id, data) {
  return request(`/api/excerpts/${id}`, 'PUT', data)
}

function deleteExcerpt(id) {
  return request(`/api/excerpts/${id}`, 'DELETE')
}

function getUsageSummary() {
  return request('/api/usage/summary')
}

function getBoatMessages(limit) {
  const query = buildQuery({
    limit: limit || 20
  })
  return request(`/api/boat/messages${query}`)
}

function getBoatMyMessages(limit) {
  const query = buildQuery({
    limit: limit || 20
  })
  return request(`/api/boat/messages/mine${query}`)
}

function getBoatCollectedMessages(limit) {
  const query = buildQuery({
    limit: limit || 20
  })
  return request(`/api/boat/messages/collected${query}`)
}

function getBoatRecentReceivedMessages(limit) {
  const query = buildQuery({
    limit: limit || 3
  })
  return request(`/api/boat/messages/recent-received${query}`)
}

function getBoatThread(id) {
  return request(`/api/boat/messages/${encodeURIComponent(id)}`)
}

function publishBoatMessage(data) {
  return request('/api/boat/messages', 'POST', data)
}

function receiveBoatMessage() {
  return request('/api/boat/receive', 'POST', {})
}

function collectBoatMessage(id) {
  return request(`/api/boat/messages/${encodeURIComponent(id)}/collect`, 'POST', {})
}

function replyBoatMessage(id, data) {
  return request(`/api/boat/messages/${encodeURIComponent(id)}/reply`, 'POST', data)
}

function synthesizeSpeech(data) {
  return request('/api/tools/tts', 'POST', data)
}

function getRhymeInfo(text) {
  return request('/api/tools/rhyme', 'POST', { text: text })
}

function parseContent(content) {
  if (!content) return []
  content = content.replace(/\r/g, '')
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
    const str = String(parsed)
    if (str.indexOf('\n') !== -1) {
      return str.split('\n').filter(function(s) { return s.trim() })
    }
    return [str]
  } catch (e) {
    if (content.indexOf('\n') !== -1) {
      return content.split('\n').filter(function(s) {
        return s.trim()
      })
    }
    return [content].filter(function(s) {
      return s.trim()
    })
  }
}

function parseSentences(content) {
  if (!content) return []
  if (Array.isArray(content)) {
    content = content.join('')
  } else {
    content = String(content)
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        content = parsed.join('')
      } else {
        content = String(parsed)
      }
    } catch (e) {
      // keep original string
    }
  }

  content = content.replace(/\r/g, '')
  return content
    .split('。')
    .map(function(part) {
      return part.trim()
    })
    .filter(function(part) {
      return part.length > 0
    })
    .map(function(part) {
      return part + '。'
    })
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch (e) {
    return []
  }
}

module.exports = {
  request,
  getDailyPoem,
  getRandomPoem,
  getPoemDetail,
  getPoemList,
  getTagsGrouped,
  getAllTags,
  getDynasties,
  getAuthors,
  getAppConfig,
  getAuthorByName,
  getPinyin,
  getUserProfile,
  loginUser,
  registerUser,
  updateRainPushPreference,
  getFavorites,
  getFavoriteStatus,
  toggleFullFavorite,
  toggleSentenceFavorite,
  deleteFavorite,
  getExcerpts,
  addExcerpt,
  updateExcerpt,
  deleteExcerpt,
  getUsageSummary,
  getBoatMessages,
  getBoatMyMessages,
  getBoatCollectedMessages,
  getBoatRecentReceivedMessages,
  getBoatThread,
  publishBoatMessage,
  receiveBoatMessage,
  collectBoatMessage,
  replyBoatMessage,
  synthesizeSpeech,
  getRhymeInfo,
  parseContent,
  parseSentences,
  parseTags
}
