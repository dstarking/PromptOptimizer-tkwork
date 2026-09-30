# 合成样本: 电商抽取里不能因为 teacher 更会写就忽略 schema

- caseId: synthetic-ecommerce-schema-no-model-worship
- kind: synthetic

workspace prompt 把既有商品抽取 contract 改成了新字段和外层 wrapper，teacher 输出也更像“高质量总结”。这个样本用于校验 compare 是否会坚持 schema/contract 优先，而不是因为 reference 更流畅就放过漂移。

## Focus

即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。
