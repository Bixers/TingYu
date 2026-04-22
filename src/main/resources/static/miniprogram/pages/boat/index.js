const api = require('../../utils/api')

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

function normalizeMessage(item, driftLabel) {
  if (!item) return null
  return Object.assign({}, item, {
    createdAtText: formatTime(item.createdAt),
    updatedAtText: formatTime(item.updatedAt),
    driftLabel: driftLabel || item.driftLabel || ''
  })
}

function labelList(list, driftLabel) {
  return (list || []).map((item) => normalizeMessage(item, driftLabel))
}

function findMessageInList(list, id) {
  if (!id || !Array.isArray(list)) return null
  return list.find((item) => String(item.id) === String(id)) || null
}

function loadIdSet(key) {
  const value = wx.getStorageSync(key)
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function saveIdSet(key, list) {
  wx.setStorageSync(key, Array.isArray(list) ? list.map((item) => String(item)) : [])
}

Page({
  data: {
    currentTab: 'pool',
    draftText: '',
    draftSignature: '听雨客',
    replyText: '',
    replySignature: '听雨客',
    poolMessages: [],
    mineMessages: [],
    collectedMessages: [],
    recentReceivedMessages: [],
    receivedMessage: null,
    selectedThread: null,
    selectedThreadId: null,
    collectedThreadIds: [],
    repliedThreadIds: [],
    showReplyModal: false,
    replyTarget: null,
    loadingPool: false,
    loadingMine: false,
    loadingCollected: false,
    publishing: false,
    receiving: false,
    collecting: false,
    replying: false,
    isLoggedIn: false
  },

  onLoad() {
    this.restoreLocalThreadState()
    this.syncAuthState()
    this.loadCurrentTab(true)
    this.loadRecentReceivedMessages(true)
  },

  onShow() {
    this.restoreLocalThreadState()
    this.syncAuthState()
    this.loadCurrentTab(true)
    this.loadRecentReceivedMessages(true)
  },

  restoreLocalThreadState() {
    this.setData({
      collectedThreadIds: loadIdSet('boatCollectedThreadIds'),
      repliedThreadIds: loadIdSet('boatRepliedThreadIds')
    })
  },

  saveCollectedThreadId(id) {
    if (!id) return
    const collectedThreadIds = Array.from(new Set([String(id)].concat(this.data.collectedThreadIds || [])))
    this.setData({ collectedThreadIds })
    saveIdSet('boatCollectedThreadIds', collectedThreadIds)
  },

  saveRepliedThreadId(id) {
    if (!id) return
    const repliedThreadIds = Array.from(new Set([String(id)].concat(this.data.repliedThreadIds || [])))
    this.setData({ repliedThreadIds })
    saveIdSet('boatRepliedThreadIds', repliedThreadIds)
  },

  syncAuthState() {
    const app = getApp()
    this.setData({
      isLoggedIn: !!app.globalData.isLoggedIn
    })
  },

  loadCurrentTab(force) {
    if (!this.data.isLoggedIn) {
      this.setData({
        poolMessages: [],
        mineMessages: [],
        collectedMessages: [],
        recentReceivedMessages: [],
        receivedMessage: null,
        selectedThread: null,
        selectedThreadId: null
      })
      return Promise.resolve()
    }

    if (this.data.currentTab === 'mine') {
      return this.loadMineMessages(force)
    }
    if (this.data.currentTab === 'collected') {
      return this.loadCollectedMessages(force)
    }
    return this.loadPoolMessages(force).then(() => this.loadRecentReceivedMessages(force))
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.currentTab) return
    this.setData({
      currentTab: tab,
      selectedThread: null
    })
    this.loadCurrentTab(true)
  },

  onDraftInput(e) {
    this.setData({ draftText: (e.detail && e.detail.value) || '' })
  },

  onSignatureInput(e) {
    this.setData({ draftSignature: (e.detail && e.detail.value) || '听雨客' })
  },

  onReplyInput(e) {
    this.setData({ replyText: (e.detail && e.detail.value) || '' })
  },

  onReplySignatureInput(e) {
    this.setData({ replySignature: (e.detail && e.detail.value) || '听雨客' })
  },

  loadPoolMessages(force) {
    if (this.data.loadingPool) return Promise.resolve()
    if (!force && this.data.poolMessages.length) return Promise.resolve()
    this.setData({ loadingPool: true })
    return api.getBoatMessages(20).then((list) => {
      this.setData({
        poolMessages: labelList(list, '顺流待收')
      })
    }).catch((err) => {
      console.error('加载舟池失败', err)
      wx.showToast({ title: '加载舟池失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loadingPool: false })
    })
  },

  loadMineMessages(force) {
    if (this.data.loadingMine) return Promise.resolve()
    if (!force && this.data.mineMessages.length) return Promise.resolve()
    this.setData({ loadingMine: true })
    return api.getBoatMyMessages(20).then((list) => {
      this.setData({
        mineMessages: labelList(list, '已放入舟中')
      })
    }).catch((err) => {
      console.error('加载我的诗笺失败', err)
      wx.showToast({ title: '加载我的诗笺失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loadingMine: false })
    })
  },

  loadCollectedMessages(force) {
    if (this.data.loadingCollected) return Promise.resolve()
    if (!force && this.data.collectedMessages.length) return Promise.resolve()
    this.setData({ loadingCollected: true })
    return api.getBoatCollectedMessages(20).then((list) => {
      this.setData({
        collectedMessages: labelList(list, '已靠岸')
      })
    }).catch((err) => {
      console.error('加载收藏诗笺失败', err)
      wx.showToast({ title: '加载收藏诗笺失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loadingCollected: false })
    })
  },

  loadRecentReceivedMessages(force) {
    if (!this.data.isLoggedIn) {
      this.setData({ recentReceivedMessages: [] })
      return Promise.resolve()
    }
    if (!force && this.data.recentReceivedMessages.length) return Promise.resolve()
    return api.getBoatRecentReceivedMessages(3).then((list) => {
      this.setData({
        recentReceivedMessages: labelList(list, '顺流而来')
      })
    }).catch((err) => {
      console.error('加载最近收到的诗笺失败', err)
    })
  },

  findMessageById(id) {
    return (
      findMessageInList(this.data.recentReceivedMessages, id) ||
      findMessageInList(this.data.poolMessages, id) ||
      findMessageInList(this.data.mineMessages, id) ||
      findMessageInList(this.data.collectedMessages, id) ||
      findMessageInList((this.data.selectedThread && this.data.selectedThread.replies) || [], id) ||
      (this.data.selectedThread && this.data.selectedThread.root && String(this.data.selectedThread.root.id) === String(id) ? this.data.selectedThread.root : null) ||
      (this.data.receivedMessage && String(this.data.receivedMessage.id) === String(id) ? this.data.receivedMessage : null)
    )
  },

  refreshCurrent() {
    this.loadCurrentTab(true)
    this.loadRecentReceivedMessages(true)
  },

  publishMessage() {
    const content = (this.data.draftText || '').trim()
    const signature = (this.data.draftSignature || '').trim() || '听雨客'
    if (!content) {
      wx.showToast({ title: '先写一句诗', icon: 'none' })
      return
    }
    if (this.data.publishing) return

    this.setData({ publishing: true })
    api.publishBoatMessage({
      content: content,
      signature: signature
    }).then((message) => {
      const normalized = normalizeMessage(message, '已放入舟中')
      this.setData({
        draftText: '',
        draftSignature: '听雨客',
        mineMessages: [normalized].concat(this.data.mineMessages || [])
      })
      wx.showToast({ title: '已放入舟中', icon: 'success' })
      this.loadPoolMessages(true)
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '投递失败', icon: 'none' })
    }).finally(() => {
      this.setData({ publishing: false })
    })
  },

  receiveMessage() {
    if (this.data.receiving) return
    this.setData({ receiving: true })
    api.receiveBoatMessage().then((message) => {
      const normalized = normalizeMessage(message, '顺流而来')
      this.setData({ receivedMessage: normalized })
      wx.showToast({ title: '收到一枚诗笺', icon: 'success' })
      this.loadRecentReceivedMessages(true)
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '暂时没有诗笺', icon: 'none' })
    }).finally(() => {
      this.setData({ receiving: false })
    })
  },

  openThread(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    if (this.data.selectedThreadId && String(this.data.selectedThreadId) === String(id) && this.data.selectedThread && this.data.selectedThread.root) {
      return
    }
    api.getBoatThread(id).then((result) => {
      const root = normalizeMessage(result && result.root, '顺流而来')
      const replies = labelList(result && result.replies, '回声')
      this.setData({
        selectedThread: {
          root: root,
          replies: replies
        },
        selectedThreadId: id
      })
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '加载详情失败', icon: 'none' })
    })
  },

  closeThread() {
    this.setData({ selectedThread: null, selectedThreadId: null })
  },

  collectCurrentMessage() {
    const target = this.resolveCurrentMessage()
    if (!target || this.data.collecting) return
    if ((this.data.collectedThreadIds || []).includes(String(target.id))) {
      wx.showToast({ title: '这枚诗笺已收藏', icon: 'none' })
      return
    }
    this.setData({ collecting: true })
    api.collectBoatMessage(target.id).then((message) => {
      wx.showToast({ title: '已收藏到诗舟', icon: 'success' })
      const normalized = normalizeMessage(message, '已靠岸')
      this.setData({
        collectedMessages: [normalized].concat(this.data.collectedMessages || [])
      })
      this.saveCollectedThreadId(target.id)
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '收藏失败', icon: 'none' })
    }).finally(() => {
      this.setData({ collecting: false })
    })
  },

  openReplyModal() {
    const target = this.resolveCurrentMessage()
    if (!target) return
    if ((this.data.repliedThreadIds || []).includes(String(target.id))) {
      wx.showToast({ title: '这枚诗笺已回复过', icon: 'none' })
      return
    }
    this.setData({
      showReplyModal: true,
      replyTarget: target,
      replyText: '',
      replySignature: '听雨客'
    })
  },

  closeReplyModal() {
    if (this.data.replying) return
    this.setData({
      showReplyModal: false,
      replyTarget: null,
      replyText: '',
      replySignature: '听雨客'
    })
  },

  submitReply() {
    const target = this.data.replyTarget
    const replyText = (this.data.replyText || '').trim()
    const signature = (this.data.replySignature || '').trim() || '听雨客'
    if (!target || !target.id) return
    if ((this.data.repliedThreadIds || []).includes(String(target.id))) {
      wx.showToast({ title: '这枚诗笺已回复过', icon: 'none' })
      return
    }
    if (!replyText) {
      wx.showToast({ title: '先写一句回复', icon: 'none' })
      return
    }
    if (this.data.replying) return

    this.setData({ replying: true })
    api.replyBoatMessage(target.id, {
      replyText: replyText,
      signature: signature
    }).then((result) => {
      wx.showToast({ title: '回复已入舟', icon: 'success' })
      const root = normalizeMessage(result && result.root, '顺流而来')
      const replies = labelList(result && result.replies, '回声')
      this.setData({
        selectedThread: {
          root: root,
          replies: replies
        },
        selectedThreadId: target.id,
        showReplyModal: false,
        replyTarget: null,
        replyText: '',
        replySignature: '听雨客'
      })
      this.saveRepliedThreadId(target.id)
      this.loadMineMessages(true)
      this.loadPoolMessages(true)
      this.loadRecentReceivedMessages(true)
    }).catch((err) => {
      wx.showToast({ title: (err && err.message) || '回复失败', icon: 'none' })
    }).finally(() => {
      this.setData({ replying: false })
    })
  },

  copyMessage(e) {
    const id = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    const message = this.findMessageById(id) || this.resolveCurrentMessage()
    if (!message) return
    wx.setClipboardData({
      data: `${message.content}\n—— ${message.signature || '听雨客'}`
    })
    wx.showToast({
      title: '已复制',
      icon: 'success'
    })
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/index' })
  },

  resolveCurrentMessage() {
    if (this.data.selectedThread && this.data.selectedThread.root) {
      return this.data.selectedThread.root
    }
    if (this.data.receivedMessage) {
      return this.data.receivedMessage
    }
    return null
  },

  onPullDownRefresh() {
    this.loadCurrentTab(true)
    this.loadRecentReceivedMessages(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 300)
  }
})
