# System Prompt Examples & Best Practices

This page belongs to the [System Prompt Workspace](../basic/system-optimization.md).

It answers one question:

**what kind of content is best written into a system prompt.**

## First rule of thumb

If your goal is to answer questions like these, system prompt mode is usually a good fit:

- who should the model behave as?
- which long-lived rules should always apply?
- what must never happen?
- should the output structure stay fixed?

If your goal is only “write an email” or “summarize this text”, user prompt mode is usually better.

## Pattern 1: role + rules + boundaries

### Basic version

```text
You are a customer support assistant.
```

### More reliable version

```text
You are an e-commerce after-sales support assistant.
Follow these rules:
1. Answer the user's current question first.
2. If information is missing, say exactly what is still needed.
3. Do not invent order status, refund outcomes, or logistics details.
4. Keep the tone polite and concise.
5. If the issue is outside your scope, clearly suggest contacting a human agent.
```

### Why this is stronger

- the role is more specific
- long-lived rules are explicit
- behavioral boundaries are written out clearly

### How to test it

Keep one fixed user message on the right, for example:

```text
My order has not shipped yet. Can I request a refund now?
```

Then compare `original / workspace / vN`.

## Pattern 2: fixed output structure

```text
You are a business analysis assistant.
All answers must follow this structure:
1. Situation
2. Key Issues
3. Recommendation
4. Risks and Boundaries

If information is missing, list the missing information under "Key Issues" instead of guessing.
```

This is useful when you want the model to follow one long-lived structure across many questions.

## Pattern 3: review-style system prompt

```text
You are a strict but restrained code review assistant.
Follow these rules:
1. Prioritize real bugs, risks, and regressions.
2. Give the conclusion first, then the reasoning.
3. Do not force a conclusion when evidence is insufficient.
4. Do not treat personal style preference as a defect.
5. Structure the output as: issue, impact, recommendation.
```

This kind of prompt is well suited to fixed regression material, such as the same code diff or the same requirement description.

## The 4 most common problems in system prompts

- the role is too vague, so model behavior drifts
- boundaries are missing, so the model invents things
- output structure is missing, so response format changes across runs
- the wording is too soft, such as “be more professional” or “be more detailed”, which different models interpret differently

## Recommended test approach

1. enter the original system prompt and optimize it
2. keep one fixed test message on the right
3. run original, workspace, and saved versions
4. check whether outputs are more stable and more rule-compliant
5. then use Result Evaluation or Compare Evaluation

## When to move to advanced mode

If you need to test a system prompt together with:

- a fixed system message
- conversation history
- a new user turn

then [Context Workspace](../advanced/context.md) is usually a better fit.

## Related pages

- [System Prompt Workspace](../basic/system-optimization.md)
- [Testing & Evaluation](../user/testing-evaluation.md)
- [User Prompt Examples & Best Practices](user-prompt-examples.md)
