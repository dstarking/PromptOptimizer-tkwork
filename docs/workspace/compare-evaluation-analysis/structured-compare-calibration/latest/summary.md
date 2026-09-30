# Structured Compare Calibration Summary

- generatedAt: 2026-03-22T10:44:18.102Z
- outputRoot: D:\Dev\myProject\prompt-optimizer\docs\workspace\compare-evaluation-analysis\structured-compare-calibration\latest

| Case | Kind | Score | targetVsBaseline | targetVsReferenceGap | stopRecommendation | Expectation Match |
| --- | --- | --- | --- | --- | --- | --- |
| live-basic-system-boundary-control | live | 75 | improved | minor | continue | exploratory |
| synthetic-medical-latent-trigger-overfit | synthetic | 35 | regressed | major | review | 3/5 |
| synthetic-ecommerce-schema-no-model-worship | synthetic | 40 | regressed | minor | review | 6/6 |
| synthetic-legal-flat-not-unclear | synthetic | 50 | flat | none | continue | 3/3 |
| synthetic-teaching-overfit-regression | synthetic | 30 | regressed | major | review | 6/6 |
| synthetic-hiring-replica-semantic-instability | synthetic | 65 | improved | none | review | 4/4 |

## Notes

- synthetic cases 用来检验 judge / synthesis 的提示词边界。
- live case 用来观察真实 target/teacher 执行结果在 structured compare 下是否能收敛成合理结论。
- 每个 case 子目录内都保存了 compare request、compare result、rewrite input / output，以及完整 LLM 调用日志。
