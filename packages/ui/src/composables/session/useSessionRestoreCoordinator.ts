import { ref } from 'vue'

/**
 * Session 恢复协调器 Composable
 *
 * 负责协调 session 恢复流程，处理：
 * - 并发恢复控制（互斥锁）
 * - 恢复请求重试（pendingRestore）
 * - 组件卸载后的清理（isUnmounted）
 *
 * 设计原则：
 * - 只处理恢复协调逻辑，不涉及具体的恢复实现
 * - 具体恢复函数由调用方提供
 * - 最小侵入性，降低回归风险
 *
 * @param restoreFn 具体的恢复函数（由调用方提供）
 */
export function useSessionRestoreCoordinator(restoreFn: () => Promise<void> | void) {
  // 🔧 Codex 修复：互斥锁，防止并发调用 restoreSessionToUI()
  const isRestoring = ref(false)
  // 🔧 Codex 修复：待处理恢复标志，防止恢复请求丢失
  // 当 isRestoring=true 时如果有新请求，设置此标志，锁释放后会补跑
  const pendingRestore = ref(false)
  // 🔧 Codex 修复：组件卸载标志，避免卸载后 microtask 仍执行恢复
  const isUnmounted = ref(false)

  /**
   * 执行恢复（带协调逻辑）
   *
   * 功能：
   * 1. 互斥控制：同时只允许一个恢复操作执行
   * 2. 请求重试：如果恢复期间有新请求，会在当前恢复完成后补跑
   * 3. 卸载检查：组件卸载后不再执行恢复
   */
  const executeRestore = async () => {
    // 🔧 互斥检查：如果正在恢复中，设置 pending 标志后返回
    if (isRestoring.value) {
      console.warn('[SessionRestoreCoordinator] executeRestore is already running; setting the pendingRestore flag')
      pendingRestore.value = true
      return
    }

    isRestoring.value = true
    try {
      // 执行具体的恢复逻辑（由调用方提供）
      await restoreFn()
    } catch (error) {
      // 🔧 修复：添加错误处理，避免未处理的 Promise rejection 传播到 Vue watcher
      console.error('[SessionRestoreCoordinator] restore failed', error)
    } finally {
      // 🔧 无论成功或失败，都要释放锁
      isRestoring.value = false

      // 🔧 Codex 修复：如果在恢复期间有新请求，补跑一次
      // 🔧 Codex 建议：使用 queueMicrotask 异步排队，避免递归压力（而非 await 递归）
      if (pendingRestore.value) {
        pendingRestore.value = false
        console.log('[SessionRestoreCoordinator] Detected pendingRestore; queueing another restore asynchronously')
        queueMicrotask(() => {
          // 🔧 Codex 修复：组件卸载后跳过恢复，避免无意义工作/日志噪声
          if (isUnmounted.value) {
            console.log('[SessionRestoreCoordinator] Component is unmounted; skipping the pending restore')
            return
          }
          // 🔧 Codex 修复：添加错误处理，避免未处理的 Promise rejection
          void executeRestore().catch(err => {
            console.error('[SessionRestoreCoordinator] pending restore failed', err)
          })
        })
      }
    }
  }

  /**
   * 标记组件已卸载
   * 应在组件 onBeforeUnmount 中调用
   */
  const markUnmounted = () => {
    isUnmounted.value = true
  }

  return {
    // 状态
    isRestoring,
    pendingRestore,
    isUnmounted,

    // 方法
    executeRestore,
    markUnmounted
  }
}
