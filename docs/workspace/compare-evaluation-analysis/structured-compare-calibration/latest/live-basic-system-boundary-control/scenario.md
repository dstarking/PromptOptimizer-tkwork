# 真实模型: basic-system 边界控制改动

- caseId: live-basic-system-boundary-control
- kind: live

使用真实 target/teacher 执行 4 个快照，检验 structured compare 是否能识别“更强边界约束”带来的真实收益，而不是只看表面措辞变化。

## Focus

优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。
