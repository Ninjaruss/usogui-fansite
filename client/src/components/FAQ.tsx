'use client'

import React, { useState } from 'react'
import { Box, Text, Accordion, Paper, Anchor, Group, SimpleGrid, useMantineTheme, rgba } from '@mantine/core'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

const faqData: FAQItem[] = [
  {
    question: 'What is L-file?',
    answer:
      "L-file is an unofficial fan-made database for the manga Usogui (Lie Eater) by Sako Toshio. It collects information about characters, story arcs, gambles, and related details to help readers explore and understand this complex series."
  },
  {
    question: 'Where can I read Usogui?',
    answer: (
      <>
        <Text component="p" size="sm" style={{ marginBottom: '1rem' }}>
          At this time, Usogui does not have an official English digital or print release.
        </Text>

        <Box
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderLeft: '4px solid',
            borderColor: 'var(--mantine-color-red-5)',
            backgroundColor: 'rgba(25,118,210,0.1)',
            borderRadius: '0.5rem'
          }}
        >
          <Text size="sm" style={{ marginBottom: '0.5rem' }}>
            The best way to support Sako Toshio is by purchasing the official Japanese volumes if possible, which helps show international interest in the series.
          </Text>
          <Text size="sm">
            Sako's newer work Genikasuri (Pocketeer) is officially available in English on Manga Plus.
          </Text>
          <Anchor
            component="a"
            href="https://mangaplus.shueisha.co.jp/titles/100507"
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}
          >
            <Group gap="md" align="center">
              <Box
                component="img"
                src="https://jumpg-assets.tokyo-cdn.com/secure/title/100507/title_thumbnail_portrait_list/424427.jpg?hash=4NSvp5UuCWBI_jZFPFggbg&expires=2145884400"
                alt="Genikasuri (Pocketeer) thumbnail"
                style={{
                  width: 96,
                  height: 136,
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
                  border: '1px solid var(--mantine-color-dark-4)'
                }}
                loading="lazy"
              />
              <Box>
                <Text fw={600} size="sm">
                  Genikasuri (Pocketeer)
                </Text>
                <Text size="xs" c="dimmed">
                  View on Manga Plus
                </Text>
              </Box>
            </Group>
          </Anchor>
        </Box>
      </>
    )
  },
  {
    question: 'Is this website officially affiliated with the creators?',
    answer:
      'No. L-file is an independent fan project and is not affiliated with Sako Toshio, Shueisha, or any official publishers. It is created by fans for the Usogui community.'
  },
  {
    question: 'Can I contribute content to L-file?',
    answer: (
      <>
        <Text component="p" size="sm" style={{ marginBottom: '1rem' }}>
          Yes! Registered users can submit guides, media, and other contributions.{' '}
          <Anchor component={Link} href="/login" color="red.5">
            Login via Fluxer
          </Anchor>{' '}
          to get started. All submissions are moderated for quality and accuracy.
        </Text>

        <Text component="p" size="sm" style={{ marginBottom: '1rem' }}>
          Interested in a more active role? The following positions are open — reach out by emailing{' '}
          <Anchor href={`mailto:${'contact'}@${'ninjaruss.net'}`} color="red.5">
            {'contact'}@{'ninjaruss.net'}
          </Anchor>{' '}
          or by sending me a direct message on Fluxer.
        </Text>

        <SimpleGrid cols={2} spacing="sm">
          <Box
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.6rem',
              border: '1px solid rgba(225,29,72,0.25)',
              backgroundColor: 'rgba(225,29,72,0.06)'
            }}
          >
            <Text fw={700} size="sm" style={{ color: 'rgba(225,29,72,0.9)', marginBottom: '0.35rem' }}>
              Editor
            </Text>
            <Text size="xs" style={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              Adds and maintains database entries — characters, arcs, gambles, chapters, and related details. Requires familiarity with the full series.
            </Text>
          </Box>

          <Box
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.6rem',
              border: '1px solid rgba(225,29,72,0.25)',
              backgroundColor: 'rgba(225,29,72,0.06)'
            }}
          >
            <Text fw={700} size="sm" style={{ color: 'rgba(225,29,72,0.9)', marginBottom: '0.35rem' }}>
              Moderator
            </Text>
            <Text size="xs" style={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              Reviews and approves community submissions such as guides, media, and annotations. Helps keep content accurate and on-topic.
            </Text>
          </Box>
        </SimpleGrid>
      </>
    )
  },
  {
    question: 'Does this website contain spoilers?',
    answer:
      'Yes. L-file includes information from across the entire series, including major plot developments. You can set chapter progress to hide spoilers, but readers who want a blind experience should finish the manga first.'
  },
  {
    question: 'How do I track my reading progress?',
    answer: (
      <>
        After{' '}
        <Anchor component={Link} href="/login" color="red.5">
          logging in with Fluxer
        </Anchor>
        , you can mark chapters as read using the chapter button on the bottom right of the screen.

        {' '}Your progress syncs across devices while logged in. Even without an account, progress is saved locally on your device.
      </>
    )
  }
]

