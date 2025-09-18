'use client'

import React, { useState } from 'react'
import { Box, Text, Accordion, Paper, Anchor, Group, useMantineTheme } from '@mantine/core'
import { ChevronDown, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

const faqData: FAQItem[] = [
  {
    question: 'What is L-file?',
    answer:
      "L-file is an unofficial fan database for the manga series 'Usogui' (Lie Eater) by Sako Toshio. We provide comprehensive information about characters, story arcs, gambling games, and more to help fans explore and understand this complex series."
  },
  {
    question: 'Where can I read Usogui?',
    answer: (
      <>
        <Text component="p" size="sm" style={{ marginBottom: '1rem' }}>
          We understand the desire to read this incredible series! Unfortunately, there is <b>no official English license or release for Usogui</b>. This means no official digital chapters on apps like Viz Manga or Manga Plus, and no official physical volumes in English.
          For this reason, the primary way the international community has accessed Usogui has been through fan translations. The most complete and well-regarded fan translation was done by Team Duwang.
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
            The best way to support Sako-sensei is to purchase the official Japanese volumes if you are able. This shows the publisher there is international interest and could one day help motivate an official English release.
          </Text>
          <Text size="sm">
            Another way to support Sako-sensei is by reading his most recent work that is available officially in English:
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

        <Text component="p" size="sm">
          This fan site is not affiliated with any scanlation group. We provide this information for educational and informational purposes only. We encourage all fans to support the official release should it ever become available in their region.
        </Text>
      </>
    )
  },
  {
    question: 'Is this website officially affiliated with the creators?',
    answer:
      'No, L-file is an independent fan project and is not officially affiliated with Sako Toshio, Shueisha, or any official Usogui publishers. This is a fan-made resource created by and for the Usogui community.'
  },
  {
    question: 'Can I contribute content to L-file?',
    answer: (
      <>
        Yes! Registered users can contribute guides and submit fanart/videos through media submissions.
        You can{' '}
        <Anchor component={Link} href="/login" color="red.5">
          login via Discord
        </Anchor>{' '}
        to start contributing. All submissions are moderated to maintain quality and accuracy. If you would like to help with data entry, please join the
        <Anchor component="a" href="https://discord.gg/JXeRhV2qpY" color="red.5" target="_blank" rel="noopener noreferrer">
          {' '}Discord
        </Anchor>{' '}community.
      </>
    )
  },
  {
    question: 'Does this website contain spoilers?',
    answer:
      'Yes, L-file contains detailed information about the entire Usogui series, including major plot points, character developments, and story outcomes. Although chapter progress can be set to hide spoilers, we recommend completing the manga before browsing if you want to avoid spoilers.'
  },
  {
    question: 'How do I track my reading progress?',
    answer: (
      <>
        After{' '}
        <Anchor component={Link} href="/login" color="red.5">
          logging in with Discord
        </Anchor>
        , you can mark chapters as read using the chapter button on the bottom right of the screen. Your progress is saved and synced across devices when you're logged in. Chapter progress is also tracked locally, so you can keep track even without an account!
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
      return theme.fn?.rgba?.(color, alpha) ?? fallback
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
          <Group justify="center" gap="sm" style={{ marginBottom: '0.75rem' }}>
            <HelpCircle className="w-6 h-6" color={theme.other?.usogui?.character || accent} />
            <Text fw={700} size="xl">
              Frequently Asked Questions
            </Text>
          </Group>
          <Text size="md" style={{ color: muted }}>
            Common questions about L-file and the Usogui series
          </Text>
        </Box>
      )}

      <Paper
        shadow="sm"
        padding="md"
        radius="md"
        style={{
          backgroundColor: withAlpha(surface, 0.94, surface),
          border: `1px solid ${borderColor}`
        }}
      >
        <Accordion
          value={expanded}
          onChange={setExpanded}
          chevron={<ChevronDown className="w-4 h-4" />}
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
                style={{
                  border: `1px solid ${isHighlighted ? highlightBorder : borderColor}`,
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
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
                    color: '#ffffff',
                    backgroundColor: 'transparent',
                    transition: 'color 0.2s ease'
                  }}
                >
                  <Text fw={600}>{faq.question}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box style={{ color: muted, fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {faq.answer}
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            )
          })}
        </Accordion>
      </Paper>
    </Box>
  )
}
