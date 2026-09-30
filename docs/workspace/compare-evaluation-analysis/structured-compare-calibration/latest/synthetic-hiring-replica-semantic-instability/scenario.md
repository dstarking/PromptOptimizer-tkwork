# 合成样本: 招聘筛选里 replica 语义不稳定

- caseId: synthetic-hiring-replica-semantic-instability
- kind: synthetic

workspace prompt 在单次输出里看起来比 previous 更结构化，但同 prompt 的 replica 却给出了不同的录用结论。这个样本用于校验系统是否能识别“单次胜出但语义不稳定”的情况。

## Focus

如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。
