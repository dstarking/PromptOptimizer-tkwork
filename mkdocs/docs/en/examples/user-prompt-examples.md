# User Prompt Examples & Best Practices

This page belongs to the [User Prompt Workspace](../basic/user-optimization.md).

It answers one question:

**how to phrase a task more clearly.**

## Four high-frequency improvement directions

- make the task goal concrete
- make the output format explicit
- separate hard constraints into their own list
- write requirements like “no explanation” or “JSON only” as explicit rules

## Pattern 1: from vague sentence to executable task

### Basic version

```text
Write a poem.
```

### More reliable version

```text
Write a seven-character regulated verse about autumn longing.
Requirements:
1. Eight lines total, seven characters per line.
2. Express emotion through imagery instead of slogan-like direct sentiment.
3. Keep the language restrained and delicate.
4. Output only the poem, with no extra explanation.
```

### Why this is stronger

- the topic is clearer
- the form and format are clearer
- the “no explanation” requirement is explicit

## Pattern 2: lock down the output structure

### Basic version

```text
Organize this meeting content.
```

### More reliable version

```text
Turn the following meeting content into a concise meeting summary.
Use this fixed structure:
1. Topic
2. Key decisions
3. Action items
4. Owners and deadlines

Requirements:
1. Do not miss explicit action items.
2. Do not invent decisions not mentioned in the source.
3. Write in concise professional English.
```

## Pattern 3: make output format strict

### Basic version

```text
Analyze this feedback.
```

### More reliable version

```text
Read the following user feedback and output JSON.

Required fields:
- sentiment: positive / neutral / negative
- summary: within 20 words
- issues: array of concrete issues
- suggestions: array of actionable recommendations

Requirements:
1. Output valid JSON only.
2. Do not add extra explanation.
3. If the source lacks evidence, do not invent details.
```

## How to test user prompts

In `basic/user`, a common test flow is:

1. create a workspace version on the left
2. choose original, workspace, or a saved version on the right
3. run testing
4. compare whether outputs become more complete, more format-compliant, and less likely to drift

Because the executed object is the user prompt itself, this mode usually does not need extra test text on the right.

## When to move to variable mode

If your prompt clearly contains reusable slots such as:

- `{{topic}}`
- `{{audience}}`
- `{{tone}}`
- `{{productName}}`

and you plan to run the same structure across many inputs, [Variable Workspace](../advanced/variables.md) is usually a better fit.

## Related pages

- [User Prompt Workspace](../basic/user-optimization.md)
- [Testing & Evaluation](../user/testing-evaluation.md)
- [Creative Writing](creative-writing.md)
- [Business Communication](business-communication.md)
- [Educational Training](educational-training.md)
