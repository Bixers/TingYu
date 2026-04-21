const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    showLoginForm: false,
    tempAvatarUrl: '',
    tempNickname: '',
    submitting: false
  },

  onShow() {
    this.syncProfile()
  },

  syncProfile() {
    const globalData = app.globalData
    this.setData({
      isLoggedIn: globalData.isLoggedIn,
      userInfo: globalData.userInfo
    })

    api.getUserProfile().then((user) => {
      if (!user) {
        app.globalData.userInfo = null
        app.globalData.isLoggedIn = false
        wx.removeStorageSync('userInfo')
        this.setData({
          isLoggedIn: false,
          userInfo: null
        })
        return
      }

      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      wx.setStorageSync('userInfo', user)
      this.setData({
        isLoggedIn: true,
        userInfo: user
      })
    }).catch(() => {
      this.setData({
        isLoggedIn: globalData.isLoggedIn,
        userInfo: globalData.userInfo
      })
    })
  },

  showLoginForm() {
    this.setData({
      showLoginForm: true,
      tempAvatarUrl: '',
      tempNickname: ''
    })
  },

  editProfile() {
    const userInfo = this.data.userInfo || {}
    this.setData({
      showLoginForm: true,
      tempAvatarUrl: userInfo.avatarUrl || '',
      tempNickname: userInfo.nickname || ''
    })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorite/index' })
  },

  hideLoginForm() {
    if (this.data.submitting) return
    this.setData({ showLoginForm: false })
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

  submitLogin() {
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
        nickname,
        avatarUrl: uploadedAvatarUrl
      })
    }).then((user) => {
      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      wx.setStorageSync('userInfo', user)

      this.setData({
        isLoggedIn: true,
        userInfo: user,
        showLoginForm: false,
        submitting: false
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch((err) => {
      console.error('登录失败', err)
      this.setData({ submitting: false })
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
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
        wx.removeStorageSync('userInfo')
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          showLoginForm: false,
          tempAvatarUrl: '',
          tempNickname: ''
        })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  }
})
