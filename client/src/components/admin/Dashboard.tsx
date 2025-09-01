import React from 'react'
import { Card, CardContent, CardHeader, Grid, Box, Typography } from '@mui/material'
import { useGetList, usePermissions } from 'react-admin'
import { Users, BookOpen, Crown, Zap, FileText, Image, Quote, Shield } from 'lucide-react'

const StatCard = ({ title, count, icon: Icon, color }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>
            {count || 0}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Icon size={40} color={color} style={{ opacity: 0.7 }} />
      </Box>
    </CardContent>
  </Card>
)

export const Dashboard = () => {
  const { permissions } = usePermissions()
  
  const { total: charactersCount } = useGetList('characters', { pagination: { page: 1, perPage: 1 } })
  const { total: arcsCount } = useGetList('arcs', { pagination: { page: 1, perPage: 1 } })
  const { total: gamblesCount } = useGetList('gambles', { pagination: { page: 1, perPage: 1 } })
  const { total: eventsCount } = useGetList('events', { pagination: { page: 1, perPage: 1 } })
  const { total: guidesCount } = useGetList('guides', { pagination: { page: 1, perPage: 1 } })
  const { total: mediaCount } = useGetList('media', { pagination: { page: 1, perPage: 1 } })
  const { total: quotesCount } = useGetList('quotes', { pagination: { page: 1, perPage: 1 } })
  const { total: usersCount } = useGetList('users', { pagination: { page: 1, perPage: 1 } })

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the Usogui Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage all content and users for the Usogui fansite
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Characters"
            count={charactersCount}
            icon={Users}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Story Arcs"
            count={arcsCount}
            icon={BookOpen}
            color="#dc004e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gambles"
            count={gamblesCount}
            icon={Crown}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Events"
            count={eventsCount}
            icon={Zap}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Community Guides"
            count={guidesCount}
            icon={FileText}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Media Submissions"
            count={mediaCount}
            icon={Image}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quotes"
            count={quotesCount}
            icon={Quote}
            color="#00796b"
          />
        </Grid>
        {permissions === 'admin' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Users"
              count={usersCount}
              icon={Shield}
              color="#5d4037"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Typography variant="body1" paragraph>
                • Review and approve submitted guides
              </Typography>
              <Typography variant="body1" paragraph>
                • Moderate media submissions
              </Typography>
              <Typography variant="body1" paragraph>
                • Add new characters and story content
              </Typography>
              {permissions === 'admin' && (
                <Typography variant="body1" paragraph>
                  • Manage user accounts and permissions
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Content Guidelines" />
            <CardContent>
              <Typography variant="body1" paragraph>
                • Ensure all content is accurate to the source material
              </Typography>
              <Typography variant="body1" paragraph>
                • Mark spoiler content appropriately
              </Typography>
              <Typography variant="body1" paragraph>
                • Verify media submissions for copyright compliance
              </Typography>
              <Typography variant="body1" paragraph>
                • Maintain consistent formatting and quality
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}