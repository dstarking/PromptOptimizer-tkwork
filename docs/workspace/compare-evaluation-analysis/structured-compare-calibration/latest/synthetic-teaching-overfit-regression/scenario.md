# 合成样本: 教学讲解里的样例口诀导致回退

- caseId: synthetic-teaching-overfit-regression
- kind: synthetic

workspace prompt 为当前题目硬塞了特定口诀和固定讲法，导致输出只贴当前样例，不再给出通用原理。这个样本用于校验系统能否识别“看似更像老师在说话，实际更窄更脆弱”的回退。

## Focus

如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。
