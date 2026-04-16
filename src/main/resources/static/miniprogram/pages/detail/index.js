// pages/detail/index.js
const api = require('../../utils/api')

Page({
  data: {
    poem: null,
    contentLines: [],
    tagsList: [],
    annotationList: [],
    loading: false,
    activeTab: 'annotation',
    immersiveMode: false,
    authorInfo: null,
    showAuthorBio: false,
    showPinyinModal: false,
    pinyinData: null,
    pinyinLoading: false,
    longPressText: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadPoemDetail(options.id)
    }
  },

  // 加载诗词详情
  loadPoemDetail(id) {
    this.setData({ loading: true })

    api.getPoemDetail(id).then(poem => {
      const contentLines = api.parseContent(poem.content)
      const tagsList = api.parseTags(poem.tags)
      // 确定默认显示的Tab
      let activeTab = 'annotation'
      if (!poem.annotation && poem.appreciation) activeTab = 'appreciation'
      else if (!poem.annotation && !poem.appreciation && poem.translation) activeTab = 'translation'

      this.setData({ poem, contentLines, tagsList, activeTab })
      wx.setNavigationBarTitle({ title: poem.title || '诗词详情' })

      // 解析注释 JSON（[{word, meaning}] 格式）
      if (poem.annotation) {
        try {
          var list = JSON.parse(poem.annotation)
          if (Array.isArray(list)) {
            this.setData({ annotationList: list })
          }
        } catch (e) {
          this.setData({ annotationList: [] })
        }
      }

      // 并行加载作者信息（非阻塞）
      if (poem.author) {
        api.getAuthorByName(poem.author).then(author => {
          this.setData({ authorInfo: author })
        }).catch(() => {})
      }
    }).catch(err => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 切换沉浸模式
  toggleImmersive() {
    if (this.data.showPinyinModal) return
    this.setData({ immersiveMode: !this.data.immersiveMode })
  },

  // 展开/收起作者介绍
  toggleAuthorBio() {
    this.setData({ showAuthorBio: !this.data.showAuthorBio })
  },

  // 长按标题
  onLongPressTitle() {
    this.showPinyinPopup(this.data.poem.title)
  },

  // 长按作者
  onLongPressAuthor() {
    this.showPinyinPopup(this.data.poem.author)
  },

  // 长按诗词内容行
  onLongPressLine(e) {
    const line = e.currentTarget.dataset.line
    this.showPinyinPopup(line)
  },

  // 显示拼音弹窗
  showPinyinPopup(text) {
    if (!text) return
    this.setData({
      showPinyinModal: true,
      pinyinLoading: true,
      longPressText: text,
      pinyinData: null
    })
    api.getPinyin(text).then(result => {
      this.setData({ pinyinData: result, pinyinLoading: false })
    }).catch(() => {
      wx.showToast({ title: '拼音加载失败', icon: 'none' })
      this.setData({ showPinyinModal: false, pinyinLoading: false })
    })
  },

  // 复制文本
  copyText() {
    wx.setClipboardData({ data: this.data.longPressText })
  },

  // 关闭拼音弹窗
  closePinyinModal() {
    this.setData({ showPinyinModal: false, pinyinData: null })
  },

  // 跳转到卡片分享页
  goToShare() {
    const { poem } = this.data
    if (poem) {
      wx.navigateTo({ url: `/pages/share/index?id=${poem.id}` })
    }
  },

  // 点击标签跳转到发现页筛选
  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    getApp().globalData.pendingTag = tag
    wx.switchTab({ url: '/pages/discover/index' })
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
