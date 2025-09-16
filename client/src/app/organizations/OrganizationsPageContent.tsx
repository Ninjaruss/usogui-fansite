'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment
} from '@mui/material'
import { Search, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import { useRouter, useSearchParams } from 'next/navigation'

interface Organization {
  id: number
  name: string
  description?: string
  memberCount?: number
}

interface OrganizationsPageContentProps {
  initialOrganizations: Organization[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

export default function OrganizationsPageContent({
  initialOrganizations,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: OrganizationsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)

  const limit = 12

  useEffect(() => {
    if (error) return

    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        const params: any = { page, limit }
        if (searchTerm.trim()) {
          params.name = searchTerm
        }
        
        const response = await api.getOrganizations(params)
        setOrganizations(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if different from initial state
    const currentSearch = searchParams.get('search') || ''
    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    
    if (currentSearch !== initialSearch || currentPage !== initialPage) {
      fetchOrganizations()
    }
  }, [page, searchTerm, searchParams, initialSearch, initialPage, error])

  const updateURL = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newPage > 1) params.set('page', newPage.toString())
    
    const url = params.toString() ? `/organizations?${params.toString()}` : '/organizations'
    router.push(url)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchTerm(newSearch)
    setPage(1)
    updateURL(newSearch, 1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    updateURL(searchTerm, value)
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Shield size={48} style={{ marginBottom: 16 }} />
        <Typography variant="h2" component="h1" gutterBottom>
          Organizations
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Explore the various groups and organizations in Usogui
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search organizations by name..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {total} organizations found
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {organizations.map((organization) => (
              <Grid item xs={12} sm={6} md={4} key={organization.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="gambling-card"
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <MediaThumbnail
                        entityType="organization"
                        entityId={organization.id}
                        entityName={organization.name}
                        maxWidth="100%"
                        maxHeight="200px"
                        allowCycling={false}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Shield size={24} style={{ marginRight: 8 }} />
                        <Typography 
                          variant="h5" 
                          component={Link}
                          href={`/organizations/${organization.id}`}
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' },
                            flex: 1
                          }}
                        >
                          {organization.name}
                        </Typography>
                      </Box>

                      {organization.description && (
                        <div style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '16px',
                          flexGrow: 1
                        }}>
                          <EnhancedSpoilerMarkdown
                            content={organization.description}
                            className="organization-description-preview"
                            enableEntityEmbeds={true}
                            compactEntityCards={true}
                          />
                        </div>
                      )}

                      {organization.memberCount !== undefined && (
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Chip
                            label={`${organization.memberCount} members`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            icon={<Users size={14} />}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {organizations.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No organizations found
              </Typography>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}