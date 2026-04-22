const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')
const calendar = require('../../utils/calendar')
const usage = require('../../utils/usage')

function buildRecommendReason(poem) {
  const tags = api.parseTags(poem && poem.tags)
  const tagText = tags.slice(0, 2).map(function(tag) {
    return String(tag || '').trim()
  }).filter(function(tag) {
    return tag
  }).join(' · ')

  const seed = Math.abs(String((poem && poem.id) || '').split('').reduce(function(sum, ch) {
    return sum + ch.charCodeAt(0)
  }, 0))

  if (tagText) {
    const tagReasons = [
      '适合今日慢读。',
      '适合在安静时慢慢读。',
      '适合配一杯热茶慢慢读。'
    ]
    return `推荐理由：${tagText}，${tagReasons[seed % tagReasons.length]}`
  }

  const title = String((poem && poem.title) || '')
  const dynasty = String((poem && poem.dynasty) || '')
  if (dynasty.indexOf('宋') !== -1) {
    return ['推荐理由：宋词适合慢读，余韵更长。', '推荐理由：宋词婉转，适合细读。'][seed % 2]
  }
  if (dynasty.indexOf('唐') !== -1) {
    return ['推荐理由：唐诗句式凝练，适合晨间开卷。', '推荐理由：唐诗简净，适合先读一句。'][seed % 2]
  }
  if (title.indexOf('雨') !== -1) {
    return ['推荐理由：含雨意，适合静夜听读。', '推荐理由：雨字入诗，天然有听雨的气息。'][seed % 2]
  }
  return ['推荐理由：清字缓句，适合在安静时慢慢读。', '推荐理由：轻声细读，更容易读出余味。'][seed % 2]
}

const LOCAL_FALLBACK_POEMS = [
  {
    id: 'local-rain-001',
    title: '夜雨寄北',
    author: '李商隐',
    dynasty: '唐',
    content: '君问归期未有期，巴山夜雨涨秋池。何当共剪西窗烛，却话巴山夜雨时。',
    tags: '思乡,夜雨,离别'
  },
  {
    id: 'local-rain-002',
    title: '山居秋暝',
    author: '王维',
    dynasty: '唐',
    content: '空山新雨后，天气晚来秋。明月松间照，清泉石上流。',
    tags: '山水,清新,秋夜'
  },
  {
    id: 'local-rain-003',
    title: '如梦令·昨夜雨疏风骤',
    author: '李清照',
    dynasty: '宋',
    content: '昨夜雨疏风骤，浓睡不消残酒。试问卷帘人，却道海棠依旧。',
    tags: '宋词,春雨,闺情'
  }
]

