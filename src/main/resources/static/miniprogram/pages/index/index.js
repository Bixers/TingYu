const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')

Page({
  data: {
    currentPoem: null,
    contentLines: [],
    loading: false,
    animating: false,
    useTraditional: false,
    poemSourceLabel: ''
  },

  onLoad() {
    this._recentPoemIds = []
    this.loadHomePoem()
  },

  onShow() {
    const useTraditional = getApp().globalData.useTraditional
    if (useTraditional !== this.data.useTraditional) {
      this.setData({ useTraditional: useTraditional })
      this.applyConversion()
    }
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
      content: poem.content
    }
    const rawLines = api.parseContent(poem.content)
    const contentLines = rawLines.map(function(line) {
      return cc.convert(line, useT)
    })
    this.setData({ currentPoem: displayPoem, contentLines: contentLines })
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
    const useT = this.data.useTraditional
    const contentLines = api.parseContent(poem.content).map(function(line) {
      return cc.convert(line, useT)
    })
    const displayPoem = {
      id: poem.id,
      title: cc.convert(poem.title, useT),
      author: cc.convert(poem.author, useT),
      dynasty: cc.convert(poem.dynasty, useT),
      content: poem.content
    }
    this.setData({
      currentPoem: displayPoem,
      contentLines: contentLines,
      poemSourceLabel: sourceLabel || '',
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
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  goToDetail() {
    const currentPoem = this.data.currentPoem
    if (currentPoem) {
      wx.navigateTo({ url: `/pages/detail/index?id=${currentPoem.id}` })
    }
  },

  goToDiscover() {
    wx.switchTab({ url: '/pages/discover/index' })
  },

  goToShare() {
    const currentPoem = this.data.currentPoem
    if (currentPoem) {
      wx.navigateTo({ url: `/pages/share/index?id=${currentPoem.id}` })
    }
  },

  onShareAppMessage() {
    const currentPoem = this.data.currentPoem
    return currentPoem ? {
      title: `${currentPoem.title} - ${currentPoem.author}`,
      path: `/pages/detail/index?id=${currentPoem.id}`
    } : {
      title: '听雨眠舟 - 春水碧于天，画船听雨眠',
      path: '/pages/index/index'
    }
  }
})
