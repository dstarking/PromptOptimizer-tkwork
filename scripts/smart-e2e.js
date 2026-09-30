#!/usr/bin/env node
/**
 * 智能 E2E 测试运行器
 *
 * 使用 VCR auto 模式：每个测试独立检查自己的 fixture
 * - fixture 存在 → 回放（快速）
 * - fixture 不存在 → 录制（自动创建）
 *
 * 使用：
 * node scripts/smart-e2e.js
 */

const { runGroup } = require('./run-e2e-group')

/**
 * 主函数
 */
function main() {
  console.log('\n🎬 使用 VCR auto 模式运行扩展 E2E 测试')
  console.log('   - 默认只跑 extended 套件，避免把全部 Playwright 用例都挂到日常链路上')
  console.log('   - 有 fixture 的测试：回放')
  console.log('   - 无 fixture 的测试：录制\n')

  process.exit(runGroup('extended', process.argv.slice(2)))
}

main()
