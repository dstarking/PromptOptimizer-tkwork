```json
{
  "type": "compare",
  "evaluationModelKey": "deepseek",
  "mode": {
    "functionMode": "basic",
    "subMode": "system"
  },
  "focus": {
    "content": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。",
    "source": "system",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "referencePrompt": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。"
  },
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "候选人信息",
        "content": "候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。"
      }
    }
  ],
  "snapshots": [
    {
      "id": "a",
      "label": "A",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "workspace",
        "label": "Workspace"
      },
      "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
      "output": "{\"recommendation\":\"hold\",\"strengths\":[\"有 6 年 B2B SaaS 产品经验\",\"做过权限系统和审计日志，和岗位高度相关\"],\"risks\":[\"英语一般，海外客户沟通能力待确认\",\"近期没有直接带人经验\"]}",
      "modelKey": "custom",
      "versionLabel": "workspace"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "version",
        "version": 5,
        "label": "Previous"
      },
      "promptText": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。",
      "output": "{\"recommendation\":\"hold\",\"strengths\":[\"经验较匹配\"],\"risks\":[\"英语一般\"]}",
      "modelKey": "custom",
      "versionLabel": "v5"
    },
    {
      "id": "c",
      "label": "C",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "workspace",
        "label": "Teacher Workspace"
      },
      "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
      "output": "{\"recommendation\":\"hold\",\"strengths\":[\"权限系统和审计日志经验与岗位核心场景强相关\",\"B2B SaaS 背景成熟\"],\"risks\":[\"英语一般，跨海外客户沟通需进一步验证\",\"缺少近期直接管理经验\"]}",
      "modelKey": "deepseek",
      "versionLabel": "teacher-workspace"
    },
    {
      "id": "d",
      "label": "D",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "version",
        "version": 5,
        "label": "Teacher Previous"
      },
      "promptText": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。",
      "output": "{\"recommendation\":\"hold\",\"strengths\":[\"岗位相关经验较多\"],\"risks\":[\"英语一般，管理经历偏弱\"]}",
      "modelKey": "deepseek",
      "versionLabel": "teacher-v5"
    },
    {
      "id": "e",
      "label": "E",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "workspace",
        "label": "Replica"
      },
      "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
      "output": "{\"recommendation\":\"hire\",\"strengths\":[\"权限系统与审计日志经验高度匹配岗位核心需求\",\"B2B SaaS 背景可直接上手复杂业务\"],\"risks\":[\"英语一般，但可通过团队支持弥补\",\"近一年缺少直接带人经验\"]}",
      "modelKey": "custom",
      "versionLabel": "workspace-replica"
    }
  ],
  "compareHints": {
    "mode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline",
      "e": "replica"
    },
    "hasSharedTestCases": true,
    "hasSamePromptSnapshots": true,
    "hasCrossModelComparison": true
  }
}
```
