// pages/share/index.js
const api = require('../../utils/api')

// 5款卡片模板配置
const TEMPLATES = [
  {
    name: '素纸',
    bgType: 'solid',
    bgColor: '#FDF8F0',
    titleColor: '#3A4A3F',
    textColor: '#3A4A3F',
    metaColor: '#7A8A7F',
    watermarkColor: '#D4B896',
    borderColor: '#E8E4DF',
    hasBorder: true
  },
  {
    name: '墨夜',
    bgType: 'solid',
    bgColor: '#2A2A2A',
    titleColor: '#E8E4DF',
    textColor: '#D8D4CF',
    metaColor: '#9A9690',
    watermarkColor: '#7A7670',
    borderColor: '',
    hasBorder: false
  },
  {
    name: '竹青',
    bgType: 'solid',
    bgColor: '#3A4A3F',
    titleColor: '#FDF8F0',
    textColor: '#E8E4DF',
    metaColor: '#B8C4BD',
    watermarkColor: '#7A8A7F',
    borderColor: '#4A5A4F',
    hasBorder: true
  },
  {
    name: '淡金',
    bgType: 'gradient',
    bgColorStart: '#F5F3F0',
    bgColorEnd: '#E8DCC8',
    titleColor: '#5A4A3F',
    textColor: '#5A4A3F',
    metaColor: '#8A7A6F',
    watermarkColor: '#D4B896',
    borderColor: '#D4B896',
    hasBorder: true
  },
  {
    name: '烟雨',
    bgType: 'gradient',
    bgColorStart: '#E8E4DF',
    bgColorEnd: '#C8CCC9',
    titleColor: '#3A4A3F',
    textColor: '#3A4A3F',
    metaColor: '#6A7A6F',
    watermarkColor: '#7A8A7F',
    borderColor: '',
    hasBorder: false
  }
]

