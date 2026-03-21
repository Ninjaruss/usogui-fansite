# Chapters Admin Page + Volumes Menu Move Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Volumes from Core Content to Reference Data in the admin sidebar, and add a full Chapters admin resource (List, Show, Edit, Create).

**Architecture:** Three files change — `AdminMenu.tsx` (menu restructure), `AdminApp.tsx` (resource registration), and a new `Chapters.tsx` (the four CRUD views). The backend `/chapters` API already exists with full CRUD; no backend changes needed.

**Tech Stack:** React Admin, Next.js 15, TypeScript, MUI, lucide-react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/components/admin/AdminMenu.tsx` | Modify | Move Volumes item; add Chapters item with Hash icon |
| `client/src/app/admin/AdminApp.tsx` | Modify | Import + register `chapters` Resource |
| `client/src/components/admin/Chapters.tsx` | Create | ChapterList, ChapterShow, ChapterEdit, ChapterCreate |

---

## Task 1: Move Volumes to Reference Data in AdminMenu

**Files:**
- Modify: `client/src/components/admin/AdminMenu.tsx`

- [ ] **Step 1: Open AdminMenu.tsx and locate the two sections to change**

  The file is at `client/src/components/admin/AdminMenu.tsx`. There are two sections to edit:
  1. Remove the Volumes `MenuItemLink` from the Core Content section (currently between Arcs and Gambles, lines ~65-69)
  2. Add the Volumes `MenuItemLink` to the Reference Data section (currently after Tags)

- [ ] **Step 2: Remove Volumes from Core Content**

  Delete these lines from inside the `{/* Core Content Section */}` block:
  ```tsx
  <MenuItemLink
    to="/volumes"
    primaryText="Volumes"
    leftIcon={<Library size={20} />}
  />
  ```

- [ ] **Step 3: Add Volumes to Reference Data**

  In the `{/* Reference Data Section */}` block, after the Tags `MenuItemLink`, add:
  ```tsx
  <MenuItemLink
    to="/volumes"
    primaryText="Volumes"
    leftIcon={<Library size={20} />}
  />
  ```

  The Reference Data section should now read: Organizations, Quotes, Tags, Volumes.

- [ ] **Step 4: Verify the file compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```
  Expected: no TypeScript errors related to `AdminMenu.tsx`.

- [ ] **Step 5: Commit**

  ```bash
  git add client/src/components/admin/AdminMenu.tsx
  git commit -m "feat: move volumes to reference data section in admin menu"
  ```

---

## Task 2: Add Chapters menu item to AdminMenu

**Files:**
- Modify: `client/src/components/admin/AdminMenu.tsx`

- [ ] **Step 1: Add `Hash` to the lucide-react import**

  The existing import at the top of `AdminMenu.tsx` looks like:
  ```tsx
  import {
    Users,
    User,
    BookOpen,
    Crown,
    Zap,
    FileText,
    Image,
    Quote,
    Tag,
    Shield,
    Link2,
    Building2,
    MessageSquare,
    Library,
    Award
  } from 'lucide-react'
  ```

  Add `Hash` to this list:
  ```tsx
  import {
    Users,
    User,
    BookOpen,
    Crown,
    Zap,
    FileText,
    Image,
    Quote,
    Tag,
    Shield,
    Link2,
    Building2,
    MessageSquare,
    Library,
    Award,
    Hash
  } from 'lucide-react'
  ```

- [ ] **Step 2: Add Chapters MenuItemLink after Volumes in Reference Data**

  After the Volumes `MenuItemLink` you added in Task 1, add:
  ```tsx
  <MenuItemLink
    to="/chapters"
    primaryText="Chapters"
    leftIcon={<Hash size={20} />}
  />
  ```

  The Reference Data section should now read: Organizations, Quotes, Tags, Volumes, Chapters.

