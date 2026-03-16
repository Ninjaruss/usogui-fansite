import React from 'react'
import { Card, CardContent, CardHeader, Grid, Box, Typography, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetList, usePermissions } from 'react-admin'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Crown, Zap, FileText, Image, Quote, Shield, Plus, ChevronRight, CheckCircle, MessageSquare, Library } from 'lucide-react'
import { usePendingCounts } from '../../hooks/usePendingCounts'

interface StatCardProps {
  title: string
  count: number | undefined
  icon: React.ComponentType<{ size: number; color: string; style?: React.CSSProperties }>
  color: string
  resource: string
  pendingCount?: number
}

const StatCard = ({ title, count, icon: Icon, color, resource, pendingCount }: StatCardProps) => (
  <Link to={`/${resource}`} style={{ textDecoration: 'none' }}>
    <Card sx={{
      height: '100%',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      borderBottom: `3px solid ${color}`,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${color}40`,
        background: `linear-gradient(135deg, ${color}10, transparent)`,
        borderColor: color
      },
      border: '1px solid transparent',
      borderBottomColor: color
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold', fontSize: '2rem' }}>
              {count ?? '—'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {title}
            </Typography>
            {pendingCount !== undefined && pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                  color: '#ff9800',
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
          <Icon size={40} color={color} style={{ opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  </Link>
)

interface QuickActionProps {
  text: string
  to: string
  filter?: Record<string, string>
  icon?: React.ComponentType<{ size: number }>
  count?: number
}

const QuickActionItem = ({ text, to, filter, icon: Icon = ChevronRight, count }: QuickActionProps) => {
  const getPath = () => {
    if (filter) {
      const filterParam = encodeURIComponent(JSON.stringify(filter))
      return `${to}?displayedFilters=${filterParam}&filter=${filterParam}&order=ASC&page=1&perPage=25&sort=id`
    }
    return to
  }

  const isInactive = count !== undefined && count === 0

  return (
    <Link
      to={getPath()}
      style={{ textDecoration: 'none' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 1,
          borderRadius: 1,
          backgroundColor: isInactive ? 'rgba(225, 29, 72, 0.02)' : 'rgba(225, 29, 72, 0.05)',
          border: '1px solid rgba(225, 29, 72, 0.1)',
          cursor: 'pointer',
          opacity: isInactive ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            borderColor: 'rgba(225, 29, 72, 0.3)',
            transform: 'translateX(4px)',
            opacity: 1
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
            {text}
          </Typography>
          {count !== undefined && count > 0 && (
            <Chip
              label={count}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                color: '#ff9800',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: 20,
                ml: 0.5
              }}
            />
          )}
        </Box>
        <Icon size={20} />
      </Box>
    </Link>
  )
}

export const Dashboard = () => {
  const { permissions } = usePermissions()
  const theme = useTheme()
  const { counts: pendingCounts } = usePendingCounts()

  const { total: charactersCount } = useGetList('characters', { pagination: { page: 1, perPage: 1 } })
  const { total: arcsCount } = useGetList('arcs', { pagination: { page: 1, perPage: 1 } })
  const { total: gamblesCount } = useGetList('gambles', { pagination: { page: 1, perPage: 1 } })
  const { total: eventsCount } = useGetList('events', { pagination: { page: 1, perPage: 1 } })
  const { total: guidesCount } = useGetList('guides', { pagination: { page: 1, perPage: 1 } })
  const { total: mediaCount } = useGetList('media', { pagination: { page: 1, perPage: 1 } })
  const { total: quotesCount } = useGetList('quotes', { pagination: { page: 1, perPage: 1 } })
  const { total: annotationsCount } = useGetList('annotations', { pagination: { page: 1, perPage: 1 } })
  const { total: volumesCount } = useGetList('volumes', { pagination: { page: 1, perPage: 1 } })
  const { total: usersCount } = useGetList('users', { pagination: { page: 1, perPage: 1 } }, { enabled: permissions === 'admin' })

  const isModerator = permissions === 'moderator' || permissions === 'editor'

  const totalContentItems =
    (charactersCount || 0) +
    (arcsCount || 0) +
    (gamblesCount || 0) +
    (eventsCount || 0) +
    (guidesCount || 0) +
    (mediaCount || 0) +
    (quotesCount || 0)

  const roleChipSx = isModerator
    ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981' }
    : { backgroundColor: 'rgba(124,58,237,0.2)', color: '#7c3aed' }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h4">
          Welcome to the L-file Admin Dashboard
        </Typography>
        {permissions && (
          <Chip
            label={permissions}
            size="small"
            sx={{ ...roleChipSx, fontWeight: 'bold', textTransform: 'capitalize' }}
          />
        )}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {isModerator
          ? 'Review pending submissions and manage content for the Usogui database.'
          : 'Manage all content and users for the Usogui database. Click on any card to view and manage that content.'
        }
      </Typography>

      {/* For moderators/editors: show moderation queue first */}
      {isModerator && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Card sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.2)'
            }}>
              <CardHeader
                title="Moderation Queue"
                sx={{
                  borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                  '& .MuiCardHeader-title': {
                    color: '#e11d48',
                    fontWeight: 'bold'
                  }
                }}
              />
              <CardContent>
                {pendingCounts.total === 0 ? (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <CheckCircle size={18} color="#10b981" />
                    <Typography sx={{ color: '#10b981', fontWeight: 500 }}>
                      All caught up! No pending items.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <QuickActionItem
                      text="Review pending guides"
                      to="/guides"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.guides}
                    />
                    <QuickActionItem
                      text="Moderate media submissions"
                      to="/media"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.media}
                    />
                    <QuickActionItem
                      text="Review pending events"
                      to="/events"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.events}
                    />
                    <QuickActionItem
                      text="Review pending annotations"
                      to="/annotations"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.annotations}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Characters"
            count={charactersCount}
            icon={Users}
            color={theme.palette.usogui.character}
            resource="characters"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Story Arcs"
            count={arcsCount}
            icon={BookOpen}
            color={theme.palette.usogui.arc}
            resource="arcs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gambles"
            count={gamblesCount}
            icon={Crown}
            color={theme.palette.usogui.gamble}
            resource="gambles"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Events"
            count={eventsCount}
            icon={Zap}
            color={theme.palette.usogui.event}
            resource="events"
            pendingCount={pendingCounts.events}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Community Guides"
            count={guidesCount}
            icon={FileText}
            color={theme.palette.usogui.guide}
            resource="guides"
            pendingCount={pendingCounts.guides}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Media Submissions"
            count={mediaCount}
            icon={Image}
            color={theme.palette.usogui.media}
            resource="media"
            pendingCount={pendingCounts.media}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quotes"
            count={quotesCount}
            icon={Quote}
            color={theme.palette.usogui.quote}
            resource="quotes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Annotations"
            count={annotationsCount}
            icon={MessageSquare}
            color="#06b6d4"
            resource="annotations"
            pendingCount={pendingCounts.annotations}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Volumes"
            count={volumesCount}
            icon={Library}
            color="#8b5cf6"
            resource="volumes"
          />
        </Grid>
        {permissions === 'admin' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Users"
              count={usersCount}
              icon={Shield}
              color={theme.palette.text.secondary}
              resource="users"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Actions - only show for admins (moderators see moderation queue above) */}
        {!isModerator && (
          <Grid item xs={12} md={6}>
            <Card sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.2)'
            }}>
              <CardHeader
                title="Quick Actions"
                sx={{
                  borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                  '& .MuiCardHeader-title': {
                    color: '#e11d48',
                    fontWeight: 'bold'
                  }
                }}
              />
              <CardContent>
                {pendingCounts.total === 0 ? (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <CheckCircle size={18} color="#10b981" />
                    <Typography sx={{ color: '#10b981', fontWeight: 500 }}>
                      All caught up! No pending items.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <QuickActionItem
                      text="Review pending guides"
                      to="/guides"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.guides}
                    />
                    <QuickActionItem
                      text="Moderate media submissions"
                      to="/media"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.media}
                    />
                    <QuickActionItem
                      text="Review pending events"
                      to="/events"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.events}
                    />
                    <QuickActionItem
                      text="Review pending annotations"
                      to="/annotations"
                      filter={{ status: 'pending' }}
                      count={pendingCounts.annotations}
                    />
                  </>
                )}
                <QuickActionItem
                  text="Add new character"
                  to="/characters/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new story arc"
                  to="/arcs/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new volume"
                  to="/volumes/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new event"
                  to="/events/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new organization"
                  to="/organizations/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Manage user accounts"
                  to="/users"
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* System Overview - Admin only */}
        {permissions === 'admin' && (
          <Grid item xs={12} md={isModerator ? 12 : 6}>
            <Card sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(124, 58, 237, 0.2)'
            }}>
              <CardHeader
                title="System Overview"
                sx={{
                  borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
                  '& .MuiCardHeader-title': {
                    color: '#7c3aed',
                    fontWeight: 'bold'
                  }
                }}
              />
              <CardContent>
                <Box sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  backgroundColor: 'rgba(124, 58, 237, 0.05)',
                  border: '1px solid rgba(124, 58, 237, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                    Total Users
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#7c3aed', fontWeight: 'bold' }}>
                    {usersCount || 0}
                  </Typography>
                </Box>
                <Box sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 152, 0, 0.05)',
                  border: '1px solid rgba(255, 152, 0, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                    Total Pending Items
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    {pendingCounts.total}
                  </Typography>
                </Box>
                <Box sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  backgroundColor: 'rgba(225, 29, 72, 0.05)',
                  border: '1px solid rgba(225, 29, 72, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                    Total Content Items
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#e11d48', fontWeight: 'bold' }}>
                    {totalContentItems}
                  </Typography>
                </Box>
                <QuickActionItem
                  text="Manage user accounts"
                  to="/users"
                  icon={Shield}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Content Creation Shortcuts - For moderators/editors */}
        {isModerator && (
          <Grid item xs={12} md={permissions === 'admin' ? 6 : 12}>
            <Card sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <CardHeader
                title="Content Creation"
                sx={{
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  '& .MuiCardHeader-title': {
                    color: '#10b981',
                    fontWeight: 'bold'
                  }
                }}
              />
              <CardContent>
                <QuickActionItem
                  text="Add new character"
                  to="/characters/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new story arc"
                  to="/arcs/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new gamble"
                  to="/gambles/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new event"
                  to="/events/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new volume"
                  to="/volumes/create"
                  icon={Plus}
                />
                <QuickActionItem
                  text="Add new quote"
                  to="/quotes/create"
                  icon={Plus}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
