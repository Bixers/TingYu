const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')

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
    pinyinError: false,
    longPressText: '',
    longPressIndex: -1,
    longPressType: '',
    isFavoriteFull: false,
    favoriteLoading: false,
    sentenceFavoriteLoading: false,
    sentenceFavoriteCollected: false,
    useTraditional: false
  },

  onLoad(options) {
    this.setData({ useTraditional: getApp().globalData.useTraditional })
    if (options.id) {
      this.loadPoemDetail(options.id)
    }
  },

  onShow() {
    const useTraditional = getApp().globalData.useTraditional
    if (useTraditional !== this.data.useTraditional) {
      this.setData({ useTraditional: useTraditional })
      this.applyConversion()
    }
  },

  toggleChinese() {
    const useTraditional = !this.data.useTraditional
    this.setData({ useTraditional: useTraditional })
    getApp().globalData.useTraditional = useTraditional
    wx.setStorageSync('useTraditional', useTraditional)
    this.applyConversion()
  },

  applyConversion() {
    if (!this._rawPoem) return
    const poem = this._rawPoem
    const useT = this.data.useTraditional

    const displayPoem = Object.assign({}, poem, {
      title: cc.convert(poem.title, useT),
      author: cc.convert(poem.author, useT),
      dynasty: cc.convert(poem.dynasty, useT),
      appreciation: cc.convert(poem.appreciation, useT),
      translation: cc.convert(poem.translation, useT),
      annotation: poem.annotation
    })

    const rawLines = api.parseContent(poem.content)
    const contentLines = rawLines.map(function(line) { return cc.convert(line, useT) })
    const tagsList = api.parseTags(poem.tags).map(function(tag) { return cc.convert(tag, useT) })

    const annotationList = this._rawAnnotationList || []
    const displayAnnotation = annotationList.map(function(item) {
      return { word: cc.convert(item.word, useT), meaning: cc.convert(item.meaning, useT) }
    })

    this.setData({
      poem: displayPoem,
      contentLines: contentLines,
      tagsList: tagsList,
      annotationList: displayAnnotation
    })

    if (this._rawAuthorInfo) {
      this.setData({
        authorInfo: Object.assign({}, this._rawAuthorInfo, {
          name: cc.convert(this._rawAuthorInfo.name, useT),
          description: cc.convert(this._rawAuthorInfo.description, useT)
        })
      })
    }
  },

  loadPoemDetail(id) {
    this.setData({ loading: true })

    api.getPoemDetail(id).then((poem) => {
      this._rawPoem = poem
      const useT = this.data.useTraditional

      const contentLines = api.parseContent(poem.content).map(function(line) { return cc.convert(line, useT) })
      const tagsList = api.parseTags(poem.tags).map(function(tag) { return cc.convert(tag, useT) })

      let activeTab = 'annotation'
      if (!poem.annotation && poem.appreciation) activeTab = 'appreciation'
      else if (!poem.annotation && !poem.appreciation && poem.translation) activeTab = 'translation'

      const displayPoem = Object.assign({}, poem, {
        title: cc.convert(poem.title, useT),
        author: cc.convert(poem.author, useT),
        dynasty: cc.convert(poem.dynasty, useT),
        appreciation: cc.convert(poem.appreciation, useT),
        translation: cc.convert(poem.translation, useT),
        annotation: poem.annotation
      })

      this.setData({
        poem: displayPoem,
        contentLines: contentLines,
        tagsList: tagsList,
        activeTab: activeTab
      })
      wx.setNavigationBarTitle({ title: displayPoem.title || '璇楄瘝璇︽儏' })
      this.loadFavoriteStatus(poem.id)

      this._rawAnnotationList = []
      if (poem.annotation) {
        try {
          const list = JSON.parse(poem.annotation)
          if (Array.isArray(list)) {
            this._rawAnnotationList = list
            const displayList = list.map(function(item) {
              return { word: cc.convert(item.word, useT), meaning: cc.convert(item.meaning, useT) }
            })
            this.setData({ annotationList: displayList })
          }
        } catch (e) {
          this.setData({ annotationList: [] })
        }
      }

      if (poem.author) {
        api.getAuthorByName(poem.author).then((author) => {
          this._rawAuthorInfo = author
          this.setData({
            authorInfo: Object.assign({}, author, {
              name: cc.convert(author.name, useT),
              description: cc.convert(author.description, useT)
            })
          })
        }).catch(() => {})
      }
    }).catch((err) => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  toggleImmersive() {
    if (this.data.showPinyinModal) return
    this.setData({ immersiveMode: !this.data.immersiveMode })
  },

  toggleAuthorBio() {
    this.setData({ showAuthorBio: !this.data.showAuthorBio })
  },

  onLongPressTitle() {
    this.showPinyinPopup(this.data.poem.title, { type: 'text' })
  },

  onLongPressAuthor() {
    this.showPinyinPopup(this.data.poem.author, { type: 'text' })
  },

  onLongPressLine(e) {
    const line = e.currentTarget.dataset.line
    const index = e.currentTarget.dataset.index
    this.showPinyinPopup(line, {
      type: 'sentence',
      index: index
    })
  },

  showPinyinPopup(text, options) {
    if (!text) return
    options = options || {}
    const index = options.index === undefined || options.index === null
      ? -1
      : parseInt(options.index, 10)
    this.setData({
      showPinyinModal: true,
      pinyinLoading: true,
      pinyinError: false,
      longPressText: text,
      longPressIndex: isNaN(index) ? -1 : index,
      longPressType: options.type || '',
      sentenceFavoriteCollected: false,
      pinyinData: null
    })

    api.getPinyin(text).then((result) => {
      this.setData({
        pinyinData: result,
        pinyinLoading: false,
        pinyinError: false
      })
      if (options.type === 'sentence' && this.data.poem && this.data.poem.id !== undefined) {
        this.loadSentenceFavoriteStatus(this.data.poem.id, this.data.longPressIndex)
      }
    }).catch(() => {
      wx.showToast({ title: '拼音加载失败', icon: 'none' })
      this.setData({
        pinyinLoading: false,
        pinyinError: true,
        pinyinData: null
      })
    })
  },

  copyText() {
    wx.setClipboardData({ data: this.data.longPressText })
  },

  loadFavoriteStatus(poemId) {
    if (!poemId || !getApp().globalData.isLoggedIn) return
    api.getFavoriteStatus(poemId).then((status) => {
      this.setData({
        isFavoriteFull: !!(status && status.fullCollected)
      })
    }).catch(() => {})
  },

  loadSentenceFavoriteStatus(poemId, sentenceIndex) {
    if (!poemId || sentenceIndex === undefined || sentenceIndex === null || !getApp().globalData.isLoggedIn) return
    api.getFavoriteStatus(poemId, sentenceIndex).then((status) => {
      this.setData({
        sentenceFavoriteCollected: !!(status && status.sentenceCollected)
      })
    }).catch(() => {})
  },

  toggleFullFavorite() {
    const poem = this.data.poem
    if (!poem || !poem.id) return
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (this.data.favoriteLoading) return
    this.setData({ favoriteLoading: true })
    api.toggleFullFavorite(poem.id).then((result) => {
      const collected = !!(result && result.collected)
      this.setData({ isFavoriteFull: collected })
      wx.showToast({ title: collected ? '已收藏全文' : '已取消收藏', icon: 'success' })
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
    }).finally(() => {
      this.setData({ favoriteLoading: false })
    })
  },

  toggleSentenceFavorite() {
    const poem = this.data.poem
    if (!poem || !poem.id) return
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (this.data.sentenceFavoriteLoading) return
    if (this.data.longPressType !== 'sentence') return

    const sentenceText = this.data.longPressText || ''
    const sentenceIndex = this.data.longPressIndex
    if (sentenceIndex === undefined || sentenceIndex === null || sentenceIndex < 0) {
      wx.showToast({ title: '句子信息不完整', icon: 'none' })
      return
    }

    this.setData({ sentenceFavoriteLoading: true })
    api.toggleSentenceFavorite(poem.id, sentenceIndex, sentenceText).then((result) => {
      const collected = !!(result && result.collected)
      this.setData({ sentenceFavoriteCollected: collected })
      wx.showToast({ title: collected ? '已收藏句子' : '已取消收藏', icon: 'success' })
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
    }).finally(() => {
      this.setData({ sentenceFavoriteLoading: false })
    })
  },

  closePinyinModal() {
    this.setData({
      showPinyinModal: false,
      pinyinData: null,
      pinyinError: false,
      longPressIndex: -1,
      longPressType: '',
      sentenceFavoriteCollected: false
    })
  },

  goToShare() {
    const poem = this.data.poem
    if (poem) {
      wx.navigateTo({ url: `/pages/share/index?id=${poem.id}` })
    }
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    getApp().globalData.pendingTag = tag
    wx.switchTab({ url: '/pages/discover/index' })
  },

  onShareAppMessage() {
    const poem = this.data.poem
    return poem ? {
      title: `${poem.title} - ${poem.author}`,
      path: `/pages/detail/index?id=${poem.id}`
    } : {
      title: '听雨眠舟',
      path: '/pages/index/index'
    }
  }
})
