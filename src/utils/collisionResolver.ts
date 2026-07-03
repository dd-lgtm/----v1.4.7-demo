/**
 * 批注Card碰撞检测与自动避让布局引擎
 * 
 * 核心规则：
 * - 任意两个card外边框之间最小间距 ≥ MIN_GAP (4px)
 * - 仅向下推移被碰撞的card，不向上挤压
 * - 重排仅影响碰撞区域的card，无碰撞的保持原位
 */

export const MIN_GAP = 4

export interface CardRect {
  id: string
  top: number
  height: number
}

/**
 * 碰撞解决：给定一组card的自然位置和高度，返回无重叠的最终位置
 * 算法：按自然top排序，从上到下扫描，若当前card与上方card间距<MIN_GAP则向下推移
 * 
 * @param cards 所有card的自然位置和高度
 * @param changedId 触发重排的card ID（新增或编辑的card），
 *                  只有该card及其下方的card会被推移，上方的保持原位
 * @returns 每个card的id → 最终top位置映射
 */
export function resolveCardPositions(
  cards: CardRect[],
  changedId?: string
): Record<string, number> {
  if (cards.length === 0) return {}

  // 按自然top排序（从上到下）
  const sorted = [...cards].sort((a, b) => a.top - b.top)

  // 找到changedCard在排序后的索引
  const changedIdx = changedId
    ? sorted.findIndex(c => c.id === changedId)
    : -1

  // 从changedCard开始向下解决碰撞
  // changedCard上方的card保持原位不动
  const startIdx = changedIdx >= 0 ? changedIdx : 0

  for (let i = startIdx + 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const prevBottom = prev.top + prev.height
    const requiredTop = prevBottom + MIN_GAP

    if (curr.top < requiredTop) {
      curr.top = requiredTop
    }
  }

  // 构建结果映射
  const result: Record<string, number> = {}
  sorted.forEach(c => {
    result[c.id] = c.top
  })
  return result
}

/**
 * 矩形碰撞检测：判断两个矩形是否间距不足或重叠
 * 两个矩形横向、纵向间距同时小于MIN_GAP即判定碰撞
 */
export function isColliding(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
  gap: number = MIN_GAP
): boolean {
  const aRight = a.left + a.width
  const aBottom = a.top + a.height
  const bRight = b.left + b.width
  const bBottom = b.top + b.height

  // 横向间距
  const hGap = Math.max(0, Math.max(a.left - bRight, b.left - aRight))
  // 纵向间距
  const vGap = Math.max(0, Math.max(a.top - bBottom, b.top - aBottom))

  return hGap < gap && vGap < gap
}

/**
 * 新增批注场景：计算新card的无碰撞位置
 * 将新card插入已有card列表中，返回新card的最终top位置
 * 以及所有受影响card的新位置
 */
export function resolveNewCardPosition(
  existingCards: CardRect[],
  newCard: CardRect
): Record<string, number> {
  const allCards = [...existingCards, newCard]
  return resolveCardPositions(allCards, newCard.id)
}
