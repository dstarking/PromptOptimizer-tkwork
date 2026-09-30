# 合成样本: 医疗分诊里的隐性触发过拟合

- caseId: synthetic-medical-latent-trigger-overfit
- kind: synthetic

workspace prompt 针对当前样例里的“胸口发紧 + 上楼更明显”加入了硬编码动作，看起来更果断，但 reference 侧并不支持这条触发规则。这个样本用于观察系统是否能把“样例贴合收益”与“可复用改进”区分开。

## Focus

如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。
