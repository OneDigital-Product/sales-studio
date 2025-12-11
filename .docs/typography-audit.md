# Typography Audit for Feature #149

## Current State Analysis

### Issues Found:
1. **Body text too small**: Most body text uses `text-sm` (14px), but requirements specify 16px minimum
2. **Inconsistent heading sizes**: 
   - H1 uses both `text-4xl` and `text-3xl` 
   - H2 uses `text-xl`
   - H3 uses `text-lg` and sometimes no size class
   - H4 has no size class
3. **No explicit line-height**: Most elements rely on Tailwind defaults
4. **Font weight inconsistency**: Mix of font-semibold and font-bold without clear hierarchy

### Requirements:
- Body text: 16px minimum (text-base)
- Clear heading hierarchy
- Comfortable line-height for reading
- Proper font weights for emphasis
- Harmonious scale (consistent ratios)

### Proposed Typography Scale:
- H1: text-4xl (36px) font-bold leading-tight
- H2: text-2xl (24px) font-semibold leading-snug  
- H3: text-xl (20px) font-semibold leading-normal
- H4: text-lg (18px) font-medium leading-normal
- Body: text-base (16px) font-normal leading-relaxed
- Small: text-sm (14px) leading-normal
- XSmall: text-xs (12px) leading-normal (for metadata only)

