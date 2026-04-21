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
      const normalLines = api.parseContent(poem.content).map(function(line) {
        return cc.convert(line, useT)
      })
      const sentenceLines = api.parseSentences(poem.content).map(function(line) {
        return cc.convert(line, useT)
      })
      const calendarInfo = calendar.getLunarDateLabel(new Date())
      const calendarLabel = calendar.getPoemCalendarLabel(new Date())
      const calendarExcerpt = this.pickCalendarExcerpt(displayPoem, sentenceLines, normalLines)
      const canvasStyleHeight = this.mode === 'calendar'
        ? 640
        : this.calcCanvasHeight(normalLines)

      this.setData({
        poem: displayPoem,
        contentLines: normalLines,
        calendarMode: this.mode === 'calendar',
        calendarLabel: calendarLabel,
        calendarExcerpt: calendarExcerpt,
        calendarDateLabel: `${calendarInfo.yearLabel}${calendarInfo.monthLabel}${calendarInfo.dayLabel}`,
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
      const line = (candidates[i] || '').trim()
      if (line) {
        return line
      }
    }
    if (poem && poem.title) {
      return poem.title
    }
    return '今日宜听雨'
  },

  calcCanvasHeight(contentLines) {
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth
    const canvasWidthPx = 560 / 750 * screenWidth
    const paddingX = 50
    const contentW = canvasWidthPx - paddingX * 2
    const lineFontSize = 16
    const lineHeight = lineFontSize * 2.2

    let actualLines = 0
    for (let i = 0; i < contentLines.length; i++) {
      const estimatedWidth = contentLines[i].length * lineFontSize
      actualLines += estimatedWidth > contentW ? Math.ceil(estimatedWidth / contentW) : 1
    }

    const totalPx = 50 + 22 + 20 + 12 + 36 + actualLines * lineHeight + 80
    const heightRpx = Math.ceil(totalPx / screenWidth * 750)
    return Math.max(750, heightRpx)
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
    const index = e.currentTarget.dataset.index
    this.setData({ currentTemplate: index }, () => {
      this.drawCard()
    })
  },

  drawBackground(ctx, template, w, h) {
    if (template.bgType === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, template.bgColorStart)
      gradient.addColorStop(1, template.bgColorEnd)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = template.bgColor
    }
    ctx.fillRect(0, 0, w, h)
  },

  drawBorder(ctx, template, w, h) {
    if (template.hasBorder && template.borderColor) {
      ctx.strokeStyle = template.borderColor
      ctx.lineWidth = 1
      const margin = 20
      ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2)
    }
  },

  wrapLines(ctx, text, maxWidth) {
    const chars = String(text || '').split('')
    const lines = []
    let currentLine = ''

    for (let i = 0; i < chars.length; i++) {
      const testLine = currentLine + chars[i]
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = chars[i]
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align) {
    const lines = this.wrapLines(ctx, text, maxWidth)
    ctx.textAlign = align || 'center'
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight)
    })
    return lines.length
  },

  drawCalendarCard(ctx, template, w, h, poem) {
    const paddingX = 56
    const maxWidth = w - paddingX * 2
    const titleFontSize = 24
    const badgeFontSize = 12
    const metaFontSize = 13
    const excerptFontSize = 17
    const footerFontSize = 10

    this.drawBackground(ctx, template, w, h)
    this.drawBorder(ctx, template, w, h)

    ctx.textAlign = 'center'

    ctx.fillStyle = template.metaColor
    ctx.font = `bold ${badgeFontSize}px sans-serif`
    ctx.fillText('今日诗历', w / 2, 90)

    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px serif`
    this.drawWrappedText(ctx, poem.title, w / 2, 140, maxWidth, 30, 'center')

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(this.data.calendarDateLabel, w / 2, 192)

    ctx.fillStyle = template.textColor
    ctx.font = `${excerptFontSize}px serif`
    const excerptLines = this.wrapLines(ctx, this.data.calendarExcerpt, maxWidth)
    const excerptStartY = 250
    excerptLines.slice(0, 4).forEach((line, index) => {
      ctx.fillText(line, w / 2, excerptStartY + index * 40)
    })

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, h - 100)

    ctx.fillStyle = template.watermarkColor
    ctx.font = `${footerFontSize}px sans-serif`
    ctx.fillText('听雨眠舟', w / 2, h - 34)
  },

  drawNormalCard(ctx, template, w, h, poem, contentLines) {
    const paddingX = 50
    const contentW = w - paddingX * 2
    const titleFontSize = 22
    const metaFontSize = 12
    const lineFontSize = 16
    const lineHeight = lineFontSize * 2.2
    const watermarkFontSize = 10
    const serifFont = 'serif'
    const sansFont = 'sans-serif'

    ctx.font = `${lineFontSize}px ${serifFont}`
    let actualLines = 0
    for (const line of contentLines) {
      const measured = ctx.measureText(line).width
      actualLines += measured > contentW ? Math.ceil(measured / contentW) : 1
    }

    const totalContentHeight = titleFontSize + 20 + metaFontSize + 36 +
      actualLines * lineHeight + 50 + watermarkFontSize
    let startY = Math.max(50, (h - totalContentHeight) / 2)

    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px ${serifFont}`
    ctx.textAlign = 'center'
    ctx.fillText(poem.title, w / 2, startY)
    startY += titleFontSize + 20

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px ${sansFont}`
    ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, startY)
    startY += metaFontSize + 36

    ctx.fillStyle = template.textColor
    ctx.font = `${lineFontSize}px ${serifFont}`

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i]
      const measured = ctx.measureText(line).width
      if (measured > contentW) {
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

    const watermarkY = Math.max(startY + 40, h - 30)
    ctx.fillStyle = template.watermarkColor
    ctx.font = `${watermarkFontSize}px ${sansFont}`
    ctx.fillText('听雨眠舟', w / 2, watermarkY)
  },

  calcCanvasHeight(contentLines) {
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth
    const canvasWidthPx = 560 / 750 * screenWidth
    const paddingX = 50
    const contentW = canvasWidthPx - paddingX * 2
    const lineFontSize = 16
    const lineHeight = lineFontSize * 2.1

    let actualLines = 0
    for (let i = 0; i < contentLines.length; i++) {
      const estimatedWidth = contentLines[i].length * lineFontSize
      actualLines += estimatedWidth > contentW ? Math.ceil(estimatedWidth / contentW) : 1
    }

    const totalPx = 56 + 28 + 24 + 12 + 40 + actualLines * lineHeight + 96
    const heightRpx = Math.ceil(totalPx / screenWidth * 750)
    return Math.max(750, heightRpx)
  },

  drawCalendarCard(ctx, template, w, h, poem) {
    const paddingX = 56
    const maxWidth = w - paddingX * 2
    const titleFontSize = 28
    const badgeFontSize = 12
    const metaFontSize = 14
    const excerptFontSize = 18
    const footerFontSize = 11

    this.drawBackground(ctx, template, w, h)
    this.drawBorder(ctx, template, w, h)

    ctx.textAlign = 'center'

    ctx.fillStyle = template.metaColor
    ctx.font = `bold ${badgeFontSize}px sans-serif`
    ctx.fillText('今日诗历', w / 2, 92)

    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px serif`
    this.drawWrappedText(ctx, poem.title, w / 2, 146, maxWidth, 36, 'center')

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px sans-serif`
    ctx.fillText(this.data.calendarDateLabel, w / 2, 204)

    ctx.strokeStyle = template.borderColor || template.metaColor
    ctx.globalAlpha = 0.18
    ctx.beginPath()
    ctx.moveTo(w / 2 - 68, 230)
    ctx.lineTo(w / 2 + 68, 230)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = template.textColor
    ctx.font = `${excerptFontSize}px serif`
    const excerptLines = this.wrapLines(ctx, this.data.calendarExcerpt, maxWidth)
    const excerptStartY = 278
    excerptLines.slice(0, 4).forEach((line, index) => {
      ctx.fillText(line, w / 2, excerptStartY + index * 42)
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
    const lineHeight = lineFontSize * 2.05
    const watermarkFontSize = 10
    const serifFont = 'serif'
    const sansFont = 'sans-serif'

    ctx.font = `${lineFontSize}px ${serifFont}`
    let actualLines = 0
    for (const line of contentLines) {
      const measured = ctx.measureText(line).width
      actualLines += measured > contentW ? Math.ceil(measured / contentW) : 1
    }

    const totalContentHeight = titleFontSize + 18 + metaFontSize + 34 +
      actualLines * lineHeight + 58 + watermarkFontSize
    let startY = Math.max(66, (h - totalContentHeight) / 2)

    ctx.fillStyle = template.titleColor
    ctx.font = `bold ${titleFontSize}px ${serifFont}`
    ctx.textAlign = 'center'
    ctx.fillText(poem.title, w / 2, startY)
    startY += titleFontSize + 18

    ctx.fillStyle = template.metaColor
    ctx.font = `${metaFontSize}px ${sansFont}`
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
    ctx.font = `${lineFontSize}px ${serifFont}`

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i]
      const measured = ctx.measureText(line).width
      if (measured > contentW) {
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

    const watermarkY = Math.max(startY + 40, h - 30)
    ctx.fillStyle = template.watermarkColor
    ctx.font = `${watermarkFontSize}px ${sansFont}`
    ctx.fillText('听雨眠舟', w / 2, watermarkY)
  },

  drawCard() {
    if (!this.ctx || !this.data.poem) return

    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight
    const template = TEMPLATES[this.data.currentTemplate]
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
