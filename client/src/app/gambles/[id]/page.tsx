'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material'
import { ArrowLeft, Crown, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'

interface Gamble {
  id: number
  name: string
  rules: string
  winCondition?: string
  chapterId: number
  hasTeams: boolean
  teams?: Array<{
    id: number
    name: string
    members: Array<{
      id: number
      name: string
    }>
    isWinner: boolean
  }>
  participants?: Array<{
    id: number
    character: {
      id: number
      name: string
    }
    teamName?: string
    isWinner: boolean
    stake?: string
  }>
  rounds?: Array<{
    id: number
    roundNumber: number
    description: string
    outcome: string
  }>
  observers: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

export default function GambleDetailsPage() {
  const { id } = useParams()
  const [gamble, setGamble] = useState<Gamble | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchGamble = async () => {
      try {
        setLoading(true)
        const response = await api.getGamble(Number(id))
        setGamble(response)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch gamble details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGamble()
    }
  }, [id])

  // Remove difficulty logic as it's not in the backend structure

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
      </Container>
    )
  }

  if (!gamble) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Gamble not found
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/gambles"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Gambles
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Crown size={48} color="#d32f2f" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {gamble.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={`Chapter ${gamble.chapterId}`}
              color="primary"
              variant="outlined"
            />
            {gamble.hasTeams && gamble.teams && gamble.teams.length > 0 && (
              <Chip
                icon={<Users size={16} />}
                label={`${gamble.teams.length} Teams`}
                color="secondary"
                variant="outlined"
              />
            )}
            {!gamble.hasTeams && gamble.participants && gamble.participants.length > 0 && (
              <Chip
                icon={<Users size={16} />}
                label={`${gamble.participants.length} Participants`}
                color="secondary"
                variant="outlined"
              />
            )}
            {gamble.rounds && gamble.rounds.length > 0 && (
              <Chip
                icon={<Trophy size={16} />}
                label={`${gamble.rounds.length} Rounds`}
                color="success"
                variant="filled"
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Rules
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {gamble.rules}
                </Typography>

                {gamble.winCondition && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Win Condition
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                      {gamble.winCondition}
                    </Typography>
                  </>
                )}

                {gamble.rounds && gamble.rounds.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Rounds
                    </Typography>
                    {gamble.rounds.map((round) => (
                      <Box key={round.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Round {round.roundNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {round.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Outcome:</strong> {round.outcome}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gamble Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chapter
                  </Typography>
                  <Typography variant="body1">
                    {gamble.chapterId}
                  </Typography>
                </Box>

                {gamble.hasTeams && gamble.teams && gamble.teams.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Teams
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {gamble.teams.map((team) => (
                        <Box key={team.id} sx={{ p: 1, border: '1px solid', borderColor: team.isWinner ? 'success.main' : 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                              {team.name}
                            </Typography>
                            {team.isWinner && (
                              <Chip
                                label="Winner"
                                size="small"
                                color="success"
                                variant="filled"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Members: {team.members.map(m => m.name).join(', ')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {!gamble.hasTeams && gamble.participants && gamble.participants.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Participants
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {gamble.participants.map((participant) => (
                        <Box key={participant.id} sx={{ p: 1, border: '1px solid', borderColor: participant.isWinner ? 'success.main' : 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                              {participant.character.name}
                            </Typography>
                            {participant.isWinner && (
                              <Chip
                                label="Winner"
                                size="small"
                                color="success"
                                variant="filled"
                              />
                            )}
                          </Box>
                          {participant.stake && (
                            <Typography variant="body2" color="text.secondary">
                              Stake: {participant.stake}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {gamble.observers?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Observers
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {gamble.observers.map((observer) => (
                        <Chip
                          key={observer.id}
                          label={observer.name}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}