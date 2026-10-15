export type SceneMode = 'auto' | 'daily' | 'orientation' | 'exam' | 'graduation'

const SCENE_PROMPTS: Record<Exclude<SceneMode, 'auto'>, string> = {
  daily: '\n\n[场景提示] 这是日常陪伴场景：简洁、自然地回答，并在需要时给出下一步。',
  orientation: '\n\n[场景提示] 这是入门引导场景：解释概念和流程时分步骤说明，但不要编造机构规则。',
  exam: '\n\n[场景提示] 这是学习与备考场景：优先帮助拆解任务、澄清概念和安排可执行的小步骤。',
  graduation: '\n\n[场景提示] 这是阶段转换场景：关注总结、选择和下一步计划，不替用户做重大决定。',
}

export function getScenePrompt(requestedMode: string): string {
  if (requestedMode === 'auto') return ''
  return SCENE_PROMPTS[requestedMode as Exclude<SceneMode, 'auto'>] || SCENE_PROMPTS.daily
}
