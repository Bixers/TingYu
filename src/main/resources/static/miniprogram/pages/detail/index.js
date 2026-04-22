const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')
const usage = require('../../utils/usage')

const RAIN_SOURCES = [
  { name: '疏雨滴梧', src: '/audio/rain_sparse.wav' },
  { name: '骤雨打荷', src: '/audio/rain_heavy.wav' },
  { name: '夜雨舟中', src: '/audio/rain_night.wav' }
]

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
    rhymeData: null,
    rhymeLoading: false,
    showRhymeModal: false,
    longPressText: '',
    longPressIndex: -1,
    longPressType: '',
    isFavoriteFull: false,
    favoriteLoading: false,
    showExcerptModal: false,
    excerptNote: '',
    excerptContext: null,
    excerptSaving: false,
    reading: false,
    readingLoading: false,
    ttsAvailable: false,
    rainSources: RAIN_SOURCES,
    rainSourceIndex: 0,
    rainEnabled: false,
    rainPlaying: false,
    rainLoading: false,
    useTraditional: false
  },

  onLoad(options) {
    this.setData({ useTraditional: getApp().globalData.useTraditional })
    this.loadRainAudioSources()
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

  onHide() {
    this.stopReading(false)
    this.stopRain(false)
  },

  onUnload() {
    this.stopReading(false)
    this.stopRain(false)
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

    const rawLines = api.parseSentences(poem.content)
    const contentLines = rawLines.map(function(line) { return cc.convert(line, useT) })
    const tagsList = api.parseTags(poem.tags).map(function(tag) { return cc.convert(tag, useT) })

    const annotationList = this._rawAnnotationList || []
    const displayAnnotation = annotationList.map(function(item) {
      return { word: cc.convert(item.word, useT), meaning: cc.convert(item.meaning, useT) }
    })

    this.setData({
      poem: displayPoem,
      contentLines: this.buildContentLineStates(contentLines),
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

      const contentLines = api.parseSentences(poem.content).map(function(line) { return cc.convert(line, useT) })
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
        contentLines: this.buildContentLineStates(contentLines),
        tagsList: tagsList,
        activeTab: activeTab
      })
      usage.recordPoemView(poem.id)
      wx.setNavigationBarTitle({ title: displayPoem.title || '诗词详情' })
      this.loadFavoriteStatus(poem.id)
      this.loadExcerptHighlights(poem.id)

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
      console.error('加载详情失败', err)
      wx.showToast({ title: '加载详情失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  loadRainAudioSources() {
    api.getAppConfig().then((config) => {
      const rainSources = RAIN_SOURCES.map((item) => ({
        name: item.name,
        src: (config && (
          (item.name === '疏雨滴梧' && config.rainSparseUrl) ||
          (item.name === '骤雨打荷' && config.rainHeavyUrl) ||
          (item.name === '夜雨舟中' && config.rainNightUrl)
        )) ? String(
          item.name === '疏雨滴梧' ? config.rainSparseUrl :
          item.name === '骤雨打荷' ? config.rainHeavyUrl :
          config.rainNightUrl
        ).trim() : item.src
      }))
      this.setData({
        rainSources: rainSources,
        ttsAvailable: !!(config && config.ttsAvailable)
      })
    }).catch(() => {
      this.setData({
        rainSources: RAIN_SOURCES,
        ttsAvailable: false
      })
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  toggleImmersive() {
    if (this.data.showPinyinModal) return
    if (this.data.immersiveMode) {
      this.stopRain(false)
    }
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
      pinyinData: null
    })

    api.getPinyin(text).then((result) => {
      this.setData({
        pinyinData: result,
        pinyinLoading: false,
        pinyinError: false
      })
    }).catch(() => {
      wx.showToast({ title: '拼音获取失败', icon: 'none' })
      this.setData({
        pinyinLoading: false,
        pinyinError: true,
        pinyinData: null
      })
    })
  },

  lookupRhyme() {
    if (!this.data.longPressText) return
    this.setData({
      rhymeLoading: true,
      showRhymeModal: true,
      rhymeData: null
    })
    api.getRhymeInfo(this.data.longPressText).then((result) => {
      this.setData({
        rhymeData: result,
        rhymeLoading: false
      })
    }).catch((err) => {
      this.setData({
        rhymeLoading: false,
        rhymeData: null
      })
      wx.showToast({ title: (err && err.message) || '韵部查询失败', icon: 'none' })
    })
  },

  copyText() {
    wx.setClipboardData({ data: this.data.longPressText })
  },

  openExcerptModal() {
    if (this.data.longPressType !== 'sentence') {
      wx.showToast({ title: '请长按句子后摘录', icon: 'none' })
      return
    }
    const excerptContext = {
      poemId: this.data.poem && this.data.poem.id ? this.data.poem.id : '',
      sentenceIndex: this.data.longPressIndex,
      sentenceText: this.data.longPressText || ''
    }
    this.setData({
      showExcerptModal: true,
      excerptNote: '',
      excerptContext: excerptContext
    })
  },

  closeExcerptModal() {
    if (this.data.excerptSaving) return
    this.setData({
      showExcerptModal: false,
      excerptNote: '',
      excerptContext: null
    })
  },

  onExcerptNoteInput(e) {
    const note = e.detail && e.detail.value ? e.detail.value : ''
    this.setData({ excerptNote: note })
  },

  saveExcerpt() {
    const poem = this.data.poem
    if (!poem || !poem.id) return
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (this.data.excerptSaving) return
    const excerptContext = this.data.excerptContext
    if (!excerptContext || excerptContext.poemId !== poem.id) {
      wx.showToast({ title: '请长按句子后摘录', icon: 'none' })
      return
    }

    const sentenceIndex = excerptContext.sentenceIndex
    const sentenceText = excerptContext.sentenceText || ''
    if (sentenceIndex === undefined || sentenceIndex === null || sentenceIndex < 0 || !sentenceText) {
      wx.showToast({ title: '未获取到句子', icon: 'none' })
      return
    }

      this.setData({ excerptSaving: true })
      api.addExcerpt({
        poemId: poem.id,
        sentenceIndex: sentenceIndex,
        sentenceText: sentenceText,
        note: this.data.excerptNote || ''
      }).then(() => {
      usage.recordExcerpt()
      this.setData({
        showExcerptModal: false,
        excerptNote: '',
        excerptContext: null
      })
      this.loadExcerptHighlights(poem.id)
      wx.showToast({ title: '已加入摘录本', icon: 'success' })
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '摘录失败', icon: 'none' })
    }).finally(() => {
      this.setData({ excerptSaving: false })
    })
  },

  buildContentLineStates(lines) {
    const favoriteIndexes = this._excerptSentenceIndexes || []
    this._displayContentLines = lines || []
    return (lines || []).map(function(line, index) {
      return {
        text: line,
        isFavorite: favoriteIndexes.indexOf(index) !== -1
      }
    })
  },

  buildReadingText() {
    const poem = this._rawPoem || this.data.poem
    if (!poem) return ''
    const lines = api.parseSentences(poem.content)
    const pieces = [poem.title || '', poem.author || '', lines.join('')]
    return pieces.filter(function(part) {
      return part && String(part).trim()
    }).join('。')
  },

  getReadingVoice() {
    return 'zh-CN-XiaoxiaoNeural'
  },

  getReadingOutputFormat() {
    return 'audio-24khz-96kbitrate-mono-mp3'
  },

  ensureFilePath(fileExtension) {
    const suffix = fileExtension || 'mp3'
    return `${wx.env.USER_DATA_PATH}/tingyu_tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${suffix}`
  },

  writeAudioFile(audioBase64, fileExtension) {
    return new Promise((resolve, reject) => {
      try {
        const filePath = this.ensureFilePath(fileExtension)
        wx.getFileSystemManager().writeFile({
          filePath: filePath,
          data: audioBase64,
          encoding: 'base64',
          success: () => {
            this._readingTempFilePath = filePath
            resolve(filePath)
          },
          fail: (err) => reject(err)
        })
      } catch (e) {
        reject(e)
      }
    })
  },

  cleanupReadingTempFile() {
    if (!this._readingTempFilePath) return
    const filePath = this._readingTempFilePath
    this._readingTempFilePath = ''
    try {
      wx.getFileSystemManager().unlink({
        filePath: filePath,
        fail: () => {}
      })
    } catch (e) {}
  },

  startReading() {
    const poem = this.data.poem
    if (!poem || !poem.id) return
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (this.data.readingLoading) return
    if (!this.data.ttsAvailable) {
      wx.showToast({ title: '朗读暂不可用', icon: 'none' })
      return
    }

    const text = this.buildReadingText()
    if (!text) {
      wx.showToast({ title: '暂无可朗读内容', icon: 'none' })
      return
    }

    this.setData({ readingLoading: true })
    api.synthesizeSpeech({
      text: text,
      voice: this.getReadingVoice(),
      outputFormat: this.getReadingOutputFormat()
    }).then((result) => {
      if (!result || !result.audioBase64) {
        throw new Error('朗读生成失败')
      }
      return this.writeAudioFile(result.audioBase64, result.fileExtension || 'mp3').then((filePath) => {
        this.playReadingAudio(filePath)
      })
    }).catch((err) => {
      console.error('朗读生成失败', err)
      this.setData({ readingLoading: false, reading: false })
      wx.showToast({ title: (err && err.message) || '朗读生成失败', icon: 'none' })
    })
  },

  playReadingAudio(audioSrc) {
    if (!audioSrc) {
      this.setData({ readingLoading: false })
      return
    }

    if (this.audioContext) {
      try {
        this.audioContext.destroy()
      } catch (e) {}
      this.audioContext = null
    }

    const audio = wx.createInnerAudioContext()
    audio.autoplay = false
    audio.src = audioSrc
    audio.onPlay(() => {
      this.setData({ reading: true, readingLoading: false })
    })
    audio.onEnded(() => {
      this.setData({ reading: false, readingLoading: false })
      this.cleanupReadingTempFile()
    })
    audio.onStop(() => {
      this.setData({ reading: false, readingLoading: false })
      this.cleanupReadingTempFile()
    })
    audio.onError((err) => {
      console.error('朗读播放失败', err)
      this.setData({ reading: false, readingLoading: false })
      this.cleanupReadingTempFile()
      wx.showToast({ title: '朗读播放失败', icon: 'none' })
    })
    this.audioContext = audio
    audio.play()
  },

  stopReading(showToast) {
    if (this.audioContext) {
      try {
        this.audioContext.stop()
      } catch (e) {}
      try {
        this.audioContext.destroy()
      } catch (e) {}
      this.audioContext = null
    }
    this.cleanupReadingTempFile()
    this.setData({ reading: false, readingLoading: false })
    if (showToast) {
      wx.showToast({ title: '朗读已停止', icon: 'none' })
    }
  },

  toggleReading() {
    if (this.data.reading) {
      this.stopReading(true)
      return
    }
    this.startReading()
  },

  getCurrentRainSource() {
    return RAIN_SOURCES[this.data.rainSourceIndex] || RAIN_SOURCES[0]
  },

  clearRainFadeTimer() {
    if (this._rainFadeTimer) {
      clearInterval(this._rainFadeTimer)
      this._rainFadeTimer = null
    }
  },

  fadeRainVolume(audio, fromVolume, toVolume, duration, done) {
    this.clearRainFadeTimer()
    if (!audio) {
      if (typeof done === 'function') done()
      return
    }

    const steps = 12
    const interval = Math.max(16, Math.floor(duration / steps))
    let currentStep = 0
    const delta = (toVolume - fromVolume) / steps
    try {
      audio.volume = fromVolume
    } catch (e) {}

    this._rainFadeTimer = setInterval(() => {
      currentStep += 1
      const volume = currentStep >= steps ? toVolume : fromVolume + delta * currentStep
      try {
        audio.volume = Math.max(0, Math.min(1, volume))
      } catch (e) {}
      if (currentStep >= steps) {
        this.clearRainFadeTimer()
        if (typeof done === 'function') done()
      }
    }, interval)
  },

  startRain() {
    if (!this.data.immersiveMode) return
    if (this.data.rainLoading || this.data.rainPlaying) return

    const source = this.getCurrentRainSource()
    if (!source || !source.src) {
      this.setData({ rainEnabled: false })
      wx.showToast({ title: '暂无雨声音源', icon: 'none' })
      return
    }

    if (this.rainAudioContext) {
      this.stopRain(false)
    }

    this.setData({ rainLoading: true })
    const audio = wx.createInnerAudioContext()
    audio.autoplay = false
    audio.loop = true
    audio.volume = 0
    audio.src = source.src
    this.setData({ rainEnabled: true })

    audio.onPlay(() => {
      this.setData({ rainPlaying: true, rainLoading: false })
      this.fadeRainVolume(audio, 0, 0.3, 500)
    })
    audio.onStop(() => {
      this.clearRainFadeTimer()
      this.setData({ rainPlaying: false, rainLoading: false })
    })
    audio.onEnded(() => {
      this.setData({ rainPlaying: false, rainLoading: false })
    })
    audio.onError((err) => {
      console.error('雨声播放失败', err)
      this.clearRainFadeTimer()
      this.setData({ rainPlaying: false, rainLoading: false, rainEnabled: false })
      wx.showToast({ title: '雨声播放失败', icon: 'none' })
    })

    this.rainAudioContext = audio
    audio.play()
  },

  stopRain(showToast) {
    this.clearRainFadeTimer()
    const audio = this.rainAudioContext
    this.rainAudioContext = null

    if (audio) {
      this.fadeRainVolume(audio, audio.volume || 0, 0, 220, () => {
        try {
          audio.stop()
        } catch (e) {}
        try {
          audio.destroy()
        } catch (e) {}
      })
    }

    this.setData({ rainPlaying: false, rainLoading: false, rainEnabled: false })
    if (showToast) {
      wx.showToast({ title: '雨声已收起', icon: 'none' })
    }
  },

  onRainSwitchChange(e) {
    const checked = !!(e && e.detail && e.detail.value)
    if (!checked) {
      this.stopRain(true)
      return
    }
    this.startRain()
  },

  toggleRain() {
    this.onRainSwitchChange({
      detail: {
        value: !this.data.rainEnabled
      }
    })
  },

  selectRainSource(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (isNaN(index) || index < 0 || index >= RAIN_SOURCES.length) return

    if (index === this.data.rainSourceIndex) {
      if (!this.data.rainPlaying) {
        wx.showToast({ title: RAIN_SOURCES[index].name, icon: 'none' })
      }
      return
    }

    this.setData({ rainSourceIndex: index })
    if (this.data.rainPlaying) {
      this.stopRain(false)
      setTimeout(() => {
        this.startRain()
      }, 80)
    }
  },

  loadFavoriteStatus(poemId) {
    if (!poemId || !getApp().globalData.isLoggedIn) return
    api.getFavoriteStatus(poemId).then((status) => {
      this.setData({
        isFavoriteFull: !!(status && status.fullCollected)
      })
    }).catch(() => {})
  },

  loadExcerptHighlights(poemId) {
    if (!poemId || !getApp().globalData.isLoggedIn) {
      this._excerptSentenceIndexes = []
      this.setData({
        contentLines: this.buildContentLineStates(this._displayContentLines || [])
      })
      return
    }

    api.getExcerpts().then((list) => {
      const indexes = (list || [])
        .filter(function(item) {
          return item && item.poemId === poemId && item.sentenceIndex !== null && item.sentenceIndex !== undefined
        })
        .map(function(item) { return Number(item.sentenceIndex) })
        .filter(function(index) { return !isNaN(index) })

      this._excerptSentenceIndexes = indexes
      this.setData({
        contentLines: this.buildContentLineStates(this._displayContentLines || [])
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
      if (collected) {
        usage.recordFavorite()
      }
      this.setData({ isFavoriteFull: collected })
      wx.showToast({ title: collected ? '已收藏全文' : '已取消收藏', icon: 'success' })
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
    }).finally(() => {
      this.setData({ favoriteLoading: false })
    })
  },

  closePinyinModal() {
    this.setData({
      showPinyinModal: false,
      pinyinData: null,
      pinyinError: false,
      showRhymeModal: false,
      rhymeData: null,
      rhymeLoading: false,
      longPressIndex: -1,
      longPressType: ''
    })
  },

  noop() {},

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
