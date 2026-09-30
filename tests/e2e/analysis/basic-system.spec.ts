import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import {
  fillOriginalPrompt,
  clickAnalyzeButton,
  getEvaluationScore,
  closeEvaluationPanelIfOpen,
  verifyAnalyzeButtonDisabledWhenEmpty,
  getWorkspace,
} from '../helpers/analysis'
import {
  expectPromptVersionTagVisible,
} from '../helpers/evaluation'
import {
  clickOptimizeButton,
  expectOptimizedResultNotEmpty,
  expectOutputByTestIdNotEmpty,
  readOutputByTestIdText,
} from '../helpers/optimize'

/**
 * Basic System 模式 - 提示词分析测试
 *
 * ✨ 最佳范式示例：
 * - 使用 data-testid 精确定位，不依赖文本内容
 * - 容器隔离：通过 data-mode 区分不同工作区
 * - 类型安全：使用 TypeScript 类型定义
 *
 * 功能：分析系统提示词并显示评估分数
 *
 * 前提：
 * - .env.local 已配置 API keys
 * - 实际调用 LLM API（会产生费用）
 *
 * 测试流程：
 * 1. 导航到 basic-system 工作区
 * 2. 填写提示词
 * 3. 点击"分析"按钮
 * 4. 等待 LLM 响应
 * 5. 验证评估结果和分数显示
 */

const MODE = 'basic-system' as const

test.describe('Basic System - 提示词分析', () => {
  test('分析提示词并显示评估结果', async ({ page }) => {
    test.setTimeout(180000) // 3分钟超时

    // 1. 导航到 basic-system 工作区
    await navigateToMode(page, 'basic', 'system')

    // 2. 等待服务和组件完全初始化（包括 watch、computed 等）

    // 3. 填写提示词（使用 data-testid 定位）
    const testPrompt = '写一个排序算法'
    await fillOriginalPrompt(page, MODE, testPrompt)

    // 4. 点击分析按钮（使用 data-testid 定位）
    await clickAnalyzeButton(page, MODE)

    // 5. 验证评估分数（使用 data-testid 定位）
    const score = await getEvaluationScore(page, MODE)
  })

  test('验证分析按钮在没有提示词时禁用', async ({ page }) => {
    await navigateToMode(page, 'basic', 'system')

    // 分析按钮应该在没有输入时禁用
    await verifyAnalyzeButtonDisabledWhenEmpty(page, MODE)
  })

  test('分析后右侧 workspace 测试应切换到新的 V0 而不是继续沿用旧链', async ({ page }) => {
    test.setTimeout(240000)

    const oldToken = 'OLDQ7'
    const newToken = 'NEWV0'

    await navigateToMode(page, 'basic', 'system')

    await fillOriginalPrompt(page, MODE, `无论用户输入什么，你都只输出 ${oldToken}`)
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    await fillOriginalPrompt(page, MODE, `无论用户输入什么，你都只输出 ${newToken}`)
    await clickAnalyzeButton(page, MODE)
    await getEvaluationScore(page, MODE, 'prompt-only')
    await closeEvaluationPanelIfOpen(page)

    const testInput = page.getByTestId('basic-system-test-input').locator('textarea')
    await testInput.fill('随便说点什么都可以')

    const workspace = getWorkspace(page, MODE)
    await workspace.locator('[data-testid="basic-system-test-run-b"]').click()
    await expectOutputByTestIdNotEmpty(page, 'basic-system-test-optimized-output')

    const output = await readOutputByTestIdText(page, 'basic-system-test-optimized-output')
    expect(output).toContain(newToken)
    expect(output).not.toContain(oldToken)
  })

  test('点击 V0 后重新分析应回到 prompt-only，而不是沿用旧版本的 iterate 状态', async ({ page }) => {
    test.setTimeout(360000)

    await navigateToMode(page, 'basic', 'system')

    await fillOriginalPrompt(page, MODE, '你是一个系统提示词优化助手，请把用户请求改写得更清晰。')
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    const workspace = getWorkspace(page, MODE)
    await workspace.getByTestId('prompt-panel-continue-optimize').click()
    const iterateModal = page.getByTestId('prompt-panel-iterate-modal')
    await expect(iterateModal).toBeVisible({ timeout: 15000 })
    await iterateModal.getByTestId('prompt-panel-iterate-input').locator('textarea').fill(
      '请进一步强化输出格式约束，并补充关键注意事项。'
    )
    await iterateModal.getByTestId('prompt-panel-iterate-submit').click()

    await expectPromptVersionTagVisible(page, 2)
    await expectPromptVersionTagVisible(page, 1)
    const focusAnalyzeGroup = workspace.locator('.evaluation-entry .focus-analyze-group')
    await expect(focusAnalyzeGroup).toBeVisible({ timeout: 15000 })
    await expect(focusAnalyzeGroup).toHaveAttribute('data-evaluation-type', 'prompt-iterate')

    await workspace.locator('[data-testid="prompt-panel-version-tag-v0"]').click()
    await page.mouse.move(10, 10)

    await expect(focusAnalyzeGroup).toHaveAttribute('data-evaluation-type', 'prompt-only', {
      timeout: 15000,
    })
  })
})