Page({
  data: {
    poem: null,
    contentLines: [],
    currentTemplate: 0,
    templates: TEMPLATES,
    saving: false,
    canvasReady: false,
    canvasStyleHeight: 750
  },

  onLoad(options) {
    if (options.id) {
      this.loadPoem(options.id)
    }
  },

  loadPoem(id) {
    wx.showLoading({ title: '加载中...' })
    api.getPoemDetail(id).then(poem => {
      var contentLines = api.parseContent(poem.content)
      var canvasStyleHeight = this.calcCanvasHeight(contentLines)
      this.setData({ poem: poem, contentLines: contentLines, canvasStyleHeight: canvasStyleHeight }, () => {
        this.initCanvas()
      })
    }).catch(err => {
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  // 根据诗词行数计算Canvas所需高度(rpx)
  calcCanvasHeight: function(contentLines) {
    var sysInfo = wx.getSystemInfoSync()
    var screenWidth = sysInfo.windowWidth
    // Canvas宽度: 560rpx → CSS px
    var canvasWidthPx = 560 / 750 * screenWidth
    var paddingX = 50
    var contentW = canvasWidthPx - paddingX * 2

    var lineFontSize = 16
    var lineHeight = lineFontSize * 2.2

    // 估算实际渲染行数（中文字符宽度 ≈ fontSize）
    var actualLines = 0
    for (var i = 0; i < contentLines.length; i++) {
      var estimatedWidth = contentLines[i].length * lineFontSize
      actualLines += estimatedWidth > contentW ? Math.ceil(estimatedWidth / contentW) : 1
    }

    // 总高度(px): 上边距50 + 标题22 + 间距20 + meta12 + 间距36 + 正文 + 底部80
    var totalPx = 50 + 22 + 20 + 12 + 36 + actualLines * lineHeight + 80
    // 转换为rpx
    var heightRpx = Math.ceil(totalPx / screenWidth * 750)
    return Math.max(750, heightRpx)
  },

  // 初始化Canvas
  initCanvas() {
    setTimeout(() => {
      const query = wx.createSelectorQuery()
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res || !res[0]) {
          console.error('Canvas 节点未找到')
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const dpr = wx.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        this.canvas = canvas
        this.ctx = ctx
        this.canvasWidth = width
        this.canvasHeight = height
        this.setData({ canvasReady: true })
        this.drawCard()
      })
    }, 300)
  },

  // 选择模板
  selectTemplate(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTemplate: index }, () => {
      this.drawCard()
    })
  },

  // 绘制卡片
  drawCard() {
    if (!this.ctx || !this.data.poem) return

    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight
    const template = TEMPLATES[this.data.currentTemplate]
    const { poem, contentLines } = this.data

    // 清空画布
    ctx.clearRect(0, 0, w, h)

    // 绘制背景
    if (template.bgType === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, template.bgColorStart)
      gradient.addColorStop(1, template.bgColorEnd)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = template.bgColor
    }
    ctx.fillRect(0, 0, w, h)

    // 绘制边框
    if (template.hasBorder && template.borderColor) {
      ctx.strokeStyle = template.borderColor
      ctx.lineWidth = 1
      const margin = 20
      ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2)
    }

    // 内容区域参数
    const paddingX = 50
    const contentW = w - paddingX * 2

    // 字体尺寸
    const titleFontSize = 22
    const metaFontSize = 12
    const lineFontSize = 16
    const lineHeight = lineFontSize * 2.2
    const watermarkFontSize = 10

    // 字体声明：仅使用系统内置字体（无版权风险）
    const serifFont = 'serif'
    const sansFont = 'sans-serif'

    // 计算正文实际行数（考虑自动换行）
    ctx.font = `${lineFontSize}px ${serifFont}`
    let actualLines = 0
    for (const line of contentLines) {
      const measured = ctx.measureText(line).width
      actualLines += measured > contentW ? Math.ceil(measured / contentW) : 1
    }

    const totalContentHeight = titleFontSize + 20 + metaFontSize + 36 +
      actualLines * lineHeight + 50 + watermarkFontSize

    let startY = Math.max(50, (h - totalContentHeight) / 2)

    // 绘制标题
    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px ${serifFont}`
    ctx.textAlign = 'center'
    ctx.fillText(poem.title, w / 2, startY)
    startY += titleFontSize + 20

    // 绘制朝代·作者
    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px ${sansFont}`
    ctx.fillText(poem.dynasty + ' \u00B7 ' + poem.author, w / 2, startY)
    startY += metaFontSize + 36

    // 绘制正文
    ctx.fillStyle = template.textColor
    ctx.font = `${lineFontSize}px ${serifFont}`

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i]
      const measured = ctx.measureText(line).width
      if (measured > contentW) {
        // 自动换行
        const chars = line.split('')
        let currentLine = ''
        for (const char of chars) {
          const testLine = currentLine + char
          if (ctx.measureText(testLine).width > contentW) {
            ctx.fillText(currentLine, w / 2, startY)
            startY += lineHeight
            currentLine = char
          } else {
            currentLine = testLine
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, w / 2, startY)
          startY += lineHeight
        }
      } else {
        ctx.fillText(line, w / 2, startY)
        startY += lineHeight
      }
    }

    // 绘制底部水印
    const watermarkY = Math.max(startY + 40, h - 30)
    ctx.fillStyle = template.watermarkColor
    ctx.font = `${watermarkFontSize}px ${sansFont}`
    ctx.fillText('\u542C\u96E8\u7720\u821F', w / 2, watermarkY)
  },

  // 保存到相册
  saveToAlbum() {
    if (this.data.saving || !this.canvas) return
    this.setData({ saving: true })

    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限以保存图片',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
              this.setData({ saving: false })
            }
          })
          return
        }
        this.doSave()
      },
      fail: () => {
        this.doSave()
      }
    })
  },

  doSave() {
    wx.canvasToTempFilePath({
      canvas: this.canvas,
      fileType: 'png',
      quality: 1,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            if (err.errMsg && (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1)) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中开启相册写入权限',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) wx.openSetting()
                }
              })
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      },
      fail: () => {
        wx.showToast({ title: '生成图片失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ saving: false })
      }
    })
  },

  onShareAppMessage() {
    const { poem } = this.data
    return poem ? {
      title: poem.title + ' - ' + poem.author + ' | \u542C\u96E8\u7720\u821F',
      path: '/pages/detail/index?id=' + poem.id
    } : {
      title: '\u542C\u96E8\u7720\u821F - \u6625\u6C34\u78A7\u4E8E\u5929\uFF0C\u753B\u8239\u542C\u96E8\u7720',
      path: '/pages/index/index'
    }
  }
})
