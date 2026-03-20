# Entity Embed System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain markdown textareas site-wide with a Tiptap-based rich text editor featuring inline entity embed chips (bordered block + avatar style), a toolbar insert modal, entity data caching, and expanded coverage across all authoring surfaces.

**Architecture:** Tiptap editor with a custom `EntityEmbed` atomic node that renders as an `EntityCard` chip and serializes to/from `{{type:id:text}}` markdown via `tiptap-markdown`. The backend, API, and `EnhancedSpoilerMarkdown` renderer are untouched — only authoring surfaces change. Four phases: foundations (cache + EntityCard redesign), new `RichMarkdownEditor` component, public form integration, entity page + admin integration.

**Tech Stack:** Next.js 15, React 19, Mantine UI, Tiptap v2, `tiptap-markdown`, TypeScript (strict), Tailwind CSS 4, React Admin (MUI-based)

**Note on testing:** This project has no test framework configured. Verification for each task is: `cd client && yarn build` (TypeScript compilation + Next.js build) plus manual browser check. Commit after each task.

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `client/src/components/RichMarkdownEditor/index.tsx` | Main editor component — Tiptap wired with extensions, toolbar, modal |
| `client/src/components/RichMarkdownEditor/EntityEmbedExtension.ts` | Custom Tiptap node: atom inline, NodeView → EntityCard, markdown serialize/parse |
| `client/src/components/RichMarkdownEditor/Toolbar.tsx` | Fixed toolbar strip above editor canvas |
| `client/src/components/RichMarkdownEditor/InsertEntityModal.tsx` | Search + select entity → insert into editor |
| `client/src/components/RichMarkdownEditor/RichMarkdownAdminInput.tsx` | React Admin `useController` bridge for admin forms |

### Modified files
| File | What changes |
|------|-------------|
| `client/package.json` | Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `tiptap-markdown` |
| `client/src/lib/entityEmbedParser.ts` | Replace `fetchEntityData` with cached version |
| `client/src/components/EntityCard.tsx` | Inline chip: bordered block + avatar. HoverCard: add skeleton loading state |
| `client/src/app/submit-guide/SubmitGuidePageContent.tsx` | Replace `Textarea` + `EntityEmbedHelperWithSearch` with `RichMarkdownEditor` |
| `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` | Replace `Textarea` with `RichMarkdownEditor` |
| `client/src/app/guides/[id]/GuidePageClient.tsx` | Replace edit-tab `Textarea` + helper with `RichMarkdownEditor` |
| `client/src/app/characters/[id]/CharacterPageClient.tsx` | Replace description/backstory textareas with `RichMarkdownEditor` |
| `client/src/app/arcs/[id]/ArcPageClient.tsx` | Replace description textarea |
| `client/src/app/organizations/[id]/OrganizationPageClient.tsx` | Replace description textarea |
| `client/src/app/events/[id]/EventPageClient.tsx` | Replace description/details textareas |
| `client/src/app/gambles/[id]/GamblePageClient.tsx` | Replace 4 textareas: description, rules, winCondition, explanation |
| `client/src/components/admin/Characters.tsx` | Replace `TextInput` description/backstory with `RichMarkdownAdminInput` |
| `client/src/components/admin/Arcs.tsx` | Replace `TextInput` description |
| `client/src/components/admin/Organizations.tsx` | Replace `TextInput` description |
| `client/src/components/admin/Gambles.tsx` | Replace `TextInput` description/rules/winCondition/explanation |
| `client/src/components/admin/Guides.tsx` | Replace `ContentInputWithPreview` textarea + helper with `RichMarkdownAdminInput` |

---

## Phase 1: Foundations

### Task 1: Install Tiptap dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install packages**

```bash
cd client
yarn add @tiptap/react @tiptap/starter-kit @tiptap/extension-link tiptap-markdown
```

- [ ] **Step 2: Verify the build still passes**

```bash
cd client && yarn build
```
Expected: build completes with no errors (no code changes yet, just new deps).

- [ ] **Step 3: Commit**

```bash
git add client/package.json client/yarn.lock
git commit -m "chore: add Tiptap and tiptap-markdown dependencies"
```

---

### Task 2: Add entity data cache to `entityEmbedParser.ts`

**Files:**
- Modify: `client/src/lib/entityEmbedParser.ts`

The existing `fetchEntityData` function (around line 77) is a plain async function with no caching. Replace it with a module-level promise cache version. Both 404s and network errors resolve to `null` and are cached for the session (no retry). Do not import this file from Server Components — only import from client components (it's already client-only).

- [ ] **Step 1: Add the module-level cache Map and replace `fetchEntityData`**

Find the existing `fetchEntityData` function in `client/src/lib/entityEmbedParser.ts` and replace it with:

```typescript
// Module-level cache: key = "type:id", value = Promise resolving to data or null.
// Both 404s and network errors are cached as null for the session (no retry).
// WARNING: only import this file from client components — never from Server Components
// or route handlers, as module-level state would be shared across requests.
const _entityCache = new Map<string, Promise<EntityEmbedData['data'] | null>>()

export async function fetchEntityData(
  type: EntityEmbedData['type'],
  id: number
): Promise<EntityEmbedData['data'] | null> {
  const key = `${type}:${id}`
  if (_entityCache.has(key)) {
    return _entityCache.get(key)!
  }
  const promise = (async () => {
    try {
      switch (type) {
        case 'character': return await api.getCharacter(id)
        case 'arc': return await api.getArc(id)
        case 'gamble': return await api.getGamble(id)
        case 'guide': return await api.getGuide(id)
        case 'organization': return await api.getOrganization(id)
        case 'chapter': return await api.getChapter(id)
        case 'volume': return await api.getVolume(id)
        case 'quote': return await api.getQuote(id)
        default: return null
      }
    } catch {
      return null
    }
  })()
  _entityCache.set(key, promise)
  return promise
}
```

Match the exact switch cases from the original function so the API calls are identical.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```
Expected: no errors.

- [ ] **Step 3: Manual test**
Open a page with multiple embeds of the same entity (e.g., a guide page referencing the same character twice). Open browser devtools Network tab. Confirm only one API call fires per unique `type:id` pair.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/entityEmbedParser.ts
git commit -m "perf: add module-level promise cache to fetchEntityData"
```

---

### Task 3: Redesign EntityCard inline chip (Option C style)

**Files:**
- Modify: `client/src/components/EntityCard.tsx` (inline chip section, lines ~288-355)

Replace the current pill chip (rounded, icon-only left, no border) with a bordered block chip: `border-radius: 6px`, `border: 1px solid rgba(accentColor, 0.3)`, left 20×20 avatar square showing the entity initial or type icon, right text in accent color. Keep the existing HoverCard wrapper unchanged in this task.

- [ ] **Step 1: Replace the inline chip `<Link>` element styling**

Find the inline chip `<Link>` element inside the `if (inline)` block (around line 300) and replace its `style` prop and children:

```tsx
// Replace the <Link> element and its children with:
<Link
  href={linkHref}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: rem(7),
    padding: `${rem(3)} ${rem(10)} ${rem(3)} ${rem(4)}`,
    borderRadius: rem(6),
    backgroundColor: '#1a2535',
    border: `1px solid ${rgba(accentColor, 0.3)}`,
    color: accentColor,
    textDecoration: 'none',
    fontSize: rem(13),
    fontWeight: 500,
    lineHeight: 1.4,
    verticalAlign: 'middle',
    cursor: 'pointer',
    transition: 'filter 120ms ease',
    whiteSpace: 'nowrap',
    maxWidth: rem(240)
  }}
  onMouseEnter={(event) => {
    event.currentTarget.style.filter = 'brightness(1.1)'
  }}
  onMouseLeave={(event) => {
    event.currentTarget.style.filter = 'brightness(1)'
  }}
>
  {/* 20×20 avatar square: type icon */}
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: rem(20),
    height: rem(20),
    borderRadius: rem(3),
    backgroundColor: rgba(accentColor, 0.2),
    color: accentColor,
    flexShrink: 0,
    fontSize: rem(11)
  }}>
    {ICON_MAP_SM[type]}
  </span>
  <Text
    component="span"
    size="sm"
    fw={500}
    lineClamp={1}
    style={{ color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}
  >
    {chipDisplayText}
  </Text>
</Link>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 3: Manual test**
Start `yarn dev`. Open a page with entity embeds (e.g., `/guides/1` or `/arcs/1`). Confirm chips now appear as bordered blocks with an icon avatar square on the left, not pills. All entity types should show their accent color correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/EntityCard.tsx
git commit -m "feat: redesign EntityCard inline chip to bordered block with avatar"
```

---

### Task 4: Upgrade EntityCard HoverCard with skeleton loading state

**Files:**
- Modify: `client/src/components/EntityCard.tsx` (the `renderPopoverContent` function)

The HoverCard currently shows nothing useful while `loading=true`. Add a skeleton loading state so the card opens immediately with placeholders, then resolves to content. Also enrich the loaded HoverCard: ensure it shows type label, entity name, description excerpt, and tag pills (the `renderPopoverContent` function already does much of this — verify the skeleton path is wired).

- [ ] **Step 1: Find the `renderPopoverContent` function**

Search for `renderPopoverContent` in `client/src/components/EntityCard.tsx`. Find where it renders the `loading` state — it may currently render `skeletonCircle` or similar. Replace/add the loading path so the full card-shaped skeleton shows:

```tsx
// Inside renderPopoverContent, when loading === true:
if (loading) {
  return (
    <Box style={{ display: 'flex', alignItems: 'stretch', minHeight: rem(80) }}>
      {/* Left image skeleton */}
      <Box style={{
        width: rem(70),
        background: 'rgba(255,255,255,0.04)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Skeleton height={rem(44)} width={rem(44)} radius="sm" />
      </Box>
      {/* Right content skeleton */}
      <Box style={{ padding: `${rem(12)} ${rem(14)}`, flex: 1 }}>
        <Skeleton height={rem(10)} width="40%" mb={rem(6)} radius="sm" />
        <Skeleton height={rem(14)} width="70%" mb={rem(8)} radius="sm" />
        <Skeleton height={rem(10)} width="90%" mb={rem(4)} radius="sm" />
        <Skeleton height={rem(10)} width="75%" mb={rem(10)} radius="sm" />
        <Group gap={rem(6)}>
          <Skeleton height={rem(18)} width={rem(50)} radius="xl" />
          <Skeleton height={rem(18)} width={rem(40)} radius="xl" />
        </Group>
      </Box>
    </Box>
  )
}
```

Mantine's `Skeleton` and `Group` are already imported. `rem` is already imported.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 3: Manual test**
Open a page with entity embeds. Hover over an embed on first load (before cache warms). Confirm skeleton placeholders appear immediately and resolve to entity content once the fetch completes. On subsequent hovers, confirm data shows immediately (cache hit).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/EntityCard.tsx
git commit -m "feat: add skeleton loading state to EntityCard HoverCard"
```

---

## Phase 2: RichMarkdownEditor Component

### Task 5: Create EntityEmbed Tiptap node extension

**Files:**
- Create: `client/src/components/RichMarkdownEditor/EntityEmbedExtension.ts`

This is the highest-risk task. The extension is an atomic inline Tiptap node that renders as an `EntityCard` chip. It serializes to `{{type:id:text}}` markdown and parses the same syntax back.

**⚠️ Proto-risk note:** Consult the installed `tiptap-markdown` package's README (at `client/node_modules/tiptap-markdown/README.md`) for the exact custom node integration API before writing the parser hook. The serializer uses `addMarkdownSerializer`; the parser side requires registering a `markdown-it` inline rule.

- [ ] **Step 1: Read the tiptap-markdown README for custom node API**

```bash
cat client/node_modules/tiptap-markdown/README.md | head -200
```

Understand how `MarkdownNode` mixin / `addMarkdownSerializer` / inline rule registration works in the installed version.

- [ ] **Step 2: Create the extension file**

Create `client/src/components/RichMarkdownEditor/EntityEmbedExtension.ts`:

```typescript
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
// EntityCard will be the NodeView component — import lazily to avoid circular deps
// The NodeView wrapper (EntityEmbedNodeView) is defined in index.tsx and passed via options

export type EntityType = 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'

const ENTITY_TYPES: EntityType[] = ['character', 'arc', 'gamble', 'guide', 'organization', 'chapter', 'volume', 'quote']
const ENTITY_TYPE_PATTERN = ENTITY_TYPES.join('|')
// Regex: {{type:id}} or {{type:id:display text}}
const EMBED_REGEX = new RegExp(`\\{\\{(${ENTITY_TYPE_PATTERN}):(\\d+)(?::([^}]+))?\\}\\}`)

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    entityEmbed: {
      insertEntityEmbed: (attrs: {
        entityType: EntityType
        entityId: number
        displayText?: string
      }) => ReturnType
    }
  }
}

