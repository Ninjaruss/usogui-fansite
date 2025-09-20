'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box } from '@mantine/core'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
import EntityCard from './EntityCard'
import { parseEntityEmbeds } from '../lib/entityEmbedParser'

interface EnhancedSpoilerMarkdownProps {
  content: string
  className?: string
  enableEntityEmbeds?: boolean
  compactEntityCards?: boolean
}

const EnhancedSpoilerMarkdown: React.FC<EnhancedSpoilerMarkdownProps> = ({ 
  content, 
  className,
  enableEntityEmbeds = true,
  compactEntityCards = false
}) => {
  // Process the content to extract embeds and create a processed version
  const { processedMarkdown, embedMap } = useMemo(() => {
    if (!enableEntityEmbeds) {
      return { processedMarkdown: content, embedMap: new Map() }
    }

    const { content: parsedContent, embeds } = parseEntityEmbeds(content)
    const embedLookup = new Map<string, React.ReactElement>()
    
    // Create React components for each embed
    embeds.forEach((embed) => {
      const component = (
        <Box
          key={embed.id}
          component="span"
          style={{
            display: compactEntityCards ? 'inline' : 'inline-block',
            margin: compactEntityCards ? '0 4px' : '4px 2px',
            verticalAlign: compactEntityCards ? 'middle' : 'top'
          }}
        >
          <EntityCard
            type={embed.type}
            id={embed.entityId}
            displayText={embed.displayText}
            compact={compactEntityCards}
            inline={true}
          />
        </Box>
      )
      
      embedLookup.set(embed.placeholder, component)
    })

    return { processedMarkdown: parsedContent, embedMap: embedLookup }
  }, [content, enableEntityEmbeds, compactEntityCards])

  // Lightweight preprocessor to convert single newlines into markdown hard breaks
  // while avoiding code fences so code blocks remain intact.
  const processedForLineBreaks = useMemo(() => {
    const text = processedMarkdown

    if (!text) return text

    let inCodeBlock = false
    const lines = text.split('\n')
    const out: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Toggle code fence state (```)
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock
        out.push(line)
        continue
      }

      if (inCodeBlock) {
        out.push(line)
        continue
      }

      const nextLine = lines[i + 1]

      // If this line and the next are both non-empty, and this line isn't a
      // list/heading/blockquote/code-indented line, add two trailing spaces to
      // force a markdown hard break. Skip if already ends with two spaces.
      const isCurrentNonEmpty = line.trim() !== ''
      const isNextNonEmpty = typeof nextLine !== 'undefined' && nextLine.trim() !== ''
      const isListOrHeading = /^\s*([*+-]|\d+\.)\s+/.test(line) || /^\s*#{1,6}\s+/.test(line) || /^\s*>\s+/.test(line)
      const isIndentedCode = /^\s{4,}/.test(line)

      if (isCurrentNonEmpty && isNextNonEmpty && !isListOrHeading && !isIndentedCode) {
        if (!/\s{2}$/.test(line)) {
          out.push(line + '  ')
        } else {
          out.push(line)
        }
      } else {
        out.push(line)
      }
    }

    return out.join('\n')
  }, [processedMarkdown])

  // Custom renderer that handles embed replacement in text content
  const components = {
    // Handle blockquotes as spoilers if they contain spoiler marker
    blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => {
      const text = React.Children.toArray(children).join('')
      
      // Check for spoiler syntax: > [!SPOILER Chapter X] content
      const spoilerMatch = text.match(/^\[!SPOILER(?:\s+Chapter\s+(\d+))?\]\s*(.*)/i)
      
      if (spoilerMatch) {
        const chapterNum = spoilerMatch[1] ? parseInt(spoilerMatch[1], 10) : undefined
        const spoilerContent = spoilerMatch[2]
        
        return (
          <TimelineSpoilerWrapper
            chapterNumber={chapterNum}
          >
            <blockquote {...props} style={{
              borderLeft: '4px solid #dc004e',
              paddingLeft: '16px',
              marginLeft: 0,
              fontStyle: 'italic',
              backgroundColor: 'rgba(220, 0, 78, 0.05)',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              {spoilerContent}
            </blockquote>
          </TimelineSpoilerWrapper>
        )
      }
      
      return <blockquote {...props}>{children}</blockquote>
    },
    
    // Handle custom spoiler components
    div: ({ children, className: divClassName, ...props }: React.ComponentProps<'div'>) => {
      // Check for spoiler container class
      if (divClassName?.includes('spoiler')) {
        const text = React.Children.toArray(children).join('')
        const chapterMatch = text.match(/Chapter\s+(\d+)/i)
        const chapterNum = chapterMatch ? parseInt(chapterMatch[1], 10) : undefined
        
        return (
          <TimelineSpoilerWrapper
            chapterNumber={chapterNum}
          >
            <div className={divClassName} {...props}>{children}</div>
          </TimelineSpoilerWrapper>
        )
      }
      
      return <div className={divClassName} {...props}>{children}</div>
    },

    // Handle paragraphs and replace embed placeholders
    p: ({ children, ...props }: React.ComponentProps<'p'>) => {
      // Check if the paragraph content contains embed placeholders
      const textContent = React.Children.toArray(children).join('')
      const hasEmbedPlaceholders = enableEntityEmbeds && embedMap.size > 0 && 
        Array.from(embedMap.keys()).some(placeholder => textContent.includes(placeholder))

      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })

      // If we have embedded components, use a div to avoid invalid HTML nesting
      if (hasEmbedPlaceholders) {
        return <div {...props} style={{ margin: '1em 0', ...props.style }}>{processedChildren}</div>
      }

      return <p {...props}>{processedChildren}</p>
    },

    // Handle other text containers
    h1: ({ children, ...props }: React.ComponentProps<'h1'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h1 {...props}>{processedChildren}</h1>
    },

    h2: ({ children, ...props }: React.ComponentProps<'h2'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h2 {...props}>{processedChildren}</h2>
    },

    h3: ({ children, ...props }: React.ComponentProps<'h3'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h3 {...props}>{processedChildren}</h3>
    },

    h4: ({ children, ...props }: React.ComponentProps<'h4'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h4 {...props}>{processedChildren}</h4>
    },

    h5: ({ children, ...props }: React.ComponentProps<'h5'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h5 {...props}>{processedChildren}</h5>
    },

    h6: ({ children, ...props }: React.ComponentProps<'h6'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <h6 {...props}>{processedChildren}</h6>
    },

    li: ({ children, ...props }: React.ComponentProps<'li'>) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return replaceEmbedPlaceholders(child)
        }
        return child
      })
      return <li {...props}>{processedChildren}</li>
    }
  }

  // Function to replace embed placeholders in text with React components
  const replaceEmbedPlaceholders = (text: string): React.ReactNode => {
    if (!enableEntityEmbeds || embedMap.size === 0) {
      return text
    }

    const parts: React.ReactNode[] = []
    let remainingText = text
    let keyCounter = 0

    for (const [placeholder, component] of embedMap.entries()) {
      const index = remainingText.indexOf(placeholder)
      if (index !== -1) {
        // Add text before placeholder
        if (index > 0) {
          parts.push(remainingText.substring(0, index))
        }

        // Add the component
        parts.push(React.cloneElement(component, { key: `embed-${keyCounter++}` }))

        // Update remaining text
        remainingText = remainingText.substring(index + placeholder.length)
      }
    }

    // Add any remaining text
    if (remainingText.length > 0) {
      parts.push(remainingText)
    }

    return parts.length > 0 ? <>{parts}</> : text
  }

  return (
    <div className={className}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedForLineBreaks}
      </ReactMarkdown>
    </div>
  )
}

export default EnhancedSpoilerMarkdown
