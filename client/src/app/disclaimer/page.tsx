import { Box, Container, Divider, Paper, Stack, Text, Title } from '@mantine/core'
import { Shield, AlertTriangle, Copyright, ExternalLink } from 'lucide-react'
import { Metadata } from 'next'

const LAST_UPDATED = 'December 15, 2024'

export const metadata: Metadata = {
  title: 'Legal Disclaimer - L-File Usogui Database',
  description:
    'Legal disclaimer and terms of use for L-File, the Usogui manga fan database. Copyright information and fair use policy.',
  keywords: ['disclaimer', 'legal', 'copyright', 'fair use', 'terms', 'Usogui'],
  openGraph: {
    title: 'Legal Disclaimer - L-File Usogui Database',
    description: 'Legal disclaimer and terms of use for L-File, the Usogui manga fan database.',
    type: 'website'
  },
  robots: {
    index: false,
    follow: true
  }
}

export default function DisclaimerPage() {
  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="xs" mb="xl">
        <Shield size={32} color="#1976d2" />
        <Title order={1}>Disclaimer</Title>
        <Text size="sm" c="dimmed">
          Important legal information and terms of use
        </Text>
      </Stack>

      <Paper
        withBorder
        radius="md"
        shadow="sm"
        p="xl"
        mb="xl"
        style={{
          backgroundColor: 'var(--mantine-color-dark-8)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <Stack gap="xl">
          <Stack gap="sm">
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Copyright size={24} color="#ed6c02" />
              <Title order={3}>Copyright &amp; Fair Use</Title>
            </Box>
            <Text c="#ffffff">
              This website (&quot;L-file&quot;) is an unofficial fan resource dedicated to the manga series
              &quot;Usogui&quot; (also known as &quot;Lie Eater&quot;) created by Sako Toshio 迫 稔雄 and published by
              Shueisha 集英社. All original manga content, including but not limited to characters,
              storylines, artwork, and related intellectual property, remains the exclusive property
              of their respective copyright holders.
            </Text>
            <Text c="#ffffff">
              The use of copyrighted material on this website falls under fair use provisions for
              educational, commentary, and non-commercial purposes. We do not claim ownership of any
              copyrighted material and all content is used with respect to the original creators and
              publishers.
            </Text>
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.12)" />

          <Stack gap="sm">
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={24} color="#d32f2f" />
              <Title order={3}>Content Disclaimer</Title>
            </Box>
            <Text c="#ffffff">
              <strong>Age Rating:</strong> Usogui contains mature content including violence, gambling,
              psychological themes, and adult situations. This website may discuss or reference such
              content and is intended for mature audiences.
            </Text>
            <Text c="#ffffff">
              <strong>Spoilers:</strong> This website contains detailed information about plot points,
              character developments, and story outcomes throughout the entire Usogui series. Although
              there is chapter tracking to prevent spoilers, we advise you to browse at your own
              discretion if you have not completed the manga.
            </Text>
            <Text c="#ffffff">
              <strong>User-Generated Content:</strong> Some content on this site is contributed by
              users. While we moderate submissions, we cannot guarantee the accuracy of all
              information. User opinions and interpretations do not necessarily reflect our views.
            </Text>
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.12)" />

          <Stack gap="sm">
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={24} color="#2e7d32" />
              <Title order={3}>External Links &amp; Third Parties</Title>
            </Box>
            <Text c="#ffffff">
              This website may contain links to external websites, social media platforms, or other
              third-party services. We are not responsible for the content, privacy practices, or
              policies of these external sites. Users access external links at their own risk.
            </Text>
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.12)" />

          <Stack gap="sm">
            <Title order={3}>Limitation of Liability</Title>
            <Text c="#ffffff">
              This website and its content are provided &quot;as is&quot; without warranty of any kind. We make
              no representations or warranties regarding the accuracy, completeness, or reliability of
              any information on this site. Use of this website is at your own risk.
            </Text>
            <Text c="#ffffff">
              We shall not be liable for any direct, indirect, incidental, consequential, or punitive
              damages arising from your use of this website or any content therein.
            </Text>
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.12)" />

          <Stack gap="sm">
            <Title order={3}>Contact &amp; Takedown Requests</Title>
            <Text c="#ffffff">
              If you are a copyright holder and believe that content on this website infringes upon
              your rights, please contact us immediately at{' '}
              <Text span c="red" fw={600}>
                ninjarussyt@gmail.com
              </Text>{' '}
              with a detailed description of the alleged infringement. We will investigate all
              legitimate claims promptly and remove infringing content when appropriate.
            </Text>
            <Text c="#ffffff">
              For general inquiries, feedback, or concerns about this disclaimer, please use the same
              contact information.
            </Text>
          </Stack>
        </Stack>
      </Paper>

      <Stack align="center" gap="xs" c="dimmed">
        <Text size="sm" c="dimmed">Last updated: {LAST_UPDATED}</Text>
        <Text size="sm" c="dimmed">
          This disclaimer may be updated periodically. Continued use of this website constitutes
          acceptance of any changes.
        </Text>
      </Stack>
    </Container>
  )
}
