const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
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

  authorizeLogin() {
    if (this.data.submitting) return

    this.setData({ submitting: true })

    wx.getUserProfile({
      desc: '用于完成小程序登录',
      success: (res) => {
        const wxUserInfo = res.userInfo || {}
        const nickname = (wxUserInfo.nickName || '').trim()

        if (!nickname) {
          this.setData({ submitting: false })
          wx.showToast({ title: '未获取到微信昵称', icon: 'none' })
          return
        }

        this.uploadAvatar(wxUserInfo.avatarUrl).then((avatarUrl) => {
          return api.registerUser({
            nickname,
            avatarUrl
          })
        }).then((user) => {
          app.globalData.userInfo = user
          app.globalData.isLoggedIn = true
          wx.setStorageSync('userInfo', user)

          this.setData({
            isLoggedIn: true,
            userInfo: user,
            submitting: false
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
        }).catch((err) => {
          console.error('登录失败', err)
          this.setData({ submitting: false })
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
        })
      },
      fail: (err) => {
        console.warn('用户取消授权或授权失败', err)
        this.setData({ submitting: false })
        if (err && err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          wx.showToast({ title: '你已取消微信授权', icon: 'none' })
          return
        }
        wx.showToast({ title: '暂时无法获取微信资料', icon: 'none' })
      }
    })
  },

  editProfile() {
    this.authorizeLogin()
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
          userInfo: null
        })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  }
})
