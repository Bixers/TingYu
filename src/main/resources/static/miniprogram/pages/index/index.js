// pages/index/index.js
const api = require('../../utils/api')

Page({
  data: {
    currentPoem: null,
    contentLines: [],
    loading: false,
    animating: false
  },

  onLoad() {
    this.loadDailyPoem()
  },

  onPullDownRefresh() {
    this.loadDailyPoem()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 加载每日诗词
  loadDailyPoem() {
    this.setData({ loading: true })

    api.getDailyPoem().then(poem => {
      const contentLines = api.parseContent(poem.content)
      this.setData({ currentPoem: poem, contentLines, animating: true })
      setTimeout(() => this.setData({ animating: false }), 500)
    }).catch(err => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 加载随机诗词
  loadRandomPoem() {
    if (this.data.loading) return
    this.setData({ loading: true })

    api.getRandomPoem().then(poem => {
      const contentLines = api.parseContent(poem.content)
      this.setData({ currentPoem: poem, contentLines, animating: true })
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
