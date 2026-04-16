// pages/discover/index.js
const api = require('../../utils/api')

Page({
  data: {
    poems: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    keyword: '',
    // 筛选相关
    dynasties: [],
    allTags: [],
    selectedDynasty: '',
    selectedTag: '',
    showFilter: false,
    total: 0
  },

  onLoad() {
    this.loadPoems()
    this.loadDynasties()
    this.loadTags()
  },

  onShow() {
    const app = getApp()
    const tag = app.globalData.pendingTag
    if (tag) {
      app.globalData.pendingTag = ''
      this.setData({
        selectedTag: tag,
        showFilter: true,
        page: 1, poems: [], hasMore: true
      })
      this.loadPoems()
    }
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

    const { page, pageSize, keyword, selectedDynasty, selectedTag } = this.data
    const params = { page, size: pageSize }
    if (keyword) params.keyword = keyword
    if (selectedDynasty) params.dynasty = selectedDynasty
    if (selectedTag) params.tag = selectedTag

    api.getPoemList(params).then(result => {
      const { list, total } = result
      // 为每首诗解析内容预览和标签
      const processedList = (list || []).map(poem => ({
        ...poem,
        preview: this.getPreview(poem.content),
        tagsList: api.parseTags(poem.tags)
      }))
      const poems = page === 1 ? processedList : [...this.data.poems, ...processedList]
      const hasMore = poems.length < total

      this.setData({
        poems,
        hasMore,
        total,
        page: page + 1
      })
    }).catch(err => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 获取诗词内容预览（前两行）
  getPreview(content) {
    const lines = api.parseContent(content)
    return lines.slice(0, 2).join('')
  },

  // 加载朝代列表
  loadDynasties() {
    api.getDynasties().then(dynasties => {
      this.setData({ dynasties: dynasties || [] })
    }).catch(() => {})
  },

  // 加载标签列表
  loadTags() {
    api.getAllTags().then(tags => {
      this.setData({ allTags: tags || [] })
    }).catch(() => {})
  },

  // 搜索
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ page: 1, poems: [], hasMore: true })
    this.loadPoems()
  },

  // 切换筛选面板
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  // 选择朝代
  selectDynasty(e) {
    const dynasty = e.currentTarget.dataset.value
    const selected = dynasty === this.data.selectedDynasty ? '' : dynasty
    this.setData({
      selectedDynasty: selected,
      page: 1, poems: [], hasMore: true
    })
    this.loadPoems()
  },

  // 选择标签
  selectTag(e) {
    const tag = e.currentTarget.dataset.value
    const selected = tag === this.data.selectedTag ? '' : tag
    this.setData({
      selectedTag: selected,
      page: 1, poems: [], hasMore: true
    })
    this.loadPoems()
  },

  // 清空筛选
  clearFilters() {
    this.setData({
      selectedDynasty: '',
      selectedTag: '',
      keyword: '',
      page: 1, poems: [], hasMore: true
    })
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
