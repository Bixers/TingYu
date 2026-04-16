// pages/discover/index.js
Page({
  data: {
    poems: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    keyword: ''
  },

  onLoad() {
    this.loadPoems()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, poems: [], hasMore: true })
    this.loadPoems()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPoems()
    }
  },

  // 加载诗词列表
  loadPoems() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const serverUrl = getApp().globalData.serverUrl
    const { page, pageSize, keyword } = this.data
    
    wx.request({
      url: `${serverUrl}/api/poems/list`,
      method: 'GET',
      data: {
        page,
        size: pageSize,
        keyword
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const { list, total } = res.data.data
          const poems = page === 1 ? list : [...this.data.poems, ...list]
          const hasMore = poems.length < total
          
          this.setData({
            poems,
            hasMore,
            page: page + 1
          })
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

  // 搜索诗词
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ page: 1, poems: [], hasMore: true })
    this.loadPoems()
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },

  onShareAppMessage() {
    return {
      title: '听雨眠舟 - 发现诗词之美',
      path: '/pages/discover/index'
    }
  }
})