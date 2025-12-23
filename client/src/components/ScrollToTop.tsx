'use client'

import { useState, useEffect } from 'react'
import { ActionIcon, Transition, useMantineTheme } from '@mantine/core'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopProps {
  threshold?: number
  accentColor?: string
}

export function ScrollToTop({ threshold = 400, accentColor }: ScrollToTopProps) {
  const theme = useMantineTheme()
  const [isVisible, setIsVisible] = useState(false)

  const color = accentColor || theme.colors.blue[5]

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Transition mounted={isVisible} transition="slide-up" duration={200}>
      {(styles) => (
        <ActionIcon
          onClick={scrollToTop}
          size="xl"
          radius="xl"
          variant="filled"
          aria-label="Scroll to top"
          style={{
            ...styles,
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            backgroundColor: color,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <ArrowUp size={20} />
        </ActionIcon>
      )}
    </Transition>
  )
}

export default ScrollToTop