- [ ] **Step 3: Verify the file compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/components/admin/AdminMenu.tsx
  git commit -m "feat: add chapters to reference data section in admin menu"
  ```

---

## Task 3: Create Chapters.tsx component

**Files:**
- Create: `client/src/components/admin/Chapters.tsx`

This file follows the same structure as `client/src/components/admin/Volumes.tsx`. Read that file before writing this one — it's your pattern reference.

The Chapter entity fields are: `id` (number, auto), `number` (number, required, unique, 1–539), `title` (string, optional, max 200 chars), `summary` (text, optional).

- [ ] **Step 1: Create the file with imports**

  Create `client/src/components/admin/Chapters.tsx` with these imports:
  ```tsx
  import React from 'react'
  import {
    List,
    Datagrid,
    TextField,
    Edit,
    Create,
    Show,
    SimpleForm,
    TextInput,
    NumberInput,
    NumberField,
    FunctionField,
    TabbedShowLayout,
    Tab,
    BulkDeleteButton,
  } from 'react-admin'
  import { Typography, Chip, Box, Card, CardContent, Grid } from '@mui/material'
  import { Edit3, Plus, Hash } from 'lucide-react'
  import { EditToolbar } from './EditToolbar'
  ```

- [ ] **Step 2: Write ChapterList**

  ```tsx
  const ChapterBulkActionButtons = () => (
    <>
      <BulkDeleteButton mutationMode="pessimistic" />
    </>
  )

  export const ChapterList = () => (
    <List sort={{ field: 'number', order: 'ASC' }}>
      <Datagrid rowClick="show" bulkActionButtons={<ChapterBulkActionButtons />}>
        <NumberField source="id" sortable />
        <NumberField source="number" label="Chapter #" sortable />
        <TextField source="title" sortable />
        <FunctionField
          label="Summary"
          render={(record: any) => (
            <Box sx={{ maxWidth: '400px' }}>
              <Typography
                variant="body2"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  lineHeight: 1.3,
                }}
              >
                {record.summary || 'No summary'}
              </Typography>
            </Box>
          )}
        />
      </Datagrid>
    </List>
  )
  ```

- [ ] **Step 3: Write ChapterShow**

  ```tsx
  export const ChapterShow = () => (
    <Show>
      <Box sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh', p: 3 }}>
        {/* Header */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            backgroundColor: '#0a0a0a',
            border: '2px solid #6366f1',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Hash size={32} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FunctionField
                  render={(record: any) => (
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                      Chapter {record.number}
                    </Typography>
                  )}
                />
                <FunctionField
                  render={(record: any) =>
                    record.title ? (
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                        {record.title}
                      </Typography>
                    ) : null
                  }
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        <TabbedShowLayout
          sx={{
            backgroundColor: '#0a0a0a',
            '& .RaTabbedShowLayout-content': {
              backgroundColor: '#0a0a0a',
              border: '2px solid #6366f1',
              borderRadius: 2,
              borderTop: 'none',
              p: 0,
            },
            '& .MuiTabs-root': {
              backgroundColor: '#0a0a0a',
              border: '2px solid #6366f1',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                '&:hover': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#6366f1', height: 3 },
            },
          }}
        >
          <Tab label="Overview">
            <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
                Chapter Summary
              </Typography>
              <FunctionField
                source="summary"
                render={(record: any) =>
                  record.summary ? (
                    <Box
                      sx={{
                        p: 3,
                        bgcolor: '#0f0f0f',
                        borderRadius: 2,
                        border: '2px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      <Typography sx={{ color: '#ffffff', lineHeight: 1.7 }}>
                        {record.summary}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No summary available
                    </Typography>
                  )
                }
              />
            </Box>
          </Tab>
        </TabbedShowLayout>
      </Box>
    </Show>
  )
  ```

- [ ] **Step 4: Write ChapterEdit**

  ```tsx
  export const ChapterEdit = () => (
    <Edit>
      <SimpleForm
        toolbar={
          <EditToolbar
            resource="chapters"
            confirmTitle="Delete Chapter"
            confirmMessage="Are you sure you want to delete this chapter? This cannot be undone."
          />
        }
      >
        <Box sx={{ backgroundColor: '#0a0a0a', width: '100%', p: 3 }}>
          <Card
            elevation={0}
            sx={{
              maxWidth: '1000px',
              mx: 'auto',
              backgroundColor: '#0a0a0a',
              border: '2px solid #6366f1',
              borderRadius: 2,
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)',
            }}
          >
            <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 3, color: 'white' }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Edit3 size={32} />
                Edit Chapter
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                Update chapter information and details
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  '& .MuiTextField-root': {
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      '&:hover': { borderColor: 'rgba(99, 102, 241, 0.5)' },
                      '&.Mui-focused': { borderColor: '#6366f1' },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-focused': { color: '#6366f1' },
                    },
                    '& .MuiInputBase-input': { color: '#ffffff' },
                  },
                  '& .MuiFormControl-root': { mb: 3 },
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 3,
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#6366f1', mb: 2, fontWeight: 'bold' }}>
                        Basic Information
                      </Typography>
                      <NumberInput
                        source="number"
                        required
                        fullWidth
                        min={1}
                        max={539}
                        label="Chapter Number"
                        helperText="The chapter number (1-539)"
                      />
                      <TextInput
                        source="title"
                        fullWidth
                        label="Title"
                        helperText="Chapter title (optional)"
                      />
                      <TextInput
                        source="summary"
                        multiline
                        rows={5}
                        fullWidth
                        label="Summary"
                        helperText="Brief summary of this chapter's content"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </SimpleForm>
    </Edit>
  )
  ```

- [ ] **Step 5: Write ChapterCreate**

  ```tsx
  export const ChapterCreate = () => (
    <Create>
      <SimpleForm>
        <Box sx={{ backgroundColor: '#0a0a0a', width: '100%', p: 3 }}>
          <Card
            elevation={0}
            sx={{
              maxWidth: '1000px',
              mx: 'auto',
              backgroundColor: '#0a0a0a',
              border: '2px solid #16a34a',
              borderRadius: 2,
              boxShadow: '0 0 30px rgba(22, 163, 74, 0.2)',
            }}
          >
            <Box
              sx={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', p: 3, color: 'white' }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Plus size={32} />
                Create New Chapter
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                Add a new chapter to the system
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  '& .MuiTextField-root': {
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f',
                      border: '1px solid rgba(22, 163, 74, 0.3)',
                      '&:hover': { borderColor: 'rgba(22, 163, 74, 0.5)' },
                      '&.Mui-focused': { borderColor: '#16a34a' },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-focused': { color: '#16a34a' },
                    },
                    '& .MuiInputBase-input': { color: '#ffffff' },
                  },
                  '& .MuiFormControl-root': { mb: 3 },
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(22, 163, 74, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <NumberInput
                    source="number"
                    required
                    fullWidth
                    min={1}
                    max={539}
                    label="Chapter Number"
                    helperText="The chapter number (1-539)"
                  />
                  <TextInput
                    source="title"
                    fullWidth
                    label="Title"
                    helperText="Chapter title (optional)"
                  />
                  <TextInput
                    source="summary"
                    multiline
                    rows={5}
                    fullWidth
                    label="Summary"
                    helperText="Brief summary of this chapter's content"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </SimpleForm>
    </Create>
  )
  ```

- [ ] **Step 6: Verify the file compiles**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```
  Expected: no TypeScript errors in `Chapters.tsx`.

- [ ] **Step 7: Commit**

  ```bash
  git add client/src/components/admin/Chapters.tsx
  git commit -m "feat: add chapters admin resource (List, Show, Edit, Create)"
  ```

---

## Task 4: Register chapters Resource in AdminApp

**Files:**
- Modify: `client/src/app/admin/AdminApp.tsx`

- [ ] **Step 1: Add `Hash` to the lucide-react import**

  The existing import in `AdminApp.tsx` is:
  ```tsx
  import { Users, User, BookOpen, Crown, Zap, FileText, Image, Quote, Tag, Shield, Link2, Building2, MessageSquare, Library, Award } from 'lucide-react'
  ```

  Add `Hash`:
  ```tsx
  import { Users, User, BookOpen, Crown, Zap, FileText, Image, Quote, Tag, Shield, Link2, Building2, MessageSquare, Library, Award, Hash } from 'lucide-react'
  ```

- [ ] **Step 2: Add the HashIcon wrapper constant**

  Find the block of icon wrapper constants (around line 33) that look like:
  ```tsx
  const UsersIcon = () => <Users />
  const UserIcon = () => <User />
  // ... etc
  const LibraryIcon = () => <Library />
  const AwardIcon = () => <Award />
  ```

  Add after `AwardIcon`:
  ```tsx
  const HashIcon = () => <Hash />
  ```

- [ ] **Step 3: Import the Chapters components**

  Add this import after the existing `VolumeList/VolumeEdit/VolumeCreate/VolumeShow` import:
  ```tsx
  import { ChapterList, ChapterEdit, ChapterCreate, ChapterShow } from '../../components/admin/Chapters'
  ```

- [ ] **Step 4: Register the chapters Resource**

  Inside the `<Admin>` component in `AdminApp.tsx`, add the chapters resource. Place it after the volumes resource:
  ```tsx
  <Resource
    name="chapters"
    list={ChapterList}
    edit={ChapterEdit}
    create={ChapterCreate}
    show={ChapterShow}
    icon={HashIcon}
  />
  ```

- [ ] **Step 5: Verify full build**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```
  Expected: clean build, no TypeScript errors.

- [ ] **Step 6: Commit**

  ```bash
  git add client/src/app/admin/AdminApp.tsx
  git commit -m "feat: register chapters resource in admin app"
  ```

---

## Task 5: Smoke-test in browser

- [ ] **Step 1: Start the dev server**

  ```bash
  cd client && yarn dev
  ```

- [ ] **Step 2: Navigate to the admin panel**

  Open `http://localhost:3000/admin` and log in with an admin account.

- [ ] **Step 3: Verify menu structure**

  Confirm the sidebar shows:
  - **Core Content**: Characters, Arcs, Gambles, Events (no Volumes)
  - **Reference Data**: Organizations, Quotes, Tags, Volumes, Chapters

- [ ] **Step 4: Verify Chapters CRUD works**

  - Click **Chapters** → list loads sorted by number
  - Click a row → Show view renders with header and Summary tab
  - Click **Edit** → form renders with number, title, summary fields and delete button in toolbar
  - Click **Create** → green-themed form renders with same fields, no delete button

- [ ] **Step 5: Final commit if any fixes were needed**

  ```bash
  git add -p
  git commit -m "fix: address smoke-test issues in chapters admin"
  ```
