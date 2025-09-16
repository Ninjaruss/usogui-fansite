'use client'

import React from 'react'
import { Box, Typography, Link, Stack, Grid, Divider } from '@mui/material'
import { MessageCircle, Mail, Heart } from 'lucide-react'
import NextLink from 'next/link'

export const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = React.useState<number>(2024)

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        px: 3,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Box maxWidth="lg" mx="auto">
        <Grid container spacing={4} justifyContent="center">
          {/* Brand & Legal Section */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                L-File
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The ultimate database for Usogui (Lie Eater) - connecting fans worldwide through comprehensive content and community.
              </Typography>
              <Link component={NextLink} href="/disclaimer" color="primary" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2">
                  Disclaimer & Legal Information
                </Typography>
              </Link>
            </Stack>
          </Grid>

          {/* Connect Section */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Connect With Us
              </Typography>
              <Stack spacing={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Mail className="w-4 h-4" />
                  <Link href="mailto:ninjarussyt@gmail.com" color="primary" sx={{ textDecoration: 'none' }}>
                    <Typography variant="body2">ninjarussyt@gmail.com</Typography>
                  </Link>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <MessageCircle className="w-4 h-4" />
                  <Link
                    href="https://discord.gg/JXeRhV2qpY"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    sx={{ textDecoration: 'none' }}
                  >
                    <Typography variant="body2">Discord Community</Typography>
                  </Link>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Heart className="w-4 h-4" />
                  <Link
                    href="https://ko-fi.com/ninjaruss"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    sx={{ textDecoration: 'none' }}
                  >
                    <Typography variant="body2">Support on Ko-fi</Typography>
                  </Link>
                </Box>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Typography variant="body2" color="text.secondary">
            L-file is an independent fan resource. Usogui © Sako Toshio/Shueisha.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} L-File. Made for the Usogui community.
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}