export const EntityEmbedExtension = Node.create({
  name: 'entityEmbed',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      entityType: { default: null },
      entityId: { default: null },
      displayText: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-entity-embed]',
        getAttrs: (el) => {
          const span = el as HTMLElement
          return {
            entityType: span.getAttribute('data-type'),
            entityId: Number(span.getAttribute('data-id')),
            displayText: span.getAttribute('data-display') || null,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-entity-embed': '' }),
    ]
  },

  addCommands() {
    return {
      insertEntityEmbed:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },

  // Markdown serializer: node → {{type:id:text}} or {{type:id}}
  // Uses tiptap-markdown's addMarkdownSerializer hook
  addStorage() {
    return {}
  },
})

// Export the markdown serializer config for use with tiptap-markdown
// Consult tiptap-markdown README for exact hook — this may need adjustment
export const entityEmbedMarkdownConfig = {
  serialize(state: any, node: any) {
    const { entityType, entityId, displayText } = node.attrs
    if (displayText) {
      state.write(`{{${entityType}:${entityId}:${displayText}}}`)
    } else {
      state.write(`{{${entityType}:${entityId}}}`)
    }
  },
  // Parse rule for tiptap-markdown: registered as a markdown-it inline rule
  // See README — use md.inline.ruler.push('entity_embed', rule) in the MarkdownExtension
  parseRegex: EMBED_REGEX,
}
```

**Note:** The exact `tiptap-markdown` integration for the parser may differ from the above skeleton. After reading the README, adjust the parser hook approach. The `addMarkdownSerializer` hook for the serializer and `md.inline.ruler.push` for the parser are the API surfaces to target.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build
```
If the `tiptap-markdown` types don't expose the hooks cleanly, use `any` casts temporarily and add a `// TODO: tighten types` comment.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/RichMarkdownEditor/
git commit -m "feat: add EntityEmbed Tiptap node extension skeleton"
```

**⚠️ Do NOT treat this commit as "done."** The parser (markdown → Tiptap node) is not yet wired. Tasks 5–8 form one integrated wiring unit. Verify full round-trip (existing `{{type:id}}` content loads as chips; typing and saving produces `{{type:id}}` syntax) at the end of Task 8 before considering Phase 2 complete.

---

### Task 6: Create the editor Toolbar component

**Files:**
- Create: `client/src/components/RichMarkdownEditor/Toolbar.tsx`

A fixed strip of formatting buttons above the editor canvas. Uses Mantine `ActionIcon` or `UnstyledButton`. Buttons: Bold, Italic, H1, H2, Bullet list, Ordered list, Blockquote, Link separator, then "Insert entity" button.

- [ ] **Step 1: Create Toolbar.tsx**

```tsx
'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { ActionIcon, Group, Divider, Button, Tooltip, rem } from '@mantine/core'
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Quote, Link2, UserPlus
} from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null
  onInsertEntity: () => void
}

