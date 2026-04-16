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
  },

  globalData: {
    userInfo: null,
    // 云托管服务名称
    serviceName: 'springboot-84kb',
    // 标签跳转中转
    pendingTag: ''
  }
})
