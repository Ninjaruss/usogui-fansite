'use client'

import React from 'react'
import { ActionIcon, Group, Divider, Tooltip } from '@mantine/core'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  UserPlus,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor | null
  onInsertEntity: () => void
}

export default function Toolbar({ editor, onInsertEntity }: ToolbarProps) {
  if (!editor) return null

  const btn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    isActive?: boolean,
  ) => (
    <Tooltip label={label} withArrow position="top" openDelay={400}>
      <ActionIcon
        variant={isActive ? 'filled' : 'subtle'}
        color={isActive ? 'blue' : 'gray'}
        size="sm"
        onClick={onClick}
        aria-label={label}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  )

  return (
    <Group gap={2} px={6} py={4} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} wrap="wrap">
      {btn(
        'Bold',
        <Bold size={14} />,
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
      )}
      {btn(
        'Italic',
        <Italic size={14} />,
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
      )}

      <Divider orientation="vertical" />

      {btn(
        'Heading 1',
        <Heading1 size={14} />,
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 }),
      )}
      {btn(
        'Heading 2',
        <Heading2 size={14} />,
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
      )}

      <Divider orientation="vertical" />

      {btn(
        'Bullet List',
        <List size={14} />,
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
      )}
      {btn(
        'Ordered List',
        <ListOrdered size={14} />,
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
      )}

      <Divider orientation="vertical" />

      {btn(
        'Blockquote',
        <Quote size={14} />,
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote'),
      )}
      {btn(
        'Link',
        <Link2 size={14} />,
        () => {
          const url = window.prompt('Enter URL')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          } else if (url === '') {
            editor.chain().focus().unsetLink().run()
          }
        },
        editor.isActive('link'),
      )}

      <Divider orientation="vertical" />

      <Tooltip label="Insert entity embed" withArrow position="top" openDelay={400}>
        <ActionIcon
          variant="subtle"
          color="violet"
          size="sm"
          onClick={onInsertEntity}
          aria-label="Insert entity embed"
        >
          <UserPlus size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
