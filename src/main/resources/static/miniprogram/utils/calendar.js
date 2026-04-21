const DAY_LABELS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

function formatChineseDay(dayValue) {
  const day = parseInt(dayValue, 10)
  if (isNaN(day) || day < 1 || day > DAY_LABELS.length) {
    return ''
  }
  return DAY_LABELS[day - 1]
}

function getChineseCalendarParts(date) {
  const target = date instanceof Date ? date : new Date(date || Date.now())
  const result = {
    relatedYear: '',
    yearName: '',
    month: '',
    day: ''
  }

  try {
    const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const parts = formatter.formatToParts(target)
    parts.forEach(function(part) {
      if (part.type === 'relatedYear') {
        result.relatedYear = part.value
      } else if (part.type === 'yearName') {
        result.yearName = part.value
      } else if (part.type === 'month') {
        result.month = part.value
      } else if (part.type === 'day') {
        result.day = part.value
      }
    })
  } catch (e) {
    result.month = `${target.getMonth() + 1}月`
    result.day = String(target.getDate())
  }

  return result
}

function getLunarDateLabel(date) {
  const parts = getChineseCalendarParts(date)
  const yearLabel = parts.yearName ? `${parts.yearName}年` : ''
  const monthLabel = parts.month || ''
  const dayLabel = formatChineseDay(parts.day)
  return {
    yearLabel: yearLabel,
    monthLabel: monthLabel,
    dayLabel: dayLabel,
    label: `${yearLabel}${monthLabel}${dayLabel}`.trim()
  }
}

function getPoemCalendarLabel(date) {
  const lunar = getLunarDateLabel(date)
  return `${lunar.label || ''}·宜听雨`
}

module.exports = {
  formatChineseDay,
  getChineseCalendarParts,
  getLunarDateLabel,
  getPoemCalendarLabel
}
