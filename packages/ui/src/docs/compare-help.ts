export const compareHelpContent = {
  'zh-CN': `# 对比评估说明

## 1. 什么是对比评估

对比评估会把多列测试结果放在一起看，帮助你回答三个问题：

- 优化目标相比上一版，是进步还是退步。
- 优化目标和教师输出相比，还差在哪里。
- 这次改动是可复用的优化，还是只对当前样例有效。

## 2. 这些角色分别是什么意思

### 优化目标
你现在真正想优化、想判断是否变好的那一列。

### 上一版
相对于当前工作区动态解析出来的上一版，用来判断这次改写有没有带来真实进步。

它不是固定等于“倒数第二个保存版本”，而是会随着工作区变化：

- 如果工作区在 \`v3\` 基础上有未保存修改，上一版通常指向 \`v3\`。
- 如果工作区当前就是保存好的 \`v3\`，上一版通常指向 \`v2\`。
- 如果目前只有原始版本，那么上一版会回退到原始版本。
- 如果上一版当前和工作区内容相同，在对比评估里通常会作为复测/稳定性证据看待。

### 教师
另一列更值得学习的输出，通常是更强模型或更稳定的结果。

### 复测
用于检查同一类改动是否稳定，不只是偶然在当前样例上看起来更好。

## 3. 常见配置示例

### 两列
- A：优化目标
- B：上一版

适合先判断“这次改写值不值得保留”。

### 三列
- A：优化目标
- B：上一版
- C：教师

适合同时判断“有没有进步”以及“还能向谁学习”。

### 四列
- A：优化目标
- B：上一版
- C：教师
- D：复测

适合进一步检查当前结论是不是稳定，避免只对当前样例过拟合。

## 4. 结果怎么看

### 迭代建议
你会先看到这轮更适合继续改、可以先停，还是需要人工确认。

### 角色对应
会直接显示每个测试槽位当前承担什么角色，例如：

- 优化目标 [A]
- 上一版 [B]
- 教师 [C]

这样你可以马上知道系统是在拿哪几列做判断。

### 关键原因
把最重要的比较结论拆成几块：上一版、教师、稳定性。默认只展示最关键的一块，其他块按需切换查看。

### 关键信号
像“上一版：有进步”“教师差距：差距明显”“过拟合：中等”这样的标签，是系统先压缩出来的判断摘要，方便你快速决定要不要继续改。

### 高级细节
如果你想看更完整的比较对象、模式或其他辅助信息，再看高级细节即可。

## 5. 什么时候该点改写

- 当结论是“继续改”，且关键原因里还有明确差距时，可以继续改写。
- 当结论是“可以先停”，说明当前版本已经接近收敛，不建议继续叠加规则。
- 当结论是“需要人工确认”，先看风险与冲突，再决定是否继续改写。`,

  'en-US': `# Compare Evaluation Guide

## 1. What compare evaluation does

Compare evaluation looks at multiple test outputs together and helps answer three questions:

- Is the optimization target actually better than the previous version?
- Where is the optimization target still behind the teacher output?
- Is this change reusable, or is it only fitting the current sample?

## 2. What each role means

### Optimization Target
The column you are actively trying to improve.

### Previous Version
The previous version resolved dynamically from the current workspace, used to judge whether the latest rewrite was a real step forward.

It is not always the second-latest saved version:

- If the workspace has unsaved edits on top of \`v3\`, previous usually points to \`v3\`.
- If the workspace is already the saved \`v3\`, previous usually points to \`v2\`.
- If only the original prompt exists, previous falls back to the original prompt.
- If previous currently matches the workspace text, compare evaluation will usually treat it as stability evidence instead of a true baseline.

### Teacher
Another output worth learning from, usually from a stronger or more stable model.

### Stability Check
An extra comparison used to see whether the gain is stable rather than a one-off win on the current sample.

## 3. Common setups

### Two columns
- A: Optimization Target
- B: Previous Version

Best for deciding whether the latest rewrite should be kept.

### Three columns
- A: Optimization Target
- B: Previous Version
- C: Teacher

Best for checking both progress and learnable gaps.

### Four columns
- A: Optimization Target
- B: Previous Version
- C: Teacher
- D: Stability Check

Best for checking whether the current conclusion is stable and not overfitting the sample.

## 4. How to read the result

### Iteration Advice
The first line tells you whether to keep iterating, stop for now, or review manually.

### Role Mapping
You will also see which test slot is acting as which role, for example:

- Optimization Target [A]
- Previous Version [B]
- Teacher [C]

This helps you understand the comparison setup at a glance.

### Key Reasons
Breaks the conclusion into a few focused blocks: previous version, teacher, and stability. The panel shows one focused block at a time to keep the result compact.

### Signal Chips
Short chips such as "Previous: Improved", "Teacher Gap: Clear Gap", or "Overfit: Medium" are compressed judgement summaries meant for quick scanning.

### Advanced Details
Use this only when you want the extra comparison context instead of the default compact view.

## 5. When to rewrite

- If the result says keep iterating and the key reasons still show clear gaps, rewrite again.
- If the result says stop for now, the workspace is near convergence and more rules are unlikely to help.
- If the result says manual review is needed, inspect the risks and conflicts before rewriting.`,

  'zh-TW': `# 對比評估說明

## 1. 什麼是對比評估

對比評估會把多列測試結果放在一起看，幫助你回答三個問題：

- 優化目標相比上一版，是進步還是退步。
- 優化目標和教師輸出相比，還差在哪裡。
- 這次改動是可重用的優化，還是只對目前樣例有效。

## 2. 這些角色分別代表什麼

### 優化目標
你現在真正想優化、想判斷是否變好的那一列。

### 上一版
相對於目前工作區動態解析出來的上一版，用來判斷這次改寫有沒有帶來真實進步。

它不是固定等於「倒數第二個保存版本」，而是會隨著工作區變化：

- 如果工作區在 \`v3\` 基礎上有未保存修改，上一版通常指向 \`v3\`。
- 如果工作區目前就是保存好的 \`v3\`，上一版通常指向 \`v2\`。
- 如果目前只有原始版本，那麼上一版會回退到原始版本。
- 如果上一版目前和工作區內容相同，在對比評估裡通常會作為複測/穩定性證據看待。

### 教師
另一列更值得學習的輸出，通常是更強模型或更穩定的結果。

### 複測
用來檢查同一類改動是否穩定，而不只是剛好在目前樣例上看起來更好。

## 3. 常見配置示例

### 兩列
- A：優化目標
- B：上一版

適合先判斷「這次改寫值不值得保留」。

### 三列
- A：優化目標
- B：上一版
- C：教師

適合同時判斷「有沒有進步」以及「還能向誰學習」。

### 四列
- A：優化目標
- B：上一版
- C：教師
- D：複測

適合進一步檢查目前結論是否穩定，避免只對目前樣例過擬合。

## 4. 結果怎麼看

### 迭代建議
你會先看到這輪更適合繼續改、可以先停，還是需要人工確認。

### 角色對應
會直接顯示每個測試槽位目前承擔什麼角色，例如：

- 優化目標 [A]
- 上一版 [B]
- 教師 [C]

這樣你可以立刻知道系統是在拿哪幾列做判斷。

### 關鍵原因
把最重要的比較結論拆成幾塊：上一版、教師、穩定性。預設只顯示目前最值得看的那一塊，其他按需切換。

### 關鍵訊號
像「上一版：有進步」「教師差距：差距明顯」「過擬合：中等」這些標籤，是系統先壓縮出來的摘要，方便你快速決定要不要繼續改。

### 高級細節
如果你想看更完整的比較對象、模式或其他輔助資訊，再看高級細節即可。

## 5. 什麼時候該點改寫

- 當結論是「繼續改」，且關鍵原因裡還有明確差距時，可以繼續改寫。
- 當結論是「可以先停」，代表目前版本已接近收斂，不建議繼續疊加規則。
- 當結論是「需要人工確認」，先看風險與衝突，再決定是否繼續改寫。`,
} as const
