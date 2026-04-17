// utils/api.js - 统一API请求封装

const app = getApp()

/**
 * 通用请求方法
 */
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

/**
 * 构建查询参数字符串
 */
function buildQuery(params) {
  const parts = []
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      parts.push(`${key}=${encodeURIComponent(params[key])}`)
    }
  }
  return parts.length > 0 ? '?' + parts.join('&') : ''
}

// 诗词相关
function getDailyPoem() {
  return request('/api/poems/daily')
}

function getRandomPoem() {
  return request('/api/poems/random')
}

function getPoemDetail(id) {
  return request(`/api/poems/${id}`)
}

function getPoemList(params) {
  const query = buildQuery(params)
  return request(`/api/poems/list${query}`)
}

// 标签相关
function getTagsGrouped() {
  return request('/api/tags/grouped')
}

function getAllTags() {
  return request('/api/tags')
}

// 元数据相关
function getDynasties() {
  return request('/api/meta/dynasties')
}

function getAuthors(dynasty) {
  const query = dynasty ? `?dynasty=${encodeURIComponent(dynasty)}` : ''
  return request(`/api/meta/authors${query}`)
}

// 作者详情
function getAuthorByName(name) {
  return request(`/api/authors/by-name?name=${encodeURIComponent(name)}`)
}

// 拼音转换
function getPinyin(text) {
  return request('/api/tools/pinyin', 'POST', { text: text })
}

// 用户相关
function getUserProfile() {
  return request('/api/user/profile')
}

function registerUser(data) {
  return request('/api/user/register', 'POST', data)
}

/**
 * 解析诗词内容为行数组
 */
function parseContent(content) {
  if (!content) return []
  content = content.replace(/\r/g, '')
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
    // JSON字符串类型，按换行拆分
    var str = String(parsed)
    if (str.indexOf('\n') !== -1) {
      return str.split('\n').filter(function(s) { return s.trim() })
    }
    return [str]
  } catch (e) {
    return content.split(/[，。！？；：、\n]/).filter(s => s.trim()).map((line, index, arr) => {
      return line
    })
  }
}

/**
 * 解析标签JSON为数组
 */
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
  parseContent,
  parseTags
}
