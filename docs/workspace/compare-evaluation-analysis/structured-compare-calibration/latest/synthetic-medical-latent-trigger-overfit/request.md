```json
{
  "type": "compare",
  "evaluationModelKey": "deepseek",
  "mode": {
    "functionMode": "basic",
    "subMode": "system"
  },
  "focus": {
    "content": "如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。",
    "source": "system",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "referencePrompt": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。"
  },
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "分诊输入",
        "content": "最近三天我一爬楼梯就胸口发紧，还会气短，休息十分钟会缓一些。请帮我判断现在该怎么处理。"
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
      "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
      "output": "{\"urgency\":\"high\",\"next_step\":\"立即去急诊，并停止所有含咖啡因饮品。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}",
      "modelKey": "custom",
      "versionLabel": "workspace"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "version",
        "version": 7,
        "label": "Previous"
      },
      "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。",
      "output": "{\"urgency\":\"high\",\"next_step\":\"今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}",
      "modelKey": "custom",
      "versionLabel": "v7"
    },
    {
      "id": "c",
      "label": "C",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "workspace",
        "label": "Teacher Workspace"
      },
      "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
      "output": "{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}",
      "modelKey": "deepseek",
      "versionLabel": "teacher-workspace"
    },
    {
      "id": "d",
      "label": "D",
      "testCaseId": "tc-1",
      "promptRef": {
        "kind": "version",
        "version": 7,
        "label": "Teacher Previous"
      },
      "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。",
      "output": "{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}",
      "modelKey": "deepseek",
      "versionLabel": "teacher-v7"
    }
  ],
  "compareHints": {
    "mode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline"
    },
    "hasSharedTestCases": true,
    "hasSamePromptSnapshots": true,
    "hasCrossModelComparison": true
  }
}
```
