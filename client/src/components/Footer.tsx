'use client'

import React from 'react'
import { Box, Text, Anchor, Group, Container, Stack, Divider } from '@mantine/core'
import { MessageCircle, Heart, ExternalLink, Info, BookOpen, Users, Dices, Image } from 'lucide-react'
import NextLink from 'next/link'
import { motion } from 'motion/react'
import { DiagonalStripes, SuitWatermark } from './decorative/MangaPatterns'

// ─── Animation variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay }
  })
}

// ─── Full-width red accent line ───────────────────────────────────────────
function TopAccentLine() {
  return (
    <Box
      aria-hidden="true"
      style={{
        height: 2,
        background:
          'linear-gradient(90deg, transparent 0%, #e11d48 30%, #e11d48 70%, transparent 100%)',
        opacity: 0.9,
        flexShrink: 0
      }}
    />
  )
}

// ─── Thin rule with red center dot ────────────────────────────────────────
function DossierRule() {
  return (
    <Box
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 36
      }}
    >
      <Box style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <Box
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#e11d48',
          flexShrink: 0
        }}
      />
      <Box style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </Box>
  )
}

// ─── Column label ─────────────────────────────────────────────────────────
function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size="xs"
      style={{
        fontFamily: 'var(--font-noto-sans)',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)',
        marginBottom: 14
      }}
    >
      {children}
    </Text>
  )
}

// ─── Plain nav link ────────────────────────────────────────────────────────
function FooterNavLink({
  href,
  icon: Icon,
  children,
  external = false,
  ariaLabel
}: {
  href: string
  icon?: React.ElementType
  children: React.ReactNode
  external?: boolean
  ariaLabel?: string
}) {
  const sharedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontSize: '0.8125rem',
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    padding: '5px 0',
    transition: 'color 200ms ease'
  }

  const hoverStyles = {
    root: {
      '&:hover': { color: '#ffffff' }
    }
  }

  if (external) {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        underline="never"
        style={sharedStyle}
        styles={hoverStyles}
      >
        {Icon && <Icon size={13} aria-hidden="true" />}
        {children}
        <ExternalLink size={11} aria-hidden="true" style={{ opacity: 0.35 }} />
      </Anchor>
    )
  }

  return (
    <Anchor
      component={NextLink}
      href={href}
      underline="never"
      style={sharedStyle}
      styles={hoverStyles}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </Anchor>
  )
}

// ─── Bordered CTA link ────────────────────────────────────────────────────
function CtaLink({
  href,
  icon: Icon,
  children,
  ariaLabel,
  accentColor
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  ariaLabel: string
  accentColor: string
}) {
  return (
    <Anchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      underline="never"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: accentColor,
        textDecoration: 'none',
        padding: '8px 14px',
        border: `1px solid ${accentColor}40`,
        borderRadius: 6,
        background: `${accentColor}12`,
        transition: 'all 200ms ease'
      }}
      styles={{
        root: {
          '&:hover': {
            background: `${accentColor}22`,
            borderColor: `${accentColor}70`,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 20px ${accentColor}25`
          }
        }
      }}
    >
      <Icon size={15} aria-hidden="true" />
      {children}
    </Anchor>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <Box
      component="footer"
      role="contentinfo"
      aria-label="Site footer"
      style={{
        marginTop: 'auto',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(10, 10, 10, 0.98)'
      }}
    >
      <TopAccentLine />

      {/* Subtle diagonal hatching — manga/dossier texture */}
      <DiagonalStripes color="rgba(225,29,72,0.05)" width={1} gap={10} />

      {/* Spade watermark — gambling motif */}
      <SuitWatermark
        suit="spade"
        color="#e11d48"
        size={240}
        opacity={0.025}
        position="bottom-left"
      />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Box style={{ padding: '52px 0 0' }}>

          {/* Brand block */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            custom={0}
            variants={fadeUp}
          >
            <Stack gap={6} style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontFamily: 'var(--font-opti-goudy-text)',
                  fontSize: '2rem',
                  fontWeight: 400,
                  color: '#e11d48',
                  lineHeight: 1,
                  letterSpacing: '0.01em'
                }}
              >
                L-File
              </Text>
              <Text
                size="xs"
                style={{
                  color: 'rgba(255,255,255,0.28)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 500
                }}
              >
                The Usogui manga database
              </Text>
            </Stack>
          </motion.div>

          <DossierRule />

          {/* Three-column content grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '2.5rem',
              marginBottom: 48
            }}
          >
            {/* Col 1: Explore */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={0.05}
              variants={fadeUp}
            >
              <Stack gap={0}>
                <ColumnLabel>Explore</ColumnLabel>
                <FooterNavLink href="/characters" icon={Users}>Characters</FooterNavLink>
                <FooterNavLink href="/arcs" icon={BookOpen}>Arcs</FooterNavLink>
                <FooterNavLink href="/gambles" icon={Dices}>Gambles</FooterNavLink>
              </Stack>
            </motion.div>

            {/* Col 2: Community */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={0.1}
              variants={fadeUp}
            >
              <Stack gap={0}>
                <ColumnLabel>Community</ColumnLabel>
                <FooterNavLink href="/guides" icon={BookOpen}>Guides</FooterNavLink>
                <FooterNavLink href="/media" icon={Image}>Media</FooterNavLink>
                <FooterNavLink href="/about" icon={Info}>About</FooterNavLink>
              </Stack>
            </motion.div>

            {/* Col 3: Support */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={0.15}
              variants={fadeUp}
            >
              <Stack gap={10}>
                <ColumnLabel>Support</ColumnLabel>
                <CtaLink
                  href="https://ko-fi.com/ninjaruss"
                  icon={Heart}
                  ariaLabel="Support us on Ko-fi (opens in new tab)"
                  accentColor="#ff5f5f"
                >
                  Support Us
                </CtaLink>
                <CtaLink
                  href="https://fluxer.gg/7ce7lrCc"
                  icon={MessageCircle}
                  ariaLabel="Join Fluxer community (opens in new tab)"
                  accentColor="#e11d48"
                >
                  Join Fluxer
                </CtaLink>
              </Stack>
            </motion.div>
          </Box>

          {/* Bottom bar */}
          <Divider color="rgba(255,255,255,0.07)" />
          <Group
            justify="space-between"
            align="center"
            style={{
              padding: '16px 0 24px',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <Text
              size="xs"
              style={{ color: 'rgba(255,255,255,0.22)', letterSpacing: '0.03em' }}
            >
              © {currentYear} L-File — Fan-made, not affiliated with Sako Toshio or any publisher.
            </Text>
            <Group gap="lg">
              <Anchor
                component={NextLink}
                href="/disclaimer"
                underline="never"
                size="xs"
                style={{ color: 'rgba(255,255,255,0.22)', letterSpacing: '0.03em', transition: 'color 200ms ease' }}
                styles={{ root: { '&:hover': { color: 'rgba(255,255,255,0.5)' } } }}
              >
                Disclaimer
              </Anchor>
              <Text
                size="xs"
                style={{ color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}
              >
                Independent fan resource
              </Text>
            </Group>
          </Group>

        </Box>
      </Container>
    </Box>
  )
}
