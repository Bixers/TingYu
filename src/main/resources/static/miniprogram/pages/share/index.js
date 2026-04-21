const api = require('../../utils/api')
const cc = require('../../utils/chinese-convert')
const calendar = require('../../utils/calendar')

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
    name: '温金',
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
    currentTemplateName: '素纸',
    templates: TEMPLATES,
    saving: false,
    canvasReady: false,
    canvasStyleHeight: 750,
    calendarMode: false,
    calendarLabel: '',
    calendarExcerpt: '',
    calendarDateLabel: ''
  },

  onLoad(options) {
    this.mode = options.mode === 'calendar' ? 'calendar' : 'normal'
    if (options.id) {
      this.loadPoem(options.id)
    }
  },

  loadPoem(id) {
    wx.showLoading({ title: '加载中...' })
    const useT = getApp().globalData.useTraditional

    api.getPoemDetail(id).then((poem) => {
      const displayPoem = Object.assign({}, poem, {
        title: cc.convert(poem.title, useT),
        author: cc.convert(poem.author, useT),
        dynasty: cc.convert(poem.dynasty, useT)
      })

      const normalLines = api.parseContent(poem.content).map((line) => cc.convert(line, useT))
      const sentenceLines = api.parseSentences(poem.content).map((line) => cc.convert(line, useT))
      const lunarInfo = calendar.getLunarDateLabel(new Date())
      const calendarLabel = calendar.getPoemCalendarLabel(new Date())
      const calendarExcerpt = this.pickCalendarExcerpt(displayPoem, sentenceLines, normalLines)

      const canvasStyleHeight = this.mode === 'calendar'
        ? this.calcCalendarCanvasHeight(displayPoem, calendarExcerpt)
        : this.calcNormalCanvasHeight(normalLines)

      this.setData({
        poem: displayPoem,
        contentLines: normalLines,
        calendarMode: this.mode === 'calendar',
        calendarLabel: calendarLabel,
        calendarExcerpt: calendarExcerpt,
        calendarDateLabel: `${lunarInfo.yearLabel}${lunarInfo.monthLabel}${lunarInfo.dayLabel}`,
        currentTemplateName: TEMPLATES[0].name,
        canvasStyleHeight: canvasStyleHeight
      }, () => {
        this.initCanvas()
      })
    }).catch((err) => {
      console.error('加载分享页失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  pickCalendarExcerpt(poem, sentenceLines, normalLines) {
    const candidates = (sentenceLines || []).concat(normalLines || [])
    for (let i = 0; i < candidates.length; i++) {
      const line = String(candidates[i] || '').trim()
      if (line) {
        return line
      }
    }
    if (poem && poem.title) {
      return poem.title
    }
    return '今日宜听雨'
  },

  getCanvasMetrics() {
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth
    const canvasWidthPx = 560 / 750 * screenWidth
    return {
      screenWidth: screenWidth,
      canvasWidthPx: canvasWidthPx,
      contentWidthPx: canvasWidthPx - 100
    }
  },

  wrapText(ctx, text, maxWidth, maxLines) {
    const source = String(text || '').replace(/\s+/g, ' ').trim()
    if (!source) {
      return { lines: [''], truncated: false }
    }

    const chars = source.split('')
    const lines = []
    let current = ''
    let truncated = false

    const pushCurrent = () => {
      if (current) {
        lines.push(current)
        current = ''
      }
    }

    for (let i = 0; i < chars.length; i++) {
      const next = current + chars[i]
      if (ctx.measureText(next).width > maxWidth && current) {
        pushCurrent()
        current = chars[i]

        if (maxLines && lines.length >= maxLines) {
          truncated = true
          break
        }
      } else {
        current = next
      }
    }

    if (!truncated) {
      pushCurrent()
    }

    if (maxLines && lines.length > maxLines) {
      lines.length = maxLines
      truncated = true
    }

    if (truncated && lines.length > 0) {
      const lastIndex = lines.length - 1
      let last = lines[lastIndex]
      while (last && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1)
      }
      lines[lastIndex] = last ? `${last}…` : '…'
    }

    return {
      lines: lines.length ? lines : [''],
      truncated: truncated
    }
  },

  calcNormalCanvasHeight(contentLines) {
    const { screenWidth, contentWidthPx } = this.getCanvasMetrics()
    const lineFontSize = 17
    const lineHeight = 35
    let actualLines = 0

    for (let i = 0; i < contentLines.length; i++) {
      const text = String(contentLines[i] || '')
      const estimatedWidth = text.length * lineFontSize
      actualLines += estimatedWidth > contentWidthPx ? Math.ceil(estimatedWidth / contentWidthPx) : 1
    }

    const totalPx = 56 + 28 + 20 + 18 + 40 + actualLines * lineHeight + 110
    return Math.max(750, Math.ceil(totalPx / screenWidth * 750))
  },

  calcCalendarCanvasHeight(poem, excerpt) {
    const { screenWidth, contentWidthPx } = this.getCanvasMetrics()
    const titleFontSize = 28
    const excerptFontSize = 18
    const titleWidth = Math.max(120, contentWidthPx)
    const simulatedTitleLines = Math.max(1, Math.ceil((String(poem.title || '').length * titleFontSize) / titleWidth))
    const simulatedExcerptLines = Math.max(1, Math.min(4, Math.ceil((String(excerpt || '').length * excerptFontSize) / contentWidthPx)))

    const titleBlock = simulatedTitleLines * 38
    const excerptBlock = simulatedExcerptLines * 42
    const totalPx = 90 + titleBlock + 22 + 24 + 20 + excerptBlock + 108
    return Math.max(750, Math.ceil(totalPx / screenWidth * 750))
  },

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

  selectTemplate(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(index) || index < 0 || index >= TEMPLATES.length) {
      return
    }

    this.setData({
      currentTemplate: index,
      currentTemplateName: TEMPLATES[index].name
    }, () => {
      this.drawCard()
    })
  },

  drawBackground(ctx, template, w, h) {
    const pageBg = template.bgType === 'gradient'
      ? '#F0ECE5'
      : (template.bgColor === '#2A2A2A' ? '#1D1F20' : '#F2EEE8')
    ctx.fillStyle = pageBg
    ctx.fillRect(0, 0, w, h)
  },

  drawCardFrame(ctx, template, w, h) {
    const margin = 18
    const frameWidth = w - margin * 2
    const frameHeight = h - margin * 2

    if (template.bgType === 'gradient') {
      const gradient = ctx.createLinearGradient(margin, margin, margin, margin + frameHeight)
      gradient.addColorStop(0, template.bgColorStart)
      gradient.addColorStop(1, template.bgColorEnd)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = template.bgColor
    }

    ctx.fillRect(margin, margin, frameWidth, frameHeight)
    ctx.strokeStyle = template.borderColor || 'rgba(58, 74, 63, 0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(margin, margin, frameWidth, frameHeight)
  },

  drawCalendarCard(ctx, template, w, h, poem) {
    const paddingX = 56
    const maxWidth = w - paddingX * 2
    const titleFontSize = 28
    const badgeFontSize = 12
    const metaFontSize = 14
    const excerptFontSize = 18
    const footerFontSize = 11
    const excerptLineHeight = 44

    this.drawBackground(ctx, template, w, h)
    this.drawCardFrame(ctx, template, w, h)

    ctx.textAlign = 'center'

    ctx.fillStyle = template.metaColor
    ctx.font = `bold ${badgeFontSize}px sans-serif`
    ctx.fillText('今日诗历', w / 2, 92)

    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px serif`
    const titleLines = this.wrapText(ctx, poem.title, maxWidth, 2)
    const titleStartY = 148 - ((titleLines.lines.length - 1) * 18)
    titleLines.lines.forEach((line, index) => {
      ctx.fillText(line, w / 2, titleStartY + index * 38)
    })

    const titleBottomY = titleStartY + (titleLines.lines.length - 1) * 38

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(this.data.calendarDateLabel, w / 2, titleBottomY + 52)

    ctx.strokeStyle = template.borderColor || template.metaColor
    ctx.globalAlpha = 0.18
    ctx.beginPath()
    ctx.moveTo(w / 2 - 68, titleBottomY + 82)
    ctx.lineTo(w / 2 + 68, titleBottomY + 82)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = template.textColor
    ctx.font = `${excerptFontSize}px serif`
    const excerptLines = this.wrapText(ctx, this.data.calendarExcerpt, maxWidth, 4).lines
    const excerptStartY = titleBottomY + 124
    excerptLines.forEach((line, index) => {
      ctx.fillText(line, w / 2, excerptStartY + index * excerptLineHeight)
    })

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, h - 94)

    ctx.fillStyle = template.watermarkColor
    ctx.font = `${footerFontSize}px sans-serif`
    ctx.fillText('听雨眠舟', w / 2, h - 34)
  },

  drawNormalCard(ctx, template, w, h, poem, contentLines) {
    const paddingX = 50
    const contentW = w - paddingX * 2
    const titleFontSize = 24
    const metaFontSize = 13
    const lineFontSize = 17
    const lineHeight = 35
    const watermarkFontSize = 10

    ctx.font = `${lineFontSize}px serif`
    let actualLines = 0
    for (let i = 0; i < contentLines.length; i++) {
      const measured = ctx.measureText(String(contentLines[i] || '')).width
      actualLines += measured > contentW ? Math.ceil(measured / contentW) : 1
    }

    const totalContentHeight = titleFontSize + 18 + metaFontSize + 34 + actualLines * lineHeight + 58 + watermarkFontSize
    let startY = Math.max(66, (h - totalContentHeight) / 2)

    this.drawBackground(ctx, template, w, h)
    this.drawCardFrame(ctx, template, w, h)

    ctx.textAlign = 'center'
    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px serif`
    ctx.fillText(poem.title, w / 2, startY)
    startY += titleFontSize + 18

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, startY)
    startY += metaFontSize + 28

    ctx.strokeStyle = template.borderColor || template.metaColor
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.moveTo(w / 2 - 56, startY)
    ctx.lineTo(w / 2 + 56, startY)
    ctx.stroke()
    ctx.globalAlpha = 1
    startY += 34

    ctx.fillStyle = template.textColor
    ctx.font = `${lineFontSize}px serif`

    for (let i = 0; i < contentLines.length; i++) {
      const text = String(contentLines[i] || '')
      const wrapped = this.wrapText(ctx, text, contentW)
      for (let j = 0; j < wrapped.lines.length; j++) {
        ctx.fillText(wrapped.lines[j], w / 2, startY)
        startY += lineHeight
      }
    }

    const watermarkY = Math.max(startY + 40, h - 30)
    ctx.fillStyle = template.watermarkColor
    ctx.font = `${watermarkFontSize}px sans-serif`
    ctx.fillText('听雨眠舟', w / 2, watermarkY)
  },

  drawCard() {
    if (!this.ctx || !this.data.poem) return

    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight
    const template = TEMPLATES[this.data.currentTemplate] || TEMPLATES[0]
    const { poem, contentLines, calendarMode } = this.data

    ctx.clearRect(0, 0, w, h)

    if (calendarMode) {
      this.drawCalendarCard(ctx, template, w, h, poem)
    } else {
      this.drawNormalCard(ctx, template, w, h, poem, contentLines)
    }
  },

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
    const { poem, calendarMode } = this.data
    return poem ? {
      title: calendarMode
        ? `${poem.title} · 今日诗历`
        : `${poem.title} - ${poem.author} | 听雨眠舟`,
      path: calendarMode
        ? `/pages/share/index?id=${poem.id}&mode=calendar`
        : `/pages/detail/index?id=${poem.id}`
    } : {
      title: '听雨眠舟 - 春水碧于天，画船听雨眠',
      path: '/pages/index/index'
    }
  }
})
