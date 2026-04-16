// pages/detail/index.js
Page({
  data: {
    poem: null,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadPoemDetail(options.id)
    }
  },

  // 加载诗词详情
  async loadPoemDetail(id) {
    try {
      this.setData({ loading: true })

      const serverUrl = getApp().globalData.serverUrl
      const res = await wx.request({
        url: `${serverUrl}/api/poems/${id}`,
        method: 'GET'
      })

      if (res.statusCode === 200 && res.data.code === 200) {
        this.setData({ poem: res.data.data })
      } else {
        wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 解析诗词内容
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
    const { poem } = this.data
    return poem ? {
      title: `${poem.title} - ${poem.author}`,
      path: `/pages/detail/index?id=${poem.id}`
    } : {
      title: '听雨眠舟',
      path: '/pages/index/index'
    }
  }
})