'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'

interface SpoilerMarkdownProps {
  content: string
  className?: string
}

const SpoilerMarkdown: React.FC<SpoilerMarkdownProps> = ({ content, className }) => {
  // Custom renderer for handling spoiler blocks
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
    
    // Handle custom spoiler components: :::spoiler Chapter X
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
    }
  }

  return (
    <div className={className}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default SpoilerMarkdown