interface FAQProps {
  showTitle?: boolean
  maxItems?: number
}

export const FAQ: React.FC<FAQProps> = ({ showTitle = true, maxItems }) => {
  const theme = useMantineTheme()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const itemsToShow = maxItems ? faqData.slice(0, maxItems) : faqData
  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch (error) {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const highlightBorder = withAlpha(accent, 0.55, 'rgba(225, 29, 72, 0.55)')
  const highlightRing = withAlpha(accent, 0.35, 'rgba(225, 29, 72, 0.35)')
  const baseBackground = withAlpha(surface, 0.88, surface)
  const muted = withAlpha('#ffffff', 0.7, 'rgba(255, 255, 255, 0.7)')

  return (
    <Box>
      {showTitle && (
        <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Text fw={700} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Frequently Asked Questions
          </Text>
          <Text size="md" style={{ color: muted }}>
            Common questions about L-file and the Usogui series
          </Text>
        </Box>
      )}

      <Paper
        shadow="sm"
        p="md"
        radius="md"
        className="community-card-elevated"
        style={{
          backgroundColor: withAlpha(surface, 0.94, surface),
          border: `1px solid ${borderColor}`,
          '--card-accent': 'rgba(225,29,72,0.4)',
          '--card-shadow': 'rgba(225,29,72,0.10)'
        } as React.CSSProperties}
      >
        <Accordion
          value={expanded}
          onChange={setExpanded}
          chevron={
            <motion.div animate={{ rotate: 0 }} style={{ display: 'flex' }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          }
          chevronPosition="right"
          multiple={false}
        >
          {itemsToShow.map((faq, index) => {
            const value = `panel${index}`
            const isActive = expanded === value
            const isHighlighted = isActive || hovered === value

            return (
              <Accordion.Item
                key={value}
                value={value}
                className={isActive ? 'faq-item-shimmer' : undefined}
                style={{
                  border: `1px solid ${isHighlighted ? highlightBorder : borderColor}`,
                  borderLeft: isActive ? `2px solid rgba(225,29,72,0.6)` : `1px solid ${isHighlighted ? highlightBorder : borderColor}`,
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                  backgroundColor: baseBackground,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: isHighlighted ? `0 0 0 2px ${highlightRing}` : 'none'
                }}
              >
                <Accordion.Control
                  onMouseEnter={() => setHovered(value)}
                  onMouseLeave={() => setHovered((current) => (current === value ? null : current))}
                  onFocus={() => setHovered(value)}
                  onBlur={() => setHovered((current) => (current === value ? null : current))}
                  style={{
                    padding: '0.9rem 1.1rem',
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.85)',
                    backgroundColor: 'transparent',
                    transition: 'color 0.2s ease'
                  }}
                >
                  <Text fw={600}>{faq.question}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Box style={{ color: muted, fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {faq.answer}
                    </Box>
                  </motion.div>
                </Accordion.Panel>
              </Accordion.Item>
            )
          })}
        </Accordion>
      </Paper>
    </Box>
  )
}
