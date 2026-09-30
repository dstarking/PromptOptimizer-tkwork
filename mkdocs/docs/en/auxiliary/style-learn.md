# Style Learning

The Style Learning feature can extract style, composition, and color characteristics from reference images while preserving your current prompt's subject content.

## When to Use

- Already have a prompt subject and want to learn a specific style from a reference image
- Want to preserve the prompt's core content while only changing visual style
- Need to learn unified style characteristics from multiple reference images

## How to Use

### Steps

1. Enter the Text-to-Image workspace
2. First enter what you want to draw (prompt subject)
3. Upload a reference image (click the "Reference Image" button)
4. Select **Style Learning** mode
5. Click start processing
6. AI analyzes the reference image style and generates a stylized prompt
7. Preview the generated results
8. Click **Apply to Current Prompt**

### Prerequisites

- Must first enter prompt subject content
- Prompt cannot be empty
- Reference image clarity must be sufficient

### Interface Description

- **Reference Image Area**: Displays the uploaded reference image thumbnail
- **Generated Prompt**: Preserved subject + style-learned prompt
- **Extracted Variables**: Style-related variables extracted from the image
- **Apply Button**: Writes results to the current workspace

## How It Works

### Analysis Process

AI analyzes the reference image's:

- Color matching and tone
- Composition method and perspective
- Lighting effects and atmosphere
- Artistic style and techniques

But does not change:

- Prompt's subject content
- Core descriptions and key elements

### Output

After analysis, it generates:

- **Stylized Prompt**: Subject content + learned style characteristics
- **Style Variables**: Style parameters extracted from the image (e.g., tone, composition, style)

### Variable Processing

- Extracted variables focus on style characteristics
- Variable names are semantic (e.g., "tone", "composition", "style")
- You can modify variable values to adjust style intensity

## Use Cases

### Case 1: Learn Color Style

```
Original prompt:
An orange cat sitting on a windowsill, sunlight shining on it

Reference image: A warm-toned, soft-lighting photography work

Generated stylized prompt:
An orange cat sitting on a windowsill, sunlight shining on it,
warm tones, soft light transitions, cozy atmosphere, photography style

Extracted variables:
- Tone: Warm tones
- Lighting: Soft transitions
- Atmosphere: Cozy
- Style: Photography
```

### Case 2: Learn Composition Method

```
Original prompt:
A snowy mountain with snow on the peak

Reference image: A landscape photo shot from low angle, emphasizing foreground

Generated stylized prompt:
A snowy mountain with snow on the peak, low angle shot,
emphasizing foreground, vast field of view, magnificent atmosphere,
landscape photography style

Extracted variables:
- Perspective: Low angle
- Composition: Emphasize foreground
- Atmosphere: Magnificent
- Style: Landscape photography
```

### Case 3: Learn Artistic Style

```
Original prompt:
A samurai holding a long sword

Reference image: An ukiyo-e style illustration

Generated stylized prompt:
A samurai holding a long sword, ukiyo-e style, flat processing,
traditional Japanese colors, decorative lines, artistic illustration

Extracted variables:
- Style: Ukiyo-e
- Processing: Flat
- Colors: Traditional Japanese
- Lines: Decorative
```

## Difference from Replicate

| Feature | Style Learning | Replicate |
|---------|---------------|-----------|
| Current prompt | Preserves subject | Ignores |
| Analysis focus | Only style, composition, color | Overall style and content |
| Use case | Learning style on existing prompt | Starting from scratch |

## Common Questions

### Why must I input content first?

The core of style learning is "preserve subject, learn style." Without subject content, it cannot determine what needs to be preserved and what needs to be learned.

### What if the learned style is not distinctive enough?

- Check if the reference image's style characteristics are distinct
- Try adjusting the extracted variable values
- Use a more stylized reference image

### Can I learn styles from multiple reference images at once?

The current version only supports uploading one reference image at a time. If you need to blend multiple styles, you can:

1. First learn the style from the first reference image
2. Apply to the prompt
3. Then upload the second reference image to continue learning

### How to further optimize after learning?

- After applying to current prompt, you can continue using the optimization feature
- Adjust variable values to fine-tune style intensity
- Use the testing feature to verify the result

## Related Pages

- [Text-to-Image Workspace](../image/text2image-workspace.md)
- [Replicate](replicate.md)
- [Smart Variable Fill](smart-fill.md)
