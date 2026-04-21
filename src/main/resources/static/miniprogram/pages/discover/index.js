// pages/discover/index.js
const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')
const usage = require('../../utils/usage')

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
    total: 0,
    useTraditional: false
  },

  onLoad() {
    this.setData({ useTraditional: getApp().globalData.useTraditional })
    this.loadPoems()
    this.loadDynasties()
    this.loadTags()
  },

  onShow() {
    var useTraditional = getApp().globalData.useTraditional
    if (useTraditional !== this.data.useTraditional) {
      this.setData({ useTraditional: useTraditional })
      // 重新转换已加载的列表
      this.reconvertPoems()
    }

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

  // 重新转换已加载的诗词列表
  reconvertPoems() {
    if (!this._rawPoems || this._rawPoems.length === 0) return
    var useT = this.data.useTraditional
    var poems = this._rawPoems.map(function(poem) {
      return Object.assign({}, poem, {
        title: cc.convert(poem._rawTitle, useT),
        author: cc.convert(poem._rawAuthor, useT),
        dynasty: cc.convert(poem._rawDynasty, useT),
        preview: cc.convert(poem._rawPreview, useT),
        tagsList: (poem._rawTagsList || []).map(function(t) { return cc.convert(t, useT) })
      })
    })
    this.setData({ poems: poems })
  },

  onPullDownRefresh() {
    this._rawPoems = []
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

    var useT = this.data.useTraditional

    api.getPoemList(params).then(result => {
      const { list, total } = result
      // 为每首诗解析内容预览和标签，保留原始数据用于繁简转换
      const processedList = (list || []).map(poem => {
        var rawPreview = this.getPreview(poem.content)
        var rawTagsList = api.parseTags(poem.tags)
        return {
          id: poem.id,
          _rawTitle: poem.title,
          _rawAuthor: poem.author,
          _rawDynasty: poem.dynasty,
          _rawPreview: rawPreview,
          _rawTagsList: rawTagsList,
          title: cc.convert(poem.title, useT),
          author: cc.convert(poem.author, useT),
          dynasty: cc.convert(poem.dynasty, useT),
          preview: cc.convert(rawPreview, useT),
          tagsList: rawTagsList.map(function(t) { return cc.convert(t, useT) })
        }
      })

      var rawPoems = page === 1 ? processedList : (this._rawPoems || []).concat(processedList)
      this._rawPoems = rawPoems
      const hasMore = rawPoems.length < total

      this.setData({
        poems: rawPoems,
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
    this._rawPoems = []
    this.setData({ page: 1, poems: [], hasMore: true })
    usage.recordSearch()
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
    this._rawPoems = []
    this.setData({
      selectedDynasty: selected,
      page: 1, poems: [], hasMore: true
    })
    usage.recordSearch()
    this.loadPoems()
  },

  // 选择标签
  selectTag(e) {
    const tag = e.currentTarget.dataset.value
    const selected = tag === this.data.selectedTag ? '' : tag
    this._rawPoems = []
    this.setData({
      selectedTag: selected,
      page: 1, poems: [], hasMore: true
    })
    usage.recordSearch()
    this.loadPoems()
  },

  // 清空筛选
  clearFilters() {
    this._rawPoems = []
    this.setData({
      selectedDynasty: '',
      selectedTag: '',
      keyword: '',
      page: 1, poems: [], hasMore: true
    })
    usage.recordSearch()
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
