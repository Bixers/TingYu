App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'prod-4gnit1gx2a365651',
        traceUser: true
      })
    }

    // 读取繁简偏好（默认简体）
    var useTraditional = wx.getStorageSync('useTraditional')
    this.globalData.useTraditional = useTraditional === true
  },

  globalData: {
    userInfo: null,
    // 云托管服务名称
    serviceName: 'springboot-84kb',
    // 标签跳转中转
    pendingTag: '',
    // 繁简偏好：false=简体(默认), true=繁体
    useTraditional: false
  }
})
