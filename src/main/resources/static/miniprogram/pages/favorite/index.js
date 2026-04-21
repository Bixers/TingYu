const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')

Page({
  data: {
    favorites: [],
    loading: false,
    useTraditional: false,
    loggedIn: false
  },

  onLoad() {
    this.setData({
      useTraditional: getApp().globalData.useTraditional,
      loggedIn: getApp().globalData.isLoggedIn
    })
    this.loadFavorites()
  },

  onShow() {
    const app = getApp()
    const useTraditional = app.globalData.useTraditional
    const loggedIn = app.globalData.isLoggedIn
    if (useTraditional !== this.data.useTraditional || loggedIn !== this.data.loggedIn) {
      this.setData({
        useTraditional: useTraditional,
        loggedIn: loggedIn
      })
      this.loadFavorites()
      return
    }
    if (loggedIn) {
      this.loadFavorites()
    }
  },

  onPullDownRefresh() {
    this.loadFavorites().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadFavorites() {
    if (this.data.loading) return Promise.resolve()
    if (!this.data.loggedIn) {
      this.setData({ favorites: [] })
      return Promise.resolve()
    }

    this.setData({ loading: true })
    return api.getFavorites('FULL').then((list) => {
      const useT = this.data.useTraditional
      const favorites = (list || []).map((item) => this.formatFavorite(item, useT))
      this.setData({ favorites: favorites })
    }).catch((err) => {
      console.error('加载收藏失败:', err)
      wx.showToast({ title: '加载收藏失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatFavorite(item, useT) {
    const poemTitle = cc.convert(item.poemTitle || '', useT)
    const poemAuthor = cc.convert(item.poemAuthor || '', useT)
    const poemDynasty = cc.convert(item.poemDynasty || '', useT)
    const previewLines = api.parseContent(item.poemContent || '')
    const preview = previewLines.slice(0, 2).join('')
    return Object.assign({}, item, {
      poemTitle: poemTitle,
      poemAuthor: poemAuthor,
      poemDynasty: poemDynasty,
      preview: cc.convert(preview, useT)
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },

  deleteFavorite(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '提示',
      content: '确定要取消这条收藏吗？',
      confirmColor: '#3A4A3F',
      success: (res) => {
        if (!res.confirm) return
        api.deleteFavorite(id).then(() => {
          wx.showToast({ title: '已取消收藏', icon: 'success' })
          this.loadFavorites()
        }).catch((err) => {
          wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
        })
      }
    })
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/profile/index' })
  },

  goToExcerpts() {
    wx.navigateTo({ url: '/pages/excerpt/index' })
  }
})
