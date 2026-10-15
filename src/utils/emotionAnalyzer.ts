import type { Expression } from '../store/useAppStore'

const emotionRules: { keywords: RegExp[]; expression: Expression }[] = [
  {
    keywords: [/晚安|困了|好困|睡了|睡觉|该休息|困倦|好累啊|熬夜/],
    expression: 'sleepy',
  },
  {
    keywords: [/崩溃|受不了|要疯了|太多|做不完|ddl|deadline|赶不完|忙不过来|顶不住/],
    expression: 'overwhelmed',
  },
  {
    keywords: [/感动|好暖|泪目|呜呜|好温柔|好贴心|好治愈|破防了/],
    expression: 'touched',
  },
  {
    keywords: [/开心|好耶|谢谢|喜欢|哈哈|太好了|真棒|太棒|有趣|好玩|可爱|好看|好听/],
    expression: 'happy',
  },
  {
    keywords: [/焦虑|压力|难过|担心|哭|伤心|郁闷|烦躁|疲惫|孤独|迷茫|害怕/],
    expression: 'shy',
  },
  {
    keywords: [/加油|冲|一定行|必胜|上岸|拿下|冲冲冲|拼了|奥利给/],
    expression: 'cheer',
  },
  {
    keywords: [/学习|看书|论文|上课|读书|备考|复习|写作业|自习|背书/],
    expression: 'studying',
  },
  {
    keywords: [/为什么|怎么|如何|\?|？|好奇|咦|诶|哎\?/],
    expression: 'surprised',
  },
  {
    keywords: [/分析|理论|社会学|哲学|马克思|韦伯|涂尔干|社会结构|深层|本质|存在主义/],
    expression: 'thinking',
  },
  {
    keywords: [/加油|努力|支持|你一定|你可以|相信你|没问题的|坚持|很棒|做得好/],
    expression: 'encouraging',
  },
]

const aiEmotionRules: { keywords: RegExp[]; expression: Expression }[] = [
  {
    keywords: [/晚安|该休息|早点睡|不早了|明天见|好好休息|做个好梦/],
    expression: 'sleepy',
  },
  {
    keywords: [/太多|信息量|天哪|崩溃|做不完|忙不过|头大/],
    expression: 'overwhelmed',
  },
  {
    keywords: [/感动|好暖|谢谢你这么|泪目|呜呜|破防|好贴心|温暖/],
    expression: 'touched',
  },
  {
    keywords: [/嗯嗯|我在听|慢慢说|然后呢|继续说|原来如此|我明白了|听你说/],
    expression: 'listening',
  },
  {
    keywords: [/加油|冲|一定行|必胜|上岸|拿下|你可以的|拼了/],
    expression: 'cheer',
  },
  {
    keywords: [/从社会学角度|根据.*理论|让我分析|深层原因|社会结构|存在主义|社会学认为/],
    expression: 'thinking',
  },
  {
    keywords: [/学习|看书|论文|备考|复习|读书|自习|课程|上课/],
    expression: 'studying',
  },
  {
    keywords: [/欢迎|你好|初次见面|很高兴认识|来啦|好久不见/],
    expression: 'happy',
  },
  {
    keywords: [/恋爱|喜欢谁|暗恋|喜欢的人|害羞|心跳/],
    expression: 'shy',
  },
  {
    keywords: [/咦|诶|真的吗|没想到|居然|什么\?|原来是这样|好奇/],
    expression: 'surprised',
  },
  {
    keywords: [/开心|太好|哈哈|有趣|感谢|谢谢|喜欢|可爱/],
    expression: 'happy',
  },
  {
    keywords: [/加油|你可以|相信|没问题的|坚持|很棒|做得好|支持你|我在这里|我会陪你/],
    expression: 'encouraging',
  },
  {
    keywords: [/深入思考|哲学|存在|意义|本质|人生|马克思|韦伯|涂尔干/],
    expression: 'sage',
  },
]

function matchExpression(
  text: string,
  rules: { keywords: RegExp[]; expression: Expression }[]
): Expression | null {
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (kw.test(text)) return rule.expression
    }
  }
  return null
}

export function analyzeUserEmotion(text: string): Expression | null {
  return matchExpression(text, emotionRules)
}

export function analyzeAIEmotion(text: string): Expression | null {
  return matchExpression(text, aiEmotionRules)
}

export function analyzeCombinedEmotion(
  userText: string | null,
  aiText: string | null
): Expression {
  if (aiText) {
    const aiEmotion = analyzeAIEmotion(aiText)
    if (aiEmotion) return aiEmotion
  }
  if (userText) {
    const userEmotion = analyzeUserEmotion(userText)
    if (userEmotion) return userEmotion
  }
  return 'default'
}
