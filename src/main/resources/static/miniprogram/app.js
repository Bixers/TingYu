App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'prod-4gnit1gx2a365651',
        traceUser: true
      })
    }

    const useTraditional = wx.getStorageSync('useTraditional')
    this.globalData.useTraditional = useTraditional === true

    const token = wx.getStorageSync('authToken')
    const expireAt = Number(wx.getStorageSync('authTokenExpireAt') || 0)
    const now = Date.now()
    const userInfo = wx.getStorageSync('userInfo')
    if (token && expireAt > now) {
      this.globalData.authToken = token
      this.globalData.authTokenExpireAt = expireAt
      this.globalData.userInfo = userInfo || null
      this.globalData.isLoggedIn = true
    } else {
      wx.removeStorageSync('authToken')
      wx.removeStorageSync('authTokenExpireAt')
      wx.removeStorageSync('userInfo')
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
      this.globalData.authToken = ''
      this.globalData.authTokenExpireAt = 0
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    authToken: '',
    authTokenExpireAt: 0,
    serviceName: 'springboot-84kb',
    dailyRainTemplateId: '',
    pendingTag: '',
    useTraditional: false
  }
})
