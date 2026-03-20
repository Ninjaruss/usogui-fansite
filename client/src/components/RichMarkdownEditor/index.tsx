'use client'

import React, { useCallback, useEffect, useId, useState } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { Box, InputWrapper } from '@mantine/core'
import type { NodeViewProps } from '@tiptap/react'

import { EntityEmbedExtension } from './EntityEmbedExtension'
import type { EntityType } from './EntityEmbedExtension'
import Toolbar from './Toolbar'
import InsertEntityModal from './InsertEntityModal'
import EntityCard from '../EntityCard'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'

// NodeView renders an entity embed chip inside the editor
function EntityEmbedNodeView({ node }: NodeViewProps) {
  const { entityType, entityId, displayText } = node.attrs as {
    entityType: EntityType
    entityId: number
    displayText: string | null
  }

  return (
    <NodeViewWrapper as="span" contentEditable={false} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <EntityCard
        type={entityType}
        id={entityId}
        displayText={displayText ?? undefined}
        inline
      />
    </NodeViewWrapper>
  )
}

// Extend EntityEmbedExtension to add the NodeView renderer
const EntityEmbedWithNodeView = EntityEmbedExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EntityEmbedNodeView)
  },
})

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

export default function RichMarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  maxHeight,
  label,
  'aria-label': ariaLabel,
  disabled = false,
}: RichMarkdownEditorProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const [modalOpen, setModalOpen] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Markdown,
        EntityEmbedWithNodeView,
      ],
      content: value,
      editable: !disabled,
      onUpdate({ editor }) {
        const md: string = (editor.storage as { markdown: { getMarkdown(): string } }).markdown.getMarkdown()
        setIsEmpty(editor.isEmpty)
        onChange(md)
      },
    },
    [disabled],
  )

  // Sync external value resets (e.g. form reset after submit) back into the editor.
  // Using emitUpdate=false prevents triggering onChange, avoiding an infinite loop.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = (editor.storage as { markdown: { getMarkdown(): string } }).markdown.getMarkdown()
    if (current !== value) {
      editor.commands.setContent(value, false)
      setIsEmpty(editor.isEmpty)
    }
  }, [editor, value])

  const handleInsertEntity = useCallback(
    (attrs: { entityType: EntityType; entityId: number; displayText: string | null }) => {
      if (!editor) return
      editor.chain().focus().insertEntityEmbed(attrs).run()
    },
    [editor],
  )

  if (disabled) {
    return (
      <InputWrapper
        label={label}
        aria-label={ariaLabel}
        labelProps={label ? { id: labelId } : undefined}
      >
        <EnhancedSpoilerMarkdown
          content={value}
          enableEntityEmbeds
          compactEntityCards={false}
        />
      </InputWrapper>
    )
  }

  return (
    <InputWrapper
      label={label}
      aria-label={ariaLabel}
      labelProps={label ? { id: labelId } : undefined}
    >
      <Box
        style={{
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-sm)',
          overflow: 'hidden',
        }}
      >
        <Toolbar editor={editor} onInsertEntity={() => setModalOpen(true)} />

        <Box
          style={{
            minHeight,
            maxHeight: maxHeight ?? undefined,
            overflowY: maxHeight ? 'auto' : undefined,
            padding: '8px 12px',
            position: 'relative',
          }}
        >
          {isEmpty && placeholder && (
            <Box
              style={{
                position: 'absolute',
                top: 8,
                left: 12,
                color: 'var(--mantine-color-placeholder)',
                fontSize: 'var(--mantine-font-size-sm)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {placeholder}
            </Box>
          )}
          <EditorContent
            editor={editor}
            aria-labelledby={label ? labelId : undefined}
            aria-label={!label ? ariaLabel : undefined}
            style={{ outline: 'none', minHeight }}
          />
        </Box>
      </Box>

      <InsertEntityModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onInsert={handleInsertEntity}
      />
    </InputWrapper>
  )
}
