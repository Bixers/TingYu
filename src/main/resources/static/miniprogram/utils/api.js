const app = getApp()

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      path,
      method,
      header: {
        'X-WX-SERVICE': app.globalData.serviceName
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

function getPinyin(text) {
  return request('/api/tools/pinyin', 'POST', { text: text })
}

function getUserProfile() {
  return request('/api/user/profile')
}

function registerUser(data) {
  return request('/api/user/register', 'POST', data)
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
    return content.split(/[，。！？；：、】【\n]/).filter(function(s) {
      return s.trim()
    })
  }
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
  getAuthorByName,
  getPinyin,
  getUserProfile,
  registerUser,
  getFavorites,
  getFavoriteStatus,
  toggleFullFavorite,
  toggleSentenceFavorite,
  deleteFavorite,
  parseContent,
  parseTags
}
