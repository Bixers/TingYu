Page({
  data: {
    currentPoem: null,
    loading: false
  },

  onLoad() {
    this.loadDailyPoem()
  },

  onPullDownRefresh() {
    this.loadDailyPoem().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载每日诗词
  async loadDailyPoem() {
    try {
      this.setData({ loading: true })
      
      const { result } = await wx.cloud.callFunction({
        name: 'poemApi',
        data: { action: 'getDailyPoem' }
      })
      
      if (result.code === 200 && result.data) {
        this.setData({ currentPoem: result.data })
      } else {
        wx.showToast({ title: result.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载随机诗词
  async loadRandomPoem() {
    try {
      this.setData({ loading: true })
      
      const { result } = await wx.cloud.callFunction({
        name: 'poemApi',
        data: { action: 'getRandomPoem' }
      })
      
      if (result.code === 200 && result.data) {
        this.setData({ currentPoem: result.data })
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
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

  parseContent(content) {
    if (!content) return []
    try {
      return JSON.parse(content)
    } catch {
      return content.split('，').map((line, index, arr) => 
        index === arr.length - 1 ? line : line + '，'
      )
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
