// pages/index/index.js
const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')

Page({
  data: {
    currentPoem: null,
    contentLines: [],
    loading: false,
    animating: false,
    useTraditional: false
  },

  onLoad() {
    this.loadRandomPoem()
  },

  onShow() {
    var useTraditional = getApp().globalData.useTraditional
    if (useTraditional !== this.data.useTraditional) {
      this.setData({ useTraditional: useTraditional })
      this.applyConversion()
    }
  },

  onPullDownRefresh() {
    this.loadRandomPoem()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 切换繁简
  toggleChinese() {
    var useTraditional = !this.data.useTraditional
    this.setData({ useTraditional: useTraditional })
    getApp().globalData.useTraditional = useTraditional
    wx.setStorageSync('useTraditional', useTraditional)
    this.applyConversion()
  },

  // 应用繁简转换到当前显示数据
  applyConversion() {
    if (!this._rawPoem) return
    var poem = this._rawPoem
    var useT = this.data.useTraditional
    var displayPoem = {
      id: poem.id,
      title: cc.convert(poem.title, useT),
      author: cc.convert(poem.author, useT),
      dynasty: cc.convert(poem.dynasty, useT),
      content: poem.content
    }
    var rawLines = api.parseContent(poem.content)
    var contentLines = rawLines.map(function(line) { return cc.convert(line, useT) })
    this.setData({ currentPoem: displayPoem, contentLines: contentLines })
  },

  // 加载随机诗词
  loadRandomPoem() {
    if (this.data.loading) return
    this.setData({ loading: true })

    api.getRandomPoem().then(poem => {
      this._rawPoem = poem
      var useT = this.data.useTraditional
      var contentLines = api.parseContent(poem.content).map(function(l) { return cc.convert(l, useT) })
      var displayPoem = {
        id: poem.id,
        title: cc.convert(poem.title, useT),
        author: cc.convert(poem.author, useT),
        dynasty: cc.convert(poem.dynasty, useT),
        content: poem.content
      }
      this.setData({ currentPoem: displayPoem, contentLines: contentLines, animating: true })
      setTimeout(() => this.setData({ animating: false }), 500)
    }).catch(err => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  goToDetail() {
    const { currentPoem } = this.data
    if (currentPoem) {
      wx.navigateTo({ url: `/pages/detail/index?id=${currentPoem.id}` })
    }
  },

  goToDiscover() {
    wx.switchTab({ url: '/pages/discover/index' })
  },

  goToShare() {
    const { currentPoem } = this.data
    if (currentPoem) {
      wx.navigateTo({ url: `/pages/share/index?id=${currentPoem.id}` })
    }
  },

  onShareAppMessage() {
    const { currentPoem } = this.data
    return currentPoem ? {
      title: `${currentPoem.title} - ${currentPoem.author}`,
      path: `/pages/detail/index?id=${currentPoem.id}`
    } : {
      title: '听雨眠舟 - 春水碧于天，画船听雨眠',
      path: '/pages/index/index'
    }
  }
})
