const api = require('../../utils/api')
const usage = require('../../utils/usage')
const app = getApp()

function normalizeBoatSummary(summary) {
  const source = summary || {}
  const series = Array.isArray(source.series) ? source.series : []
  const normalizedSeries = series.map((item) => {
    const views = Number(item && item.views ? item.views : 0)
    const poems = Number(item && item.poems ? item.poems : 0)
    const dayKey = item && item.dayKey ? String(item.dayKey) : ''
    return {
      dayKey: dayKey,
      shortDayLabel: dayKey ? dayKey.slice(5).replace('-', '/') : '',
      poems: poems,
      views: views,
      viewsBarHeight: 0
    }
  })
  const peakViews = normalizedSeries.reduce((max, item) => Math.max(max, item.views), 0) || 1
  normalizedSeries.forEach((item) => {
    item.viewsBarHeight = Math.max(14, Math.round((item.views / peakViews) * 100))
  })

  return {
    daysElapsed: Number(source.daysElapsed || 0),
    totalPoems: Number(source.totalPoems || 0),
    totalViews: Number(source.totalViews || 0),
    totalSearches: Number(source.totalSearches || 0),
    totalExcerpts: Number(source.totalExcerpts || 0),
    totalFavorites: Number(source.totalFavorites || 0),
    series: normalizedSeries
  }
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    showManualLogin: false,
    tempAvatarUrl: '',
    tempNickname: '',
    submitting: false,
    boatSummary: null,
    rainPushEnabled: false,
    rainUpdating: false
  },

  onShow() {
    this.syncProfile()
    this.loadBoatSummary()
  },

  loadBoatSummary() {
    api.getUsageSummary().then((summary) => {
      this.setData({ boatSummary: normalizeBoatSummary(summary || usage.getSummary()) })
    }).catch(() => {
      this.setData({ boatSummary: normalizeBoatSummary(usage.getSummary()) })
    })
  },

  syncProfile() {
    const globalData = app.globalData
    const cachedUser = wx.getStorageSync('userInfo') || null
    const authToken = wx.getStorageSync('authToken') || ''
    const authTokenExpireAt = Number(wx.getStorageSync('authTokenExpireAt') || 0)
    const tokenValid = !!authToken && authTokenExpireAt > Date.now()
    const initialUser = tokenValid ? (globalData.userInfo || cachedUser) : null
    const initialLoggedIn = !!tokenValid
    this.setData({
      isLoggedIn: initialLoggedIn,
      userInfo: initialUser,
      rainPushEnabled: !!(initialUser && initialUser.rainPushEnabled)
    })

    if (!initialLoggedIn) {
      if (!tokenValid) {
        wx.removeStorageSync('authToken')
        wx.removeStorageSync('authTokenExpireAt')
        wx.removeStorageSync('userInfo')
        app.globalData.userInfo = null
        app.globalData.isLoggedIn = false
        app.globalData.authToken = ''
        app.globalData.authTokenExpireAt = 0
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          showManualLogin: false,
          rainPushEnabled: false
        })
      }
      return
    }

    api.getUserProfile().then((user) => {
      if (!user) {
        app.globalData.userInfo = null
        app.globalData.isLoggedIn = false
        wx.removeStorageSync('userInfo')
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          rainPushEnabled: false
        })
        return
      }

      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      app.globalData.authToken = authToken
      app.globalData.authTokenExpireAt = authTokenExpireAt
      wx.setStorageSync('userInfo', user)
      this.setData({
        isLoggedIn: true,
        userInfo: user,
        rainPushEnabled: !!user.rainPushEnabled
      })
    }).catch(() => {
      this.setData({
        isLoggedIn: !!initialLoggedIn,
        userInfo: initialUser,
        rainPushEnabled: !!(initialUser && initialUser.rainPushEnabled)
      })
    })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorite/index' })
  },

  goToExcerpts() {
    wx.navigateTo({ url: '/pages/excerpt/index' })
  },

  goToBoat() {
    wx.navigateTo({ url: '/pages/boat/index' })
  },

  loadDailyRainTemplateId() {
    const app = getApp()
    const cached = (app.globalData.dailyRainTemplateId || '').trim()
    if (cached) {
      return Promise.resolve(cached)
    }

    return api.getAppConfig().then((config) => {
      const templateId = (config && config.dailyRainTemplateId) ? String(config.dailyRainTemplateId).trim() : ''
      if (templateId) {
        app.globalData.dailyRainTemplateId = templateId
      }
      return templateId
    }).catch(() => '')
  },

  isProfileIncomplete(user) {
    const profile = user || {}
    const nickname = (profile.nickname || '').trim()
    const avatarUrl = (profile.avatarUrl || '').trim()
    return !nickname || nickname === '听雨客' || !avatarUrl
  },

  subscribeDailyRain() {
    if (this.data.rainUpdating) return
    this.setData({ rainUpdating: true })
    this.loadDailyRainTemplateId().then((templateId) => {
      if (!templateId) {
        wx.showModal({
          title: '缺少模板 ID',
          content: '后端还没有配置每日雨丝的订阅模板，请在服务端配置 wechat.subscribe.template-id 后再试。',
          showCancel: false
        })
        this.setData({ rainUpdating: false })
        return null
      }

      wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: (res) => {
          const grant = res && res[templateId] === 'accept'
          if (!grant) {
            wx.showToast({ title: '未允许订阅', icon: 'none' })
            return
          }

          api.updateRainPushPreference(true).then((user) => {
            const currentUser = user || {}
            app.globalData.userInfo = Object.assign({}, app.globalData.userInfo, currentUser)
            wx.setStorageSync('userInfo', app.globalData.userInfo)
            this.setData({ rainPushEnabled: !!currentUser.rainPushEnabled })
            wx.showToast({ title: '已订阅每日雨丝', icon: 'success' })
          }).catch((err) => {
            wx.showToast({ title: (err && err.message) || '订阅保存失败', icon: 'none' })
          }).finally(() => {
            this.setData({ rainUpdating: false })
          })
        },
        fail: (err) => {
          this.setData({ rainUpdating: false })
          wx.showToast({ title: (err && err.errMsg) || '订阅失败', icon: 'none' })
        }
      })
      return null
    }).catch(() => {
      this.setData({ rainUpdating: false })
      wx.showToast({ title: '获取订阅配置失败', icon: 'none' })
    })
  },

  requestUserProfile() {
    if (this.data.submitting) return

    this.setData({ submitting: true })
    api.loginUser().then((session) => {
      const payload = session && session.user ? session : { user: session }
      const user = payload.user || {}
      const token = payload.token || ''
      const expireAt = Number(payload.expireAt || 0)
      if (token) {
        wx.setStorageSync('authToken', token)
        wx.setStorageSync('authTokenExpireAt', expireAt)
        app.globalData.authToken = token
        app.globalData.authTokenExpireAt = expireAt
      }
      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      wx.setStorageSync('userInfo', user)
      this.setData({
        isLoggedIn: true,
        userInfo: user,
        showManualLogin: false,
        tempAvatarUrl: '',
        tempNickname: '',
        rainPushEnabled: !!user.rainPushEnabled
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch((err) => {
      console.error('登录失败', err)
      wx.showToast({ title: (err && err.message) || '登录失败', icon: 'none' })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  },

  showManualLoginForm() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先完成授权登录', icon: 'none' })
      return
    }
    const userInfo = this.data.userInfo || {}
    this.setData({
      showManualLogin: true,
      tempAvatarUrl: userInfo.avatarUrl || '',
      tempNickname: userInfo.nickname || ''
    })
  },

  hideLoginForm() {
    if (this.data.submitting) return
    this.setData({
      showManualLogin: false,
      tempAvatarUrl: '',
      tempNickname: ''
    })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl ? e.detail.avatarUrl : ''
    if (!avatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }
    this.setData({ tempAvatarUrl: avatarUrl })
  },

  onNicknameInput(e) {
    const nickname = e.detail && e.detail.value ? e.detail.value : ''
    this.setData({ tempNickname: nickname })
  },

  uploadAvatar(avatarUrl) {
    if (!avatarUrl) {
      return Promise.resolve('')
    }
    if (
      avatarUrl.indexOf('cloud://') === 0 ||
      avatarUrl.indexOf('http://') === 0 ||
      avatarUrl.indexOf('https://') === 0
    ) {
      return Promise.resolve(avatarUrl)
    }

    return new Promise((resolve) => {
      let ext = 'png'
      const matches = avatarUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
      if (matches && matches[1]) {
        ext = matches[1]
      }

      const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
      wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl,
        success: (res) => resolve(res.fileID || ''),
        fail: (err) => {
          console.error('头像上传失败', err)
          resolve('')
        }
      })
    })
  },

  submitManualLogin() {
    if (this.data.submitting) return

    const nickname = (this.data.tempNickname || '').trim()
    const avatarUrl = this.data.tempAvatarUrl || ''

    if (!avatarUrl) {
      wx.showToast({ title: '请先选择头像', icon: 'none' })
      return
    }
    if (!nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    this.uploadAvatar(avatarUrl).then((uploadedAvatarUrl) => {
      return api.registerUser({
        nickname: nickname,
        avatarUrl: uploadedAvatarUrl
      })
    }).then((session) => {
      const payload = session && session.user ? session : { user: session }
      const user = payload.user || {}
      const token = payload.token || ''
      const expireAt = Number(payload.expireAt || 0)
      if (token) {
        wx.setStorageSync('authToken', token)
        wx.setStorageSync('authTokenExpireAt', expireAt)
        app.globalData.authToken = token
        app.globalData.authTokenExpireAt = expireAt
      }
      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      wx.setStorageSync('userInfo', user)

      this.setData({
        isLoggedIn: true,
        userInfo: user,
        showManualLogin: false,
        tempAvatarUrl: '',
        tempNickname: '',
        submitting: false,
        rainPushEnabled: !!user.rainPushEnabled
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch((err) => {
      console.error('登录失败', err)
      this.setData({ submitting: false })
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    })
  },

  onRainPushChange(e) {
    if (this.data.rainUpdating) return
    const enabled = !!(e.detail && e.detail.value)
    this.setData({
      rainUpdating: true,
      rainPushEnabled: enabled
    })
    api.updateRainPushPreference(enabled).then((user) => {
      const currentUser = user || {}
      app.globalData.userInfo = Object.assign({}, app.globalData.userInfo, currentUser)
      wx.setStorageSync('userInfo', app.globalData.userInfo)
      this.setData({
        rainPushEnabled: !!currentUser.rainPushEnabled
      })
      wx.showToast({
        title: enabled ? '雨丝已开启' : '雨丝已关闭',
        icon: 'success'
      })
    }).catch((err) => {
      console.error('更新雨丝设置失败', err)
      this.setData({
        rainPushEnabled: !enabled
      })
      wx.showToast({
        title: (err && err.message) || '更新失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ rainUpdating: false })
    })
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      confirmColor: '#3A4A3F',
      success: (res) => {
        if (!res.confirm) return

        app.globalData.userInfo = null
        app.globalData.isLoggedIn = false
        app.globalData.authToken = ''
        app.globalData.authTokenExpireAt = 0
        wx.removeStorageSync('userInfo')
        wx.removeStorageSync('authToken')
        wx.removeStorageSync('authTokenExpireAt')
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          showManualLogin: false,
          tempAvatarUrl: '',
          tempNickname: '',
          rainPushEnabled: false
        })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  }
})
