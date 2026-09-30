# Text-to-Image Replicate

The Text-to-Image Replicate feature can reverse-engineer prompts and variables from reference images, suitable for generating similar style works from images you like.

## When to Use

- See a reference image you like and want to generate similar style images
- Want to learn an image's style, composition, or color scheme
- Need to extract reproducible prompts from reference images

## How to Use

### Steps

1. Enter the Text-to-Image workspace
2. Upload a reference image (click the "Reference Image" button)
3. Select **Replicate** mode
4. Click start processing
5. AI analyzes the reference image and generates a prompt
6. Preview the generated results
7. Click **Apply to Current Prompt**

### Interface Description

- **Reference Image Area**: Displays the uploaded reference image thumbnail
- **Generated Prompt**: The AI reverse-engineered prompt text
- **Extracted Variables**: Variable parameters identified from the image
- **Apply Button**: Writes results to the current workspace

## How It Works

### Analysis Process

AI analyzes the reference image's:

- Subject content and composition
- Color matching and tone
- Lighting effects and atmosphere
- Style characteristics and artistic techniques

### Output

After analysis, it generates:

- **Prompt**: A complete prompt describing the image content and style
- **Variables**: Variable parameters extracted from the image (e.g., subject, style, tone)

### Variable Processing

- Extracted variables automatically fill with default values
- Variable names are semantic (e.g., "subject", "style", "tone")
- You can modify variable values to adjust generation results

## Use Cases

### Case 1: Replicate Artistic Style

```
Reference image: A cyberpunk-style city night scene

Generated prompt:
A futuristic city night scene, flickering neon lights, towering buildings,
rain-soaked streets reflecting colorful lights, cyberpunk style,
high contrast, purple and blue as main colors

Extracted variables:
- Subject: Futuristic city
- Style: Cyberpunk
- Tone: Purple and blue
- Atmosphere: Rainy night
```

### Case 2: Learn Composition Methods

```
Reference image: A portrait using golden ratio composition

Generated prompt:
A portrait of a young woman, using golden ratio composition,
soft natural light, shallow depth of field, warm tones,
photography style

Extracted variables:
- Subject: Young woman
- Composition: Golden ratio
- Lighting: Soft natural light
- Style: Photography
```

## Difference from Style Learning

| Feature | Replicate | Style Learning |
|---------|-----------|----------------|
| Current prompt | Ignored | Preserves subject |
| Analysis focus | Overall style and content | Only style, composition, color |
| Use case | Starting from scratch | Learning style on existing prompt |

## Common Questions

### What if the generated prompt is inaccurate?

- Edit the generated results in the preview dialog
- Adjust the extracted variable values
- Regenerate if needed; each run may produce different results

### Can I replicate any image?

- Supports PNG/JPEG format
- File size must not exceed 10MB
- Replication effect depends on image clarity and feature distinctiveness

### How to further optimize after replication?

- After applying to current prompt, you can continue using the optimization feature
- Adjust variable values for fine-tuning
- Use the testing feature to verify the result

## Related Pages

- [Text-to-Image Workspace](../image/text2image-workspace.md)
- [Style Learning](style-learn.md)
- [Smart Variable Fill](smart-fill.md)
