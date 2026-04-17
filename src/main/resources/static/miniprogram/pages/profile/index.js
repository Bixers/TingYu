// pages/profile/index.js
const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    showLoginPopup: false,
    tempAvatarUrl: '',
    tempNickname: '',
    submitting: false
  },

  onShow() {
    // 同步全局登录状态
    var globalData = app.globalData
    this.setData({
      isLoggedIn: globalData.isLoggedIn,
      userInfo: globalData.userInfo
    })
  },

  // 显示登录弹窗
  showLogin() {
    this.setData({
      showLoginPopup: true,
      tempAvatarUrl: '',
      tempNickname: ''
    })
  },

  // 隐藏登录弹窗
  hideLogin() {
    if (this.data.submitting) return
    this.setData({ showLoginPopup: false })
  },

  // 选择头像回调
  onChooseAvatar(e) {
    var url = e.detail.avatarUrl
    if (url) {
      this.setData({ tempAvatarUrl: url })
    }
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  // 确认登录
  confirmLogin() {
    var that = this
    var nickname = this.data.tempNickname.trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })

    var avatarTempUrl = this.data.tempAvatarUrl

    // 如果选了头像，先上传到云存储
    var uploadPromise
    if (avatarTempUrl) {
      uploadPromise = new Promise(function(resolve, reject) {
        var ext = avatarTempUrl.split('.').pop() || 'png'
        var cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarTempUrl,
          success: function(res) { resolve(res.fileID) },
          fail: function(err) {
            console.error('头像上传失败', err)
            resolve('')
          }
        })
      })
    } else {
      uploadPromise = Promise.resolve('')
    }

    uploadPromise.then(function(avatarUrl) {
      return api.registerUser({
        nickname: nickname,
        avatarUrl: avatarUrl
      })
    }).then(function(user) {
      // 保存到全局和本地缓存
      app.globalData.userInfo = user
      app.globalData.isLoggedIn = true
      wx.setStorageSync('userInfo', user)

      that.setData({
        isLoggedIn: true,
        userInfo: user,
        showLoginPopup: false,
        submitting: false
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(function(err) {
      console.error('注册失败', err)
      that.setData({ submitting: false })
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    })
  },

  // 修改资料（复用登录弹窗）
  editProfile() {
    var userInfo = this.data.userInfo
    this.setData({
      showLoginPopup: true,
      tempAvatarUrl: userInfo ? userInfo.avatarUrl : '',
      tempNickname: userInfo ? userInfo.nickname : ''
    })
  },

  // 退出登录
  logout() {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      confirmColor: '#3A4A3F',
      success: function(res) {
        if (res.confirm) {
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          wx.removeStorageSync('userInfo')
          that.setData({
            isLoggedIn: false,
            userInfo: null
          })
          wx.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  }
})