function getLocalFallbackPoem(seed) {
  const index = Math.abs(Number(seed || 0)) % LOCAL_FALLBACK_POEMS.length
  return LOCAL_FALLBACK_POEMS[index]
}
Page({
  data: {
    currentPoem: null,
    contentLines: [],
    loading: false,
    animating: false,
    useTraditional: false,
    poemSourceLabel: '',
    poemCalendarLabel: '',
    poemReason: ''
  },

  onLoad() {
    this._recentPoemIds = []
    this.updatePoemCalendar()
    this.loadHomePoem()
  },

  updatePoemCalendar() {
    this.setData({
      poemCalendarLabel: calendar.getPoemCalendarLabel(new Date())
    })
  },

  onShow() {
    const useTraditional = getApp().globalData.useTraditional
    if (useTraditional !== this.data.useTraditional) {
      this.setData({ useTraditional: useTraditional })
      this.applyConversion()
    }
    this.updatePoemCalendar()
  },

  onPullDownRefresh() {
    this._recentPoemIds = []
    this.loadHomePoem()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  toggleChinese() {
    const useTraditional = !this.data.useTraditional
    this.setData({ useTraditional: useTraditional })
    getApp().globalData.useTraditional = useTraditional
    wx.setStorageSync('useTraditional', useTraditional)
    this.applyConversion()
  },

  applyConversion() {
    if (!this._rawPoem) return
    const poem = this._rawPoem
    const useT = this.data.useTraditional
    const displayPoem = {
      id: poem.id,
      title: cc.convert(poem.title, useT),
      author: cc.convert(poem.author, useT),
      dynasty: cc.convert(poem.dynasty, useT),
      content: poem.content,
      tags: poem.tags
    }
    const rawLines = api.parseContent(poem.content)
    const contentLines = rawLines.map(function(line) {
      return cc.convert(line, useT)
    })
    this.setData({
      currentPoem: displayPoem,
      contentLines: contentLines,
      poemReason: buildRecommendReason(poem)
    })
  },

  rememberPoem(poemId) {
    if (!poemId) return
    let recent = this._recentPoemIds || []
    recent = recent.filter(function(id) {
      return id !== poemId
    })
    recent.unshift(poemId)
    if (recent.length > 12) {
      recent = recent.slice(0, 12)
    }
    this._recentPoemIds = recent
  },

  updateDisplayedPoem(poem, sourceLabel) {
    this._rawPoem = poem
    this.rememberPoem(poem.id)
    usage.recordPoemView(poem.id)
    const useT = this.data.useTraditional
    const contentLines = api.parseContent(poem.content).map(function(line) {
      return cc.convert(line, useT)
    })
    const displayPoem = {
      id: poem.id,
      title: cc.convert(poem.title, useT),
      author: cc.convert(poem.author, useT),
      dynasty: cc.convert(poem.dynasty, useT),
      content: poem.content,
      tags: poem.tags
    }
    this.setData({
      currentPoem: displayPoem,
      contentLines: contentLines,
      poemSourceLabel: sourceLabel || '',
      poemReason: buildRecommendReason(poem),
      animating: true
    })
    setTimeout(() => this.setData({ animating: false }), 500)
  },

  loadHomePoem() {
    if (this.data.loading) return
    this.setData({ loading: true })

    api.getDailyPoem().then((poem) => {
      this.updateDisplayedPoem(poem, '今日推荐')
    }).catch((err) => {
      console.error('加载首页诗词失败:', err)
      return api.getRandomPoem(this._recentPoemIds || []).then((poem) => {
        this.updateDisplayedPoem(poem, '随机诗词')
      }).catch(() => {
        const fallbackPoem = getLocalFallbackPoem(Date.now())
        this.updateDisplayedPoem(fallbackPoem, '本地诗词')
        wx.showToast({ title: '已切换本地诗页', icon: 'none' })
      })
    }).catch((err) => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  loadRandomPoem() {
    if (this.data.loading) return
    this.setData({ loading: true })

    api.getRandomPoem(this._recentPoemIds || []).then((poem) => {
      this.updateDisplayedPoem(poem, '随机诗词')
    }).catch((err) => {
      console.error('加载随机诗词失败:', err)
      const fallbackPoem = getLocalFallbackPoem(Date.now() + 1)
      this.updateDisplayedPoem(fallbackPoem, '本地诗词')
      wx.showToast({ title: '已切换本地诗页', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  goToDetail() {
    const currentPoem = this.data.currentPoem
    if (currentPoem && currentPoem.id && currentPoem.id.indexOf('local-') !== 0) {
      wx.navigateTo({ url: `/pages/detail/index?id=${currentPoem.id}` })
      return
    }
    wx.showToast({ title: '本地诗页暂不支持详情', icon: 'none' })
  },

  goToDiscover() {
    wx.switchTab({ url: '/pages/discover/index' })
  },

  goToShare() {
    const currentPoem = this.data.currentPoem
    if (currentPoem && currentPoem.id && currentPoem.id.indexOf('local-') !== 0) {
      wx.navigateTo({ url: `/pages/share/index?id=${currentPoem.id}` })
      return
    }
    wx.showToast({ title: '本地诗页暂不支持分享', icon: 'none' })
  },

  goToPoemCalendar() {
    const currentPoem = this.data.currentPoem
    if (currentPoem && currentPoem.id && currentPoem.id.indexOf('local-') !== 0) {
      wx.navigateTo({ url: `/pages/share/index?id=${currentPoem.id}&mode=calendar` })
      return
    }
    wx.showToast({ title: '本地诗页暂不支持诗历', icon: 'none' })
  },
  onShareAppMessage() {
    const currentPoem = this.data.currentPoem
    return currentPoem ? {
      title: `${currentPoem.title} - ${currentPoem.author}`,
      path: `/pages/detail/index?id=${currentPoem.id}`
    } : {
      title: '听雨眠舟 - 春水碧于天，画舟听雨眠。',
      path: '/pages/index/index'
    }
  }
})
