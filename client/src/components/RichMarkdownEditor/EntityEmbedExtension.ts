import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRendererProps } from '@tiptap/core'

export type EntityType =
  | 'character'
  | 'arc'
  | 'gamble'
  | 'guide'
  | 'organization'
  | 'chapter'
  | 'volume'
  | 'quote'

const ENTITY_TYPES: EntityType[] = [
  'character',
  'arc',
  'gamble',
  'guide',
  'organization',
  'chapter',
  'volume',
  'quote',
]

const ENTITY_TYPES_PATTERN = ENTITY_TYPES.join('|')

/**
 * Custom Tiptap Node extension for entity embeds.
 * Serializes to {{entityType:entityId}} or {{entityType:entityId:displayText}}
 * Parses those tokens back from markdown via a markdown-it plugin.
 */
export const EntityEmbedExtension = Node.create({
  name: 'entityEmbed',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      entityType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-type'),
        renderHTML: (attrs) => ({ 'data-entity-type': attrs.entityType }),
      },
      entityId: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-entity-id')
          return raw ? parseInt(raw, 10) : null
        },
        renderHTML: (attrs) => ({ 'data-entity-id': attrs.entityId }),
      },
      displayText: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-display-text') ?? null,
        renderHTML: (attrs) => ({
          'data-display-text': attrs.displayText ?? '',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-entity-embed]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-entity-embed': 'true',
        'data-entity-type': node.attrs.entityType,
        'data-entity-id': node.attrs.entityId,
        'data-display-text': node.attrs.displayText ?? '',
      }),
      `{{${node.attrs.entityType}:${node.attrs.entityId}${node.attrs.displayText ? `:${node.attrs.displayText}` : ''}}}`,
    ]
  },

  addCommands() {
    return {
      insertEntityEmbed:
        (attrs: { entityType: EntityType; entityId: number; displayText?: string | null }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              entityType: attrs.entityType,
              entityId: attrs.entityId,
              displayText: attrs.displayText ?? null,
            },
          })
        },
    }
  },

  /**
   * tiptap-markdown integration via addStorage().
   *
   * The tiptap-markdown library reads `extension.storage.markdown` for each
   * extension during serialization and parsing (see getMarkdownSpec() in
   * tiptap-markdown/src/util/extensions.js).
   *
   * Serializer: called with (state, node) where state is a prosemirror-markdown
   * MarkdownSerializerState. We write the entity embed token directly.
   *
   * Parser: called with a markdown-it instance.
   *   - setup(md): register an inline rule that converts {{type:id[:text]}} tokens
   *     to HTML, which Tiptap then parses back via parseHTML().
   *   - updateDOM(element): optional DOM fixup after markdown-it renders.
   */
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const { entityType, entityId, displayText } = node.attrs
          if (displayText && typeof displayText === 'string' && displayText.length > 0) {
            state.write(`{{${entityType}:${entityId}:${displayText}}}`)
          } else {
            state.write(`{{${entityType}:${entityId}}}`)
          }
        },
        parse: {
          setup(markdownit: any) {
            // Register an inline rule that matches {{type:id}} and {{type:id:text}} tokens
            markdownit.core.ruler.push('entity_embed', (stateCore: any) => {
              const entityRegex = new RegExp(
                `\\{\\{(${ENTITY_TYPES_PATTERN}):(\\d+)(?::([^}]*))?\\}\\}`,
                'g',
              )

              for (const token of stateCore.tokens) {
                if (token.type !== 'inline' || !token.children) continue

                const newChildren: any[] = []

                for (const child of token.children) {
                  if (child.type !== 'text') {
                    newChildren.push(child)
                    continue
                  }

                  const text: string = child.content
                  let lastIndex = 0
                  let match

                  entityRegex.lastIndex = 0
                  while ((match = entityRegex.exec(text)) !== null) {
                    // Push any text before the match
                    if (match.index > lastIndex) {
                      const before = new stateCore.Token('text', '', 0)
                      before.content = text.slice(lastIndex, match.index)
                      newChildren.push(before)
                    }

                    const [, entityType, entityId, displayText] = match

                    // Build an HTML token for the entity embed span
                    const htmlToken = new stateCore.Token('html_inline', '', 0)
                    const displayAttr = displayText ? ` data-display-text="${displayText}"` : ' data-display-text=""'
                    htmlToken.content = `<span data-entity-embed="true" data-entity-type="${entityType}" data-entity-id="${entityId}"${displayAttr}>{{${entityType}:${entityId}${displayText ? `:${displayText}` : ''}}}</span>`
                    newChildren.push(htmlToken)

                    lastIndex = match.index + match[0].length
                  }

                  // Push remaining text after last match
                  if (lastIndex < text.length) {
                    const after = new stateCore.Token('text', '', 0)
                    after.content = text.slice(lastIndex)
                    newChildren.push(after)
                  }

                }

                // Only replace if we actually changed something
                if (newChildren.length !== token.children.length || newChildren.some((c, i) => c !== token.children[i])) {
                  token.children = newChildren
                }
              }
            })
          },
        },
      },
    }
  },
})

// Extend Tiptap's Commands interface so insertEntityEmbed is properly typed
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    entityEmbed: {
      insertEntityEmbed: (attrs: {
        entityType: EntityType
        entityId: number
        displayText?: string | null
      }) => ReturnType
    }
  }
}
