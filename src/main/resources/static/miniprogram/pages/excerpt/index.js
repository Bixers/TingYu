const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')

Page({
  data: {
    excerpts: [],
    loading: false,
    loggedIn: false,
    useTraditional: false,
    showEditModal: false,
    editNote: '',
    editingExcerpt: null,
    saving: false
  },

  onLoad() {
    this.setData({
      useTraditional: getApp().globalData.useTraditional,
      loggedIn: getApp().globalData.isLoggedIn
    })
    this.loadExcerpts()
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
      this.loadExcerpts()
      return
    }
    if (loggedIn) {
      this.loadExcerpts()
    }
  },

  onPullDownRefresh() {
    this.loadExcerpts().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadExcerpts() {
    if (this.data.loading) return Promise.resolve()
    if (!this.data.loggedIn) {
      this.setData({ excerpts: [] })
      return Promise.resolve()
    }

    this.setData({ loading: true })
    return api.getExcerpts().then((list) => {
      const useT = this.data.useTraditional
      const excerpts = (list || []).map((item) => this.formatExcerpt(item, useT))
      this.setData({ excerpts: excerpts })
    }).catch((err) => {
      console.error('加载摘录失败:', err)
      wx.showToast({ title: '加载摘录失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatExcerpt(item, useT) {
    const poemTitle = cc.convert(item.poemTitle || '', useT)
    const poemAuthor = cc.convert(item.poemAuthor || '', useT)
    const poemDynasty = cc.convert(item.poemDynasty || '', useT)
    const sentenceText = cc.convert(item.sentenceText || '', useT)
    const note = cc.convert(item.note || '', useT)
    const previewLines = api.parseContent(item.poemContent || '')
    const preview = cc.convert((previewLines || []).slice(0, 2).join(''), useT)
    return Object.assign({}, item, {
      poemTitle: poemTitle,
      poemAuthor: poemAuthor,
      poemDynasty: poemDynasty,
      sentenceText: sentenceText,
      note: note,
      preview: preview
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },

  openEditModal(e) {
    const id = e.currentTarget.dataset.id
    const excerpt = (this.data.excerpts || []).find(function(item) {
      return item.id === id
    })
    if (!excerpt) return
    this.setData({
      showEditModal: true,
      editingExcerpt: excerpt,
      editNote: excerpt.note || ''
    })
  },

  onEditNoteInput(e) {
    const editNote = e.detail && e.detail.value ? e.detail.value : ''
    this.setData({ editNote: editNote })
  },

  closeEditModal() {
    if (this.data.saving) return
    this.setData({
      showEditModal: false,
      editNote: '',
      editingExcerpt: null
    })
  },

  saveEdit() {
    const excerpt = this.data.editingExcerpt
    if (!excerpt || !excerpt.id) return
    if (this.data.saving) return

    this.setData({ saving: true })
    api.updateExcerpt(excerpt.id, { note: this.data.editNote || '' }).then(() => {
      wx.showToast({ title: '已更新批注', icon: 'success' })
      this.setData({
        showEditModal: false,
        editNote: '',
        editingExcerpt: null
      })
      this.loadExcerpts()
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '更新失败', icon: 'none' })
    }).finally(() => {
      this.setData({ saving: false })
    })
  },

  deleteExcerpt(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '提示',
      content: '确定要删除这条摘录吗？',
      confirmColor: '#3A4A3F',
      success: (res) => {
        if (!res.confirm) return
        api.deleteExcerpt(id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadExcerpts()
        }).catch((err) => {
          wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
        })
      }
    })
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/profile/index' })
  }
})