export function Toolbar({ editor, onInsertEntity }: ToolbarProps) {
  if (!editor) return null

  const btn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    isActive?: boolean
  ) => (
    <Tooltip label={label} withArrow openDelay={400}>
      <ActionIcon
        variant={isActive ? 'filled' : 'subtle'}
        color={isActive ? 'violet' : 'gray'}
        size="sm"
        onClick={onClick}
        aria-label={label}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  )

  return (
    <Group
      gap={rem(2)}
      p={`${rem(6)} ${rem(8)}`}
      style={{
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-7)',
        flexWrap: 'wrap',
      }}
    >
      {btn('Bold', <Bold size={14} />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('Italic', <Italic size={14} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      <Divider orientation="vertical" />
      {btn('Heading 1', <Heading1 size={14} />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('Heading 2', <Heading2 size={14} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      <Divider orientation="vertical" />
      {btn('Bullet list', <List size={14} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('Ordered list', <ListOrdered size={14} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn('Blockquote', <Quote size={14} />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      <Divider orientation="vertical" />
      {btn('Link', <Link2 size={14} />, () => {
        const url = window.prompt('Enter URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }, editor.isActive('link'))}
      <Divider orientation="vertical" />
      <Tooltip label="Insert entity embed" withArrow openDelay={400}>
        <Button
          size="xs"
          variant="light"
          color="violet"
          leftSection={<UserPlus size={13} />}
          onClick={onInsertEntity}
        >
          Insert entity
        </Button>
      </Tooltip>
    </Group>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RichMarkdownEditor/Toolbar.tsx
git commit -m "feat: add RichMarkdownEditor Toolbar component"
```

---

### Task 7: Create InsertEntityModal

**Files:**
- Create: `client/src/components/RichMarkdownEditor/InsertEntityModal.tsx`

Adapted from `EntityEmbedHelperWithSearch`. Key differences: on entity selection, a display text input appears below the results (pre-filled with entity name, editable), and confirmation inserts into the editor via a callback instead of copying to clipboard. Cancel or Escape closes without inserting.

- [ ] **Step 1: Create InsertEntityModal.tsx**

The component accepts `opened`, `onClose`, and `onInsert(attrs)` props. Internally it has: type filter chips, debounced search input (300ms), results list, and a confirmation row (entity selected + display text input + insert button) that appears after selection.

```tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Modal, TextInput, Group, Stack, Text, Badge, UnstyledButton,
  Chip, Button, Box, rem, rgba, useMantineTheme, Loader
} from '@mantine/core'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'
import { getEntityTypeLabel, getEntityUrl } from '../../lib/entityEmbedParser'
import type { EntityType } from './EntityEmbedExtension'

const ENTITY_TYPES: EntityType[] = ['character', 'arc', 'gamble', 'guide', 'organization', 'chapter', 'volume', 'quote']

interface InsertEntityModalProps {
  opened: boolean
  onClose: () => void
  onInsert: (attrs: { entityType: EntityType; entityId: number; displayText: string | null }) => void
}

const API_FETCH_MAP: Record<EntityType, (query: string) => Promise<any[]>> = {
  character: (q) => api.searchCharacters(q).catch(() => []),
  arc: (q) => api.searchArcs(q).catch(() => []),
  gamble: (q) => api.searchGambles(q).catch(() => []),
  guide: (q) => api.searchGuides(q).catch(() => []),
  organization: (q) => api.searchOrganizations(q).catch(() => []),
  chapter: (q) => api.searchChapters(q).catch(() => []),
  volume: (q) => api.searchVolumes(q).catch(() => []),
  quote: (q) => api.searchQuotes(q).catch(() => []),
}

function getEntityName(type: EntityType, item: any): string {
  if (type === 'chapter') return `Chapter ${item.number}`
  if (type === 'volume') return `Volume ${item.number}`
  if (type === 'quote') return `"${String(item.text || item.content || '').slice(0, 60)}..."`
  return item.name || item.title || `${getEntityTypeLabel(type)} #${item.id}`
}

export function InsertEntityModal({ opened, onClose, onInsert }: InsertEntityModalProps) {
  const theme = useMantineTheme()
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ type: EntityType; id: number; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<{ type: EntityType; id: number; name: string } | null>(null)
  const [displayText, setDisplayText] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!opened) {
      setQuery(''); setResults([]); setSelected(null); setDisplayText(''); setFilterType('all')
    }
  }, [opened])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const typesToSearch: EntityType[] = filterType === 'all' ? ENTITY_TYPES : [filterType]
      const allResults = await Promise.all(
        typesToSearch.map(async (t) => {
          const items = await (API_FETCH_MAP[t]?.(query) ?? Promise.resolve([]))
          return items.slice(0, 5).map((item: any) => ({ type: t, id: item.id, name: getEntityName(t, item) }))
        })
      )
      setResults(allResults.flat().slice(0, 20))
      setLoading(false)
    }, 300)
  }, [query, filterType])

  const handleSelect = (item: { type: EntityType; id: number; name: string }) => {
    setSelected(item)
    setDisplayText(item.name)
  }

  const handleInsert = () => {
    if (!selected) return
    onInsert({
      entityType: selected.type,
      entityId: selected.id,
      displayText: displayText.trim() !== selected.name ? displayText.trim() || null : null,
    })
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Insert entity embed" size="md" centered>
      <Stack gap="sm">
        {/* Type filter */}
        <Group gap="xs" wrap="wrap">
          <Chip size="xs" checked={filterType === 'all'} onChange={() => setFilterType('all')}>All</Chip>
          {ENTITY_TYPES.map((t) => (
            <Chip key={t} size="xs" checked={filterType === t} onChange={() => setFilterType(t)}>
              {getEntityTypeLabel(t)}
            </Chip>
          ))}
        </Group>

        {/* Search */}
        <TextInput
          placeholder="Search entities..."
          leftSection={loading ? <Loader size={14} /> : <Search size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          autoFocus
        />

        {/* Results */}
        {results.length > 0 && (
          <Stack gap={rem(4)} style={{ maxHeight: rem(240), overflowY: 'auto' }}>
            {results.map((item) => (
              <UnstyledButton
                key={`${item.type}:${item.id}`}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: rem(8),
                  padding: `${rem(7)} ${rem(10)}`, borderRadius: rem(6),
                  background: selected?.type === item.type && selected?.id === item.id
                    ? 'var(--mantine-color-violet-light)' : 'var(--mantine-color-dark-6)',
                }}
              >
                <Badge size="xs" color="violet" variant="outline">{getEntityTypeLabel(item.type)}</Badge>
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>{item.name}</Text>
              </UnstyledButton>
            ))}
          </Stack>
        )}

        {/* Confirmation row — appears after entity is selected */}
        {selected && (
          <Box
            style={{
              padding: rem(12), borderRadius: rem(6),
              border: '1px solid var(--mantine-color-violet-light)',
              background: 'var(--mantine-color-dark-7)'
            }}
          >
            <Text size="xs" c="dimmed" mb={rem(6)}>
              Selected: <strong>{selected.name}</strong> ({getEntityTypeLabel(selected.type)})
            </Text>
            <TextInput
              label="Display text (optional override)"
              size="xs"
              value={displayText}
              onChange={(e) => setDisplayText(e.currentTarget.value)}
              mb={rem(10)}
              description="Leave as entity name or type a custom label"
            />
            <Group justify="flex-end" gap="xs">
              <Button size="xs" variant="subtle" color="gray" onClick={() => setSelected(null)}>Back</Button>
              <Button size="xs" color="violet" onClick={handleInsert}>Insert embed</Button>
            </Group>
          </Box>
        )}
      </Stack>
    </Modal>
  )
}
```

**Note:** The `api.search*` methods above may not exist in `client/src/lib/api.ts`. Before using `API_FETCH_MAP` as written, grep for actual method names:

```bash
grep -n "getCharacter\|getArc\|getGamble\|getGuide\|getOrganiz" client/src/lib/api.ts | head -30
```

If the API uses paginated list methods like `api.getCharacters({ search: q, limit: 10 })`, replace the `API_FETCH_MAP` entries accordingly. For example:

```typescript
// If api.getCharacters returns { data: Character[], total: number }:
character: async (q) => {
  const res = await api.getCharacters({ search: q, limit: 10 }).catch(() => ({ data: [] }))
  return res.data ?? []
},
```

Do not leave the search broken at runtime — resolve the correct API method signatures before committing Task 7.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RichMarkdownEditor/InsertEntityModal.tsx
git commit -m "feat: add InsertEntityModal for RichMarkdownEditor"
```

---

### Task 8: Wire the RichMarkdownEditor core component

**Files:**
- Create: `client/src/components/RichMarkdownEditor/index.tsx`

This wires Tiptap with extensions, the Toolbar, the InsertEntityModal, and renders `EnhancedSpoilerMarkdown` when `disabled=true`. When `disabled` toggles to `false`, the editor rehydrates from `value` (no undo history preserved across transitions).

- [ ] **Step 1: Create `client/src/components/RichMarkdownEditor/index.tsx`**

```tsx
'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { Box, InputWrapper, rem } from '@mantine/core'
import { Toolbar } from './Toolbar'
import { InsertEntityModal } from './InsertEntityModal'
import { EntityEmbedExtension } from './EntityEmbedExtension'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import EntityCard from '../EntityCard'
// NodeView component for EntityEmbed: renders an EntityCard chip
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

// NodeView for the EntityEmbed node — renders EntityCard inside the editor
function EntityEmbedNodeView({ node }: { node: any }) {
  const { entityType, entityId, displayText } = node.attrs
  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }} contentEditable={false}>
      <EntityCard
        type={entityType}
        id={Number(entityId)}
        displayText={displayText || undefined}
        inline
      />
    </NodeViewWrapper>
  )
}

export interface RichMarkdownEditorProps {
  value: string
  onChange: (md: string) => void
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  label?: string
  'aria-label'?: string
  disabled?: boolean
}

export function RichMarkdownEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = 200,
  maxHeight,
  label,
  'aria-label': ariaLabel,
  disabled = false,
}: RichMarkdownEditorProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const [modalOpen, setModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Markdown.configure({
        // tiptap-markdown configuration — adjust based on README
        // The EntityEmbed serialize/parse rules are added here or in the extension
      }),
      EntityEmbedExtension.extend({
        addNodeView() {
          return ReactNodeViewRenderer(EntityEmbedNodeView)
        },
      }),
    ],
    content: value,   // initial markdown content (tiptap-markdown parses this)
    editable: !disabled,
    onUpdate({ editor }) {
      // tiptap-markdown serializes editor state back to markdown
      const md = editor.storage.markdown?.getMarkdown?.() ?? editor.getText()
      onChange(md)
    },
  }, [disabled])  // recreate editor when disabled changes — rehydrates from value

  // Sync value prop → editor when editor is remounted (disabled toggle)
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const current = editor.storage.markdown?.getMarkdown?.() ?? ''
      if (current !== value) {
        editor.commands.setContent(value)
      }
    }
  }, [editor, value])

  if (disabled) {
    return <EnhancedSpoilerMarkdown content={value} enableEntityEmbeds compactEntityCards={false} />
  }

  return (
    <InputWrapper label={label} labelProps={label ? { id: labelId } : undefined}>
      <Box
        style={{
          border: '1px solid var(--mantine-color-dark-4)',
          borderRadius: rem(8),
          overflow: 'hidden',
          background: 'var(--mantine-color-dark-7)',
        }}
      >
        <Toolbar editor={editor} onInsertEntity={() => setModalOpen(true)} />
        <Box
          style={{
            minHeight: rem(minHeight),
            maxHeight: maxHeight ? rem(maxHeight) : undefined,
            overflowY: maxHeight ? 'auto' : undefined,
          }}
        >
          <EditorContent
            editor={editor}
            aria-labelledby={label ? labelId : undefined}
            aria-label={!label ? ariaLabel : undefined}
            style={{
              padding: `${rem(12)} ${rem(16)}`,
              minHeight: rem(minHeight),
              fontSize: rem(14),
              lineHeight: 1.75,
              outline: 'none',
            }}
          />
          {!editor?.getText() && (
            <Box
              style={{
                position: 'absolute',
                top: rem(12),
                left: rem(16),
                color: 'var(--mantine-color-dark-3)',
                fontSize: rem(14),
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {placeholder}
            </Box>
          )}
        </Box>
      </Box>

      <InsertEntityModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onInsert={(attrs) => {
          editor?.chain().focus().insertEntityEmbed(attrs).run()
          setModalOpen(false)
        }}
      />
    </InputWrapper>
  )
}

export default RichMarkdownEditor
```

**Key integration points to verify with `tiptap-markdown`:**
- `editor.storage.markdown?.getMarkdown?.()` — this is how `tiptap-markdown` exposes the serialized markdown. Check the installed version's README for the exact API (may be `editor.getMarkdown()` or similar).
- `Markdown.configure({...})` — wire the EntityEmbed serialize/parse rules here per the README.
- `editor.commands.setContent(value)` — `tiptap-markdown` extends this to accept markdown strings.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build
```

There may be type errors from `tiptap-markdown` API surface — fix with correct method names found in the README (Task 5, Step 1).

- [ ] **Step 3: Manual smoke test**

```bash
cd client && yarn dev
```

Navigate to a page that has a markdown textarea (e.g., `/submit-guide` — hasn't been wired yet, but you can temporarily add `<RichMarkdownEditor value="" onChange={console.log} />` to a test page). Verify: editor renders, toolbar buttons work, Insert Entity opens the modal, selecting an entity inserts a chip, the chip renders as a bordered block.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/RichMarkdownEditor/
git commit -m "feat: add RichMarkdownEditor core component with Tiptap"
```

---

## Phase 3: Public Form Integration

### Task 9: Integrate RichMarkdownEditor into submit-guide

**Files:**
- Modify: `client/src/app/submit-guide/SubmitGuidePageContent.tsx`

The guide form currently has: a `Textarea` for content (with `ref={contentRef}` for cursor tracking), an `EntityEmbedHelperWithSearch` helper, and a preview tab that renders `EnhancedSpoilerMarkdown`. Replace all three with `RichMarkdownEditor`. The preview tab is no longer needed — `RichMarkdownEditor` shows chips inline.

- [ ] **Step 1: Import RichMarkdownEditor**

At the top of `SubmitGuidePageContent.tsx`, add:

```tsx
import { RichMarkdownEditor } from '@/components/RichMarkdownEditor'
```

Remove the imports for `EntityEmbedHelperWithSearch` and the textarea `ref` if no longer used.

- [ ] **Step 2: Replace the content Textarea and EntityEmbedHelperWithSearch**

Find the `Textarea` for content (search for `content` in form field with `minRows` or the `ref={contentRef}` prop) and the `EntityEmbedHelperWithSearch` component. Replace both with:

```tsx
<RichMarkdownEditor
  value={formData.content}
  onChange={(md) => setFormData((prev) => ({ ...prev, content: md }))}
  placeholder="Write your guide content here. Use the toolbar to format text and insert entity embeds."
  minHeight={300}
  label="Guide content"
/>
```

Remove the preview tab and the "write/preview" tab switcher for the content field — the editor shows chips inline. Keep any other tabs (e.g., metadata) unchanged.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 4: Manual test**
Open `/submit-guide`. Verify: the editor renders with toolbar, typing works, formatting works (bold/italic/headings), inserting an entity embed works end-to-end (click Insert Entity → search → select → display text → Insert embed → chip appears in editor), form submits and content is saved as markdown with `{{type:id}}` syntax, existing guide edit mode (`?edit=id`) loads existing content correctly.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/submit-guide/SubmitGuidePageContent.tsx
git commit -m "feat: replace guide submission textarea with RichMarkdownEditor"
```

---

### Task 10: Integrate RichMarkdownEditor into submit-annotation

**Files:**
- Modify: `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx`

The annotation form has a plain `Textarea` for content (around line 399) with no embed helper. Replace with `RichMarkdownEditor`. Both create mode and edit mode (`?edit=annotationId`) use the same content field.

- [ ] **Step 1: Import RichMarkdownEditor**

```tsx
import { RichMarkdownEditor } from '@/components/RichMarkdownEditor'
```

- [ ] **Step 2: Replace the content Textarea**

Find the `Textarea` for the `content` field and replace with:

```tsx
<RichMarkdownEditor
  value={formData.content ?? ''}
  onChange={(md) => setFormData((prev) => ({ ...prev, content: md }))}
  placeholder="Write your annotation analysis here..."
  minHeight={180}
  label="Annotation content"
/>
```

Ensure the `onChange` callback matches the form state update pattern used by the rest of the form fields in this file.

- [ ] **Step 3: Verify TypeScript compiles and manual test**

```bash
cd client && yarn build
```

Open `/submit-annotation`. Test create mode (no query param): editor renders, content can be typed, entity embeds can be inserted. Test edit mode (`?edit=<id>`): existing content loads into editor. Submit and confirm content saved correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx
git commit -m "feat: add RichMarkdownEditor to annotation submission (create + edit)"
```

---

### Task 11: Integrate RichMarkdownEditor into guide in-page edit

**Files:**
- Modify: `client/src/app/guides/[id]/GuidePageClient.tsx`

The guide edit tab has a `Textarea` with cursor-tracking ref and `EntityEmbedHelperWithSearch`. Replace both with `RichMarkdownEditor`. The `textareaRef` / `selectionStart` logic can be removed entirely.

- [ ] **Step 1: Import RichMarkdownEditor and remove old imports**

Add: `import { RichMarkdownEditor } from '@/components/RichMarkdownEditor'`
Remove: `EntityEmbedHelperWithSearch` import if no longer used elsewhere in this file.

- [ ] **Step 2: Replace the edit-tab Textarea and EntityEmbedHelperWithSearch**

Find the edit tab content (search for `textareaRef` or `EntityEmbedHelperWithSearch` in this file). Replace the textarea + helper with:

```tsx
<RichMarkdownEditor
  value={editedContent}
  onChange={setEditedContent}
  minHeight={300}
  label="Guide content"
/>
```

Where `editedContent` and `setEditedContent` are the existing state variables used to track the edit state. Remove the `handleInsertEmbed` callback and `textareaRef` if they exist.

- [ ] **Step 3: Verify TypeScript compiles and manual test**

```bash
cd client && yarn build
```

Open a guide page as an editor/admin. Click "Edit". Verify the editor loads with existing guide content, all formatting works, entity embeds can be inserted, Save works (content saved as markdown). Verify Cancel resets to original content.

- [ ] **Step 4: Commit**

```bash
git add "client/src/app/guides/[id]/GuidePageClient.tsx"
git commit -m "feat: replace guide in-page edit textarea with RichMarkdownEditor"
```

---

## Phase 4: Entity Page Integration

### Task 12: Integrate RichMarkdownEditor into character, arc, organization, event pages

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx` (description + backstory)
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx` (description)
- Modify: `client/src/app/organizations/[id]/OrganizationPageClient.tsx` (description)
- Modify: `client/src/app/events/[id]/EventPageClient.tsx` (description + details)

These pages have in-page edit modes for moderators/editors/admins. Each has one or more markdown `Textarea` fields. The pattern is the same for all four files.

For each file:

- [ ] **Step 1: Add import**

```tsx
import { RichMarkdownEditor } from '@/components/RichMarkdownEditor'
```

- [ ] **Step 2: Find and replace each markdown Textarea**

Search for `Textarea` or `textarea` in the edit mode section. For each markdown field (description, backstory, details — not short text fields like name, title, etc.), replace with:

```tsx
<RichMarkdownEditor
  value={editForm.description ?? ''}
  onChange={(md) => setEditForm((prev) => ({ ...prev, description: md }))}
  minHeight={150}
  label="Description"
/>
```

Adjust field name (`description`, `backstory`, `details`) and the `setEditForm` state update to match the existing pattern in each file.

- [ ] **Step 3: Verify build and test each page**

```bash
cd client && yarn build
```

Test each entity page: open as editor/admin, enter edit mode, verify editor renders with existing content, save works, cancel resets.

- [ ] **Step 4: Commit all four files**

```bash
git add \
  "client/src/app/characters/[id]/CharacterPageClient.tsx" \
  "client/src/app/arcs/[id]/ArcPageClient.tsx" \
  "client/src/app/organizations/[id]/OrganizationPageClient.tsx" \
  "client/src/app/events/[id]/EventPageClient.tsx"
git commit -m "feat: add RichMarkdownEditor to character, arc, organization, event in-page edits"
```

---

### Task 13: Integrate RichMarkdownEditor into gamble page

**Files:**
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`

Gamble has four markdown fields: description, rules, winCondition, explanation. Same pattern as Task 12 but four replacements.

- [ ] **Step 1: Add import**

```tsx
import { RichMarkdownEditor } from '@/components/RichMarkdownEditor'
```

- [ ] **Step 2: Replace all four markdown Textareas**

For each field (find by the `source` or state field name):

```tsx
{/* Description */}
<RichMarkdownEditor
  value={editForm.description ?? ''}
  onChange={(md) => setEditForm((prev) => ({ ...prev, description: md }))}
  minHeight={120}
  label="Description"
/>

{/* Rules */}
<RichMarkdownEditor
  value={editForm.rules ?? ''}
  onChange={(md) => setEditForm((prev) => ({ ...prev, rules: md }))}
  minHeight={120}
  label="Rules"
/>

{/* Win condition */}
<RichMarkdownEditor
  value={editForm.winCondition ?? ''}
  onChange={(md) => setEditForm((prev) => ({ ...prev, winCondition: md }))}
  minHeight={100}
  label="Win condition"
/>

{/* Explanation */}
<RichMarkdownEditor
  value={editForm.explanation ?? ''}
  onChange={(md) => setEditForm((prev) => ({ ...prev, explanation: md }))}
  minHeight={150}
  label="Explanation"
/>
```

- [ ] **Step 3: Verify build and test**

```bash
cd client && yarn build
```

Open a gamble page as editor/admin. Enter edit mode. Verify all four editors render and save correctly.

- [ ] **Step 4: Commit**

```bash
git add "client/src/app/gambles/[id]/GamblePageClient.tsx"
git commit -m "feat: add RichMarkdownEditor to gamble in-page edit (4 fields)"
```

---

## Phase 5: React Admin Integration

### Task 14: Create RichMarkdownAdminInput and wire into admin components

**Files:**
- Create: `client/src/components/RichMarkdownEditor/RichMarkdownAdminInput.tsx`
- Modify: `client/src/components/admin/Characters.tsx`
- Modify: `client/src/components/admin/Arcs.tsx`
- Modify: `client/src/components/admin/Organizations.tsx`
- Modify: `client/src/components/admin/Gambles.tsx`
- Modify: `client/src/components/admin/Guides.tsx`

React Admin forms are managed by `react-hook-form` via `useFormContext`. `RichMarkdownEditor` (a plain `value`/`onChange` component) must be wrapped via `useController` to bind to the form's `source` field.

- [ ] **Step 1: Create RichMarkdownAdminInput.tsx**

```tsx
'use client'

import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { RichMarkdownEditor } from './index'

interface RichMarkdownAdminInputProps {
  source: string         // react-admin field name (e.g., "description")
  label?: string
  minHeight?: number
  maxHeight?: number
  placeholder?: string
}

/**
 * React Admin compatible wrapper for RichMarkdownEditor.
 * Uses react-hook-form's useController to bind to the form source field.
 * Admin edit views always render in edit mode — disabled prop not used here.
 */
export function RichMarkdownAdminInput({
  source,
  label,
  minHeight = 200,
  maxHeight,
  placeholder,
}: RichMarkdownAdminInputProps) {
  const { control } = useFormContext()
  const { field } = useController({ name: source, control })

  return (
    <RichMarkdownEditor
      value={field.value ?? ''}
      onChange={(md) => field.onChange(md)}
      label={label ?? source}
      minHeight={minHeight}
      maxHeight={maxHeight}
      placeholder={placeholder}
    />
  )
}
```

- [ ] **Step 2: Wire into Characters.tsx**

Find the `TextInput` elements with `source="description"` and `source="backstory"` in `client/src/components/admin/Characters.tsx` (around lines 702-713). Replace each with:

```tsx
import { RichMarkdownAdminInput } from './RichMarkdownAdminInput'

// Replace:
// <TextInput source="description" multiline rows={4} fullWidth ... />
// With:
<RichMarkdownAdminInput source="description" label="Description" minHeight={150} />

// Replace backstory:
<RichMarkdownAdminInput source="backstory" label="Backstory" minHeight={200} />
```

- [ ] **Step 3: Wire into Arcs.tsx**

Find `TextInput source="description"` in `client/src/components/admin/Arcs.tsx` and replace with `<RichMarkdownAdminInput source="description" label="Description" minHeight={150} />`.

- [ ] **Step 4: Wire into Organizations.tsx**

Same pattern as Arcs — find `TextInput source="description"` and replace.

- [ ] **Step 5: Wire into Gambles.tsx**

Find the four `TextInput` sources: `description`, `rules`, `winCondition`, `explanation` in `client/src/components/admin/Gambles.tsx` and replace each with `RichMarkdownAdminInput`.

- [ ] **Step 6: Wire into Guides.tsx**

`Guides.tsx` already has a `ContentInputWithPreview` component (around line 2254) that uses `useWatch`/`getValues`/`setValue` to manage the content field with a textarea + embed helper. Replace this entire component with:

```tsx
import { RichMarkdownAdminInput } from './RichMarkdownAdminInput'

// Replace ContentInputWithPreview with:
const ContentInputWithPreview = () => (
  <RichMarkdownAdminInput source="content" label="Guide content" minHeight={400} />
)
```

The `useContentEditor` hook and its `handleInsertEmbed` logic can be removed entirely.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd client && yarn build
```

- [ ] **Step 8: Manual test**
Open the admin panel (`/admin`). Navigate to Characters → Edit a character. Verify description and backstory render as `RichMarkdownEditor` instances. Test Gambles (4 fields), Guides (content field with existing embed helper now replaced). Confirm saving still works.

- [ ] **Step 9: Commit**

```bash
git add \
  client/src/components/RichMarkdownEditor/RichMarkdownAdminInput.tsx \
  client/src/components/admin/Characters.tsx \
  client/src/components/admin/Arcs.tsx \
  client/src/components/admin/Organizations.tsx \
  client/src/components/admin/Gambles.tsx \
  client/src/components/admin/Guides.tsx
git commit -m "feat: add RichMarkdownAdminInput and wire into all admin markdown fields"
```

---

## Final Verification

- [ ] Run full production build: `cd client && yarn build` — zero errors
- [ ] Verify `EnhancedSpoilerMarkdown` still renders existing `{{type:id}}` content correctly on all entity detail pages (no editor mounted on read-only pages)
- [ ] Verify entity embeds round-trip: write embed in editor → save → page renders chip → chip hover card shows correct entity data
- [ ] Verify entity data cache: open Network tab, navigate to a page with 3+ embeds of the same entity — confirm one API call per unique entity, not one per embed instance
- [ ] Verify `disabled` toggle: on a guide page, view mode shows `EnhancedSpoilerMarkdown`, edit mode mounts editor with existing content, save/cancel cycles work without stale state
