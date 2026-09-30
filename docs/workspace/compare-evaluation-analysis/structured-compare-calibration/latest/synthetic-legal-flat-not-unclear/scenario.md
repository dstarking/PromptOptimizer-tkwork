# 合成样本: 法务风险摘要应该判 flat 而不是 unclear

- caseId: synthetic-legal-flat-not-unclear
- kind: synthetic

workspace prompt 只把表达风格改得更口语化，但目标输出与 previous 在风险结论和行动建议上没有实质变化。这个样本用于观察 judge 是否能稳定给出 flat，而不是因为措辞不同就退回 unclear。

## Focus

当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。
