# Icon Standards

## Icon Library
All icons must be from **Lucide React** (`lucide-react` package).

## Icon Sizing Standards

The application uses a consistent sizing system for icons:

### Size Scale
- **h-3 w-3** (12px): Small icons
  - Sort arrows
  - Filter badges
  - Compact UI elements

- **h-4 w-4** (16px): Standard icons (DEFAULT)
  - Button icons
  - Inline icons
  - List item icons
  - Most common use case

- **h-5 w-5** (20px): Medium icons
  - Alert icons
  - Toast notifications
  - Section headers
  - Status indicators

- **h-8 w-8** (32px): Large icons
  - Empty states
  - Placeholder graphics
  - Feature highlights

## Icon Colors

Icons should use semantic colors based on context:

### Status Colors
- **Red** (`text-red-600`): Errors, critical issues, deletions
- **Yellow** (`text-yellow-600`): Warnings, pending items, bookmarks
- **Orange** (`text-orange-500`): Invalid data, attention needed
- **Green** (`text-green-600`): Success, completed items
- **Blue** (`text-blue-600`): Information, primary actions, links
- **Gray** (`text-gray-400/500/600`): Neutral, inactive, placeholder

### Context Usage
- Error icons: XCircle with text-red-600
- Warning icons: AlertCircle with text-yellow-600
- Success icons: CheckCircle2 with text-green-600
- Info icons: Info with text-blue-600
- Inactive/placeholder: text-gray-400

## Common Icons by Purpose

### Actions
- Upload: `Upload`
- Download: `Download`
- Delete: `Trash`
- Edit: `Pencil`
- Add: `Plus`
- Close: `X`
- Copy: `Copy`

### Status & Feedback
- Error: `XCircle`
- Warning: `AlertCircle`
- Success: `CheckCircle2`
- Info: `Info`
- Loading: `Loader2`

### Navigation & UI
- Expand: `ChevronDown`
- Collapse: `ChevronUp`
- Sort Ascending: `ArrowUp`
- Sort Descending: `ArrowDown`
- Filter: `Filter`
- Clear Filter: `FilterX`

### Content Types
- File: `FileText`
- Table/Data: `TableIcon`
- Comment: `MessageSquare`, `MessageCircle`
- Time: `Clock`
- Notification: `Bell`

## Best Practices

1. **Always use Lucide icons** - No inline SVGs or other icon libraries
2. **Use semantic colors** - Match color to meaning (red=error, yellow=warning, etc.)
3. **Consistent sizing** - Use the standard scale, default to h-4 w-4
4. **Add flex-shrink-0** - For icons in flex containers to prevent squishing
5. **Use mr-* or ml-* spacing** - When icons are next to text (e.g., `mr-2`)
6. **Match icon to action** - Use semantically appropriate icons

## Examples

```tsx
// Button with icon
<Button>
  <Upload className="mr-2 h-4 w-4" />
  Upload File
</Button>

// Error alert
<div className="flex items-start gap-2">
  <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
  <div>Error message</div>
</div>

// Empty state
<div>
  <FileText className="h-8 w-8 text-gray-400" />
  <p>No files uploaded yet</p>
</div>

// Sort indicator
<button>
  Name
  <ArrowUp className="h-3 w-3" />
</button>
```

## Verification Checklist

- [ ] All icons are from `lucide-react`
- [ ] No inline `<svg>` elements
- [ ] Icon sizes follow the standard scale
- [ ] Icon colors are semantic and consistent
- [ ] Icons in flex containers have `flex-shrink-0`
- [ ] Icon spacing is consistent (mr-2, ml-2, etc.)
