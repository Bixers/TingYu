Page({
  data: {
    currentPoem: null,
    loading: false
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
    
    const serverUrl = getApp().globalData.serverUrl
    wx.request({
      url: `${serverUrl}/api/poems/daily`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          this.setData({ currentPoem: res.data.data })
        } else {
          wx.showToast({ title: (res.data && res.data.message) || '加载失败', icon: 'none' })
        }
      },
      fail: (error) => {
        console.error('加载失败:', error)
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 加载随机诗词
  loadRandomPoem() {
    this.setData({ loading: true })
    
    const serverUrl = getApp().globalData.serverUrl
    wx.request({
      url: `${serverUrl}/api/poems/random`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          this.setData({ currentPoem: res.data.data })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
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
