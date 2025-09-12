import React, { useState, useEffect, useCallback } from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  UrlField,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  Button,
  useRecordContext,
  useNotify,
  useRefresh
} from 'react-admin'
import { useWatch } from 'react-hook-form'
import { 
  Box, 
  Chip, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Avatar,
  Button as MuiButton
} from '@mui/material'
import { 
  Check, 
  X, 
  Image, 
  User, 
  BookOpen, 
  Calendar, 
  Volume2, 
  ExternalLink, 
  Link as LinkIcon,
  Edit3
} from 'lucide-react'
import { api } from '../../lib/api'

const MediaStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const status = record[source]
  const color = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'
  
  return (
    <Chip 
      label={status} 
      color={color} 
      size="small" 
      sx={{
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        height: '28px',
        minWidth: '80px'
      }}
    />
  )
}

const MediaPurposeField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const purpose = record[source]
  const color = purpose === 'entity_display' ? 'secondary' : 'primary'
  const label = purpose === 'entity_display' ? 'Entity Display' : 'Gallery'
  
  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      sx={{
        fontWeight: 'bold',
        textTransform: 'capitalize',
        fontSize: '0.75rem',
        height: '28px',
        minWidth: '80px'
      }}
    />
  )
}

const MediaFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput 
      source="status" 
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'approved', name: 'Approved' },
        { id: 'rejected', name: 'Rejected' },
      ]}
      alwaysOn
    />
    <SelectInput 
      source="purpose" 
      choices={[
        { id: 'gallery', name: 'Gallery' },
        { id: 'entity_display', name: 'Entity Display' },
      ]}
    />
  </Filter>
)

const ApproveButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.put(`/media/${record.id}/approve`, {})
      notify('Media approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'approved') return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<Check size={20} />}
    />
  )
}

const RejectButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleReject = async () => {
    if (!record) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      await api.put(`/media/${record.id}/reject`, { reason })
      notify('Media rejected successfully')
      refresh()
    } catch (error: any) {
      console.error('Error rejecting media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'rejected') return null
  
  return (
    <Button 
      label="Reject" 
      onClick={handleReject}
      color="secondary"
      startIcon={<X size={20} />}
    />
  )
}


const PolymorphicInfoChip = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  if (record.ownerType && record.ownerId) {
    return (
      <Chip 
        label={`${record.ownerType}:${record.ownerId}${record.chapterNumber ? ` (Ch.${record.chapterNumber})` : ''}`}
        color="success" 
        size="small" 
        sx={{
          fontWeight: 'bold',
          fontSize: '0.7rem',
          height: '24px',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          color: '#4caf50'
        }}
      />
    )
  }
  
  
  return (
    <Chip 
      label="No relationship"
      color="default" 
      size="small" 
      sx={{
        fontWeight: 'bold',
        fontSize: '0.7rem',
        height: '24px',
        backgroundColor: 'rgba(158, 158, 158, 0.2)',
        color: '#9e9e9e'
      }}
    />
  )
}

const EntityNameDisplay = () => {
  const record = useRecordContext()
  const [entityName, setEntityName] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEntityName = async () => {
      if (!record?.ownerType || !record?.ownerId) {
        setEntityName('')
        return
      }

      setLoading(true)
      try {
        let response
        switch (record.ownerType) {
          case 'character':
            response = await api.getCharacters({ limit: 100 })
            break
          case 'arc':
            response = await api.getArcs({ limit: 100 })
            break
          case 'event':
            response = await api.getEvents({ limit: 100 })
            break
          case 'gamble':
            response = await api.getGambles({ limit: 100 })
            break
          case 'faction':
            response = await api.getFactions({ limit: 100 })
            break
          case 'user':
            response = await api.getPublicUsers({ limit: 100 })
            break
          default:
            setEntityName(`Unknown entity type: ${record.ownerType}`)
            return
        }

        const entities = response.data || []
        const entity = entities.find((e: any) => e.id === record.ownerId)
        
        if (entity) {
          const name = entity.name || entity.title || entity.username || `${record.ownerType} ${entity.id}`
          setEntityName(name)
        } else {
          setEntityName(`${record.ownerType} #${record.ownerId} (not found)`)
        }
      } catch (error) {
        console.error('Failed to fetch entity name:', error)
        setEntityName(`${record.ownerType} #${record.ownerId} (error loading)`)
      } finally {
        setLoading(false)
      }
    }

    fetchEntityName()
  }, [record?.ownerType, record?.ownerId])

  if (loading) {
    return (
      <Typography sx={{ 
        fontWeight: 'bold', 
        fontSize: '1rem',
        color: '#dc004e',
        opacity: 0.7
      }}>
        Loading...
      </Typography>
    )
  }

  return (
    <Typography sx={{ 
      fontWeight: 'bold', 
      fontSize: '1rem',
      color: '#dc004e'
    }}>
      {entityName || `${record?.ownerType} #${record?.ownerId}`}
    </Typography>
  )
}

export const MediaList = () => (
  <List filters={<MediaFilter />} filterDefaultValues={{ status: 'pending' }}>
    <Datagrid 
      rowClick="show"
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem'
        },
        '& .RaDatagrid-rowCell': {
          padding: '12px 8px',
        }
      }}
    >
      <TextField source="id" sx={{ width: '60px' }} />
      <Box sx={{ 
        maxWidth: '200px',
        '& a': {
          fontWeight: 'bold',
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }
      }}>
        <UrlField source="url" />
      </Box>
      <TextField 
        source="type" 
        sx={{ 
          width: '80px',
          '& span': {
            fontWeight: '500',
            textTransform: 'capitalize',
            backgroundColor: 'action.hover',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }
        }} 
      />
      <TextField 
        source="description" 
        sx={{ 
          maxWidth: '250px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.85rem',
            color: 'text.secondary'
          }
        }} 
      />
      <TextField 
        source="ownerType" 
        label="Owner Type" 
        sx={{ 
          width: '120px',
          '& span': {
            fontWeight: '500',
            color: 'secondary.main',
            textTransform: 'capitalize'
          }
        }} 
      />
      <TextField 
        source="ownerId" 
        label="Owner ID" 
        sx={{ 
          width: '80px',
          '& span': {
            fontWeight: '500',
            color: 'info.main'
          }
        }} 
      />
      <Box sx={{ width: '150px', display: 'flex', justifyContent: 'center' }}>
        <PolymorphicInfoChip source="polymorphic" />
      </Box>
      <Box sx={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
        <MediaStatusField source="status" />
      </Box>
      <TextField 
        source="submittedBy.username" 
        label="Submitted By" 
        sx={{ 
          width: '120px',
          '& span': {
            fontSize: '0.85rem',
            color: 'text.secondary'
          }
        }} 
      />
      <DateField 
        source="createdAt" 
        label="Created" 
        sx={{ 
          width: '120px',
          '& span': {
            fontSize: '0.8rem'
          }
        }} 
      />
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          minWidth: '200px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '60px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }
        }}
      >
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Media Approval Queue">
    <Datagrid 
      rowClick="show"
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem'
        },
        '& .RaDatagrid-rowCell': {
          padding: '12px 8px',
        }
      }}
    >
      <TextField source="id" sx={{ width: '60px' }} />
      <Box sx={{ 
        maxWidth: '250px',
        '& a': {
          fontWeight: 'bold',
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }
      }}>
        <UrlField source="url" />
      </Box>
      <TextField 
        source="type" 
        sx={{ 
          width: '80px',
          '& span': {
            fontWeight: '500',
            textTransform: 'capitalize',
            backgroundColor: 'action.hover',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }
        }} 
      />
      <MediaPurposeField source="purpose" />
      <TextField 
        source="description" 
        sx={{ 
          maxWidth: '300px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.85rem',
            color: 'text.secondary',
            lineHeight: 1.3
          }
        }} 
      />
      <TextField 
        source="ownerType" 
        label="Owner Type" 
        sx={{ 
          width: '120px',
          '& span': {
            fontWeight: '500',
            color: 'secondary.main',
            textTransform: 'capitalize'
          }
        }} 
      />
      <TextField 
        source="ownerId" 
        label="Owner ID" 
        sx={{ 
          width: '80px',
          '& span': {
            fontWeight: '500',
            color: 'info.main'
          }
        }} 
      />
      <TextField 
        source="submittedBy.username" 
        label="Submitted By" 
        sx={{ 
          width: '120px',
          '& span': {
            fontSize: '0.85rem',
            color: 'text.secondary'
          }
        }} 
      />
      <DateField 
        source="createdAt" 
        label="Submitted" 
        sx={{ 
          width: '120px',
          '& span': {
            fontSize: '0.8rem'
          }
        }} 
      />
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1.5, 
          minWidth: '160px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '70px',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        }}
      >
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaShow = () => {
  const record = useRecordContext()
  
  const renderMediaContent = () => {
    if (!record?.url) return null
    
    switch (record.type) {
      case 'image':
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px dashed rgba(225, 29, 72, 0.3)'
          }}>
            <img 
              src={record.url} 
              alt={record.description || 'Media content'} 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(225, 29, 72, 0.3)',
                border: '1px solid rgba(225, 29, 72, 0.2)'
              }}
            />
          </Box>
        )
      case 'video':
        return (
          <Box sx={{ 
            p: 2,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)'
          }}>
            <video 
              controls 
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(225, 29, 72, 0.2)'
              }}
              src={record.url}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        )
      case 'audio':
        return (
          <Box sx={{ 
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)',
            textAlign: 'center'
          }}>
            <Box sx={{ mb: 2 }}>
              <Volume2 size={48} color="#e11d48" />
            </Box>
            <audio controls style={{ 
              width: '100%', 
              maxWidth: '400px',
              filter: 'sepia(1) saturate(2) hue-rotate(320deg)'
            }}>
              <source src={record.url} />
              Your browser does not support the audio element.
            </audio>
          </Box>
        )
      default:
        return (
          <Box sx={{ 
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)',
            textAlign: 'center'
          }}>
            <ExternalLink size={48} color="#e11d48" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              External Link
            </Typography>
            <MuiButton
              href={record.url} 
              target="_blank" 
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<ExternalLink size={20} />}
              sx={{
                backgroundColor: '#e11d48',
                '&:hover': {
                  backgroundColor: '#be185d'
                }
              }}
            >
              View Media Content
            </MuiButton>
          </Box>
        )
    }
  }

  return (
    <Show>
      <Box sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        p: 3,
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        '& .RaShow-main': {
          backgroundColor: 'transparent'
        }
      }}>
        {/* Header Section */}
        <Card 
          elevation={0}
          sx={{ 
            mb: 3, 
            backgroundColor: '#0a0a0a',
            border: '2px solid #e11d48',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(225, 29, 72, 0.3)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #7c3aed 100%)',
            p: 4
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Image size={32} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: 'white', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Media Submission #{record?.id}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.1rem',
                  opacity: 0.95,
                  mb: 1
                }}>
                  {record?.description || 'No description provided'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip 
                    label={record?.type || 'Unknown'}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <MediaStatusField source="status" />
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 3,
              '& .MuiButton-root': {
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1rem',
                minWidth: '140px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                }
              }
            }}>
              <ApproveButton />
              <RejectButton />
            </Box>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {/* Main Content - Media Preview */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Image size={24} />
                  Media Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                {renderMediaContent()}
                
                {/* URL Display */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#0f0f0f', borderRadius: 2, border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Source URL
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 2,
                    backgroundColor: '#000000',
                    borderRadius: 1,
                    border: '1px solid rgba(225, 29, 72, 0.3)',
                    '& a': { 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      color: '#e11d48',
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#f43f5e',
                        textDecoration: 'underline'
                      }
                    }
                  }}>
                    <LinkIcon size={16} color="#e11d48" />
                    <UrlField source="url" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar with Details */}
          <Grid item xs={12} md={4}>
            {/* Associations */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BookOpen size={20} />
                  Associated Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Owner Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#1976d2', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(25, 118, 210, 0.5)'
                    }}>
                      <User size={20} />
                    </Avatar>
                    <TextField 
                      source="ownerType" 
                      sx={{ 
                        '& span': { 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#1976d2',
                          textTransform: 'capitalize'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Entity Name
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#dc004e', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(220, 0, 78, 0.5)'
                    }}>
                      <BookOpen size={20} />
                    </Avatar>
                    <EntityNameDisplay />
                  </Box>
                </Box>
                
                {record?.chapterNumber && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chapter Number
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#f57c00', 
                        width: 36, 
                        height: 36,
                        border: '2px solid rgba(245, 124, 0, 0.5)'
                      }}>
                        <BookOpen size={20} />
                      </Avatar>
                      <TextField 
                        source="chapterNumber" 
                        sx={{ 
                          '& span': { 
                            fontWeight: 'bold', 
                            fontSize: '1rem',
                            color: '#f57c00'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
                

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Purpose
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: record?.purpose === 'entity_display' ? '#9c27b0' : '#4caf50', 
                      width: 36, 
                      height: 36,
                      border: `2px solid rgba(${record?.purpose === 'entity_display' ? '156, 39, 176' : '76, 175, 80'}, 0.5)`
                    }}>
                      <Image size={20} />
                    </Avatar>
                    <MediaPurposeField source="purpose" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Submission Details */}
            <Card elevation={0} sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Calendar size={20} />
                  Submission Info
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Submitted By
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#e11d48', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(225, 29, 72, 0.5)'
                    }}>
                      <User size={20} />
                    </Avatar>
                    <TextField 
                      source="submittedBy.username" 
                      sx={{ 
                        '& span': { 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#e11d48'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Submission Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} color="#e11d48" />
                    <DateField 
                      source="createdAt" 
                      sx={{ 
                        '& span': { 
                          fontWeight: '500',
                          fontSize: '0.95rem',
                          color: '#ffffff'
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Rejection Reason if exists */}
                {record?.rejectionReason && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid #e11d48'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rejection Reason
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f43f5e', fontStyle: 'italic' }}>
                      <TextField source="rejectionReason" />
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Show>
  )
}

const EntitySelector = ({ entities, loadingEntities, loadEntities, getEntityChoices, getCurrentEntityKey, record }: any) => {
  const ownerType = useWatch({ name: 'ownerType' })
  
  // Load entities when ownerType changes
  useEffect(() => {
    if (ownerType) {
      const entityKey = ownerType === 'user' ? 'users' : ownerType + 's'
      loadEntities(entityKey)
    }
  }, [ownerType, loadEntities])

  const currentOwnerType = ownerType || record?.ownerType
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <SelectInput 
          source="ownerType" 
          label="Entity Type"
          choices={[
            { id: 'character', name: 'Character' },
            { id: 'arc', name: 'Arc' },
            { id: 'event', name: 'Event' },
            { id: 'gamble', name: 'Gamble' },
            { id: 'faction', name: 'Faction' },
            { id: 'user', name: 'User' },
          ]}
          fullWidth
          sx={{
            '& .MuiSelect-select': {
              backgroundColor: '#0f0f0f'
            }
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SelectInput 
          source="ownerId" 
          label="Select Entity"
          choices={getEntityChoices(currentOwnerType)}
          disabled={!currentOwnerType || loadingEntities[getCurrentEntityKey(currentOwnerType)]}
          fullWidth
          sx={{
            '& .MuiSelect-select': {
              backgroundColor: '#0f0f0f'
            }
          }}
          helperText={
            loadingEntities[getCurrentEntityKey(currentOwnerType)] 
              ? `Loading ${currentOwnerType}s...` 
              : currentOwnerType
                ? `Select a ${currentOwnerType} from the list` 
                : 'First select an entity type'
          }
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextInput 
          source="chapterNumber" 
          label="Chapter Number"
          type="number"
          fullWidth
          helperText="For chapter-based progression (optional)"
        />
      </Grid>
    </Grid>
  )
}



const DynamicEntitySelector = () => {
  const record = useRecordContext()
  const ownerType = useWatch({ name: 'ownerType', defaultValue: record?.ownerType })

  if (ownerType === 'character') {
    return (
      <ReferenceInput source="ownerId" reference="characters" label="Character">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'arc') {
    return (
      <ReferenceInput source="ownerId" reference="arcs" label="Arc">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'event') {
    return (
      <ReferenceInput source="ownerId" reference="events" label="Event">
        <AutocompleteInput 
          optionText="title"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'gamble') {
    return (
      <ReferenceInput source="ownerId" reference="gambles" label="Gamble">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'faction') {
    return (
      <ReferenceInput source="ownerId" reference="factions" label="Faction">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'user') {
    return (
      <ReferenceInput source="ownerId" reference="users" label="User">
        <AutocompleteInput 
          optionText="username"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  return (
    <Box sx={{ 
      p: 2, 
      textAlign: 'center', 
      color: '#ffffff',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      borderRadius: '4px',
      border: '1px dashed #7c3aed'
    }}>
      <Typography variant="body2">
        Select an Entity Type first to choose the specific entity
      </Typography>
    </Box>
  )
}

export const MediaEdit = () => {
  return (
    <Edit>
      <SimpleForm sx={{ 
        '& .MuiCardContent-root': {
          padding: '24px',
          backgroundColor: '#0a0a0a',
        },
        '& .MuiFormControl-root': {
          marginBottom: '16px',
        }
      }}>
        {/* Media Information Section */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          border: '1px solid #e11d48', 
          borderRadius: '8px',
          backgroundColor: 'rgba(225, 29, 72, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#e11d48', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Media Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextInput 
                source="url" 
                required 
                fullWidth 
                label="Media URL"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <SelectInput 
                source="type" 
                choices={[
                  { id: 'image', name: 'Image' },
                  { id: 'video', name: 'Video' },
                  { id: 'audio', name: 'Audio' },
                ]}
                required
                fullWidth
                label="Media Type"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <SelectInput 
                source="purpose" 
                choices={[
                  { id: 'gallery', name: 'Gallery' },
                  { id: 'entity_display', name: 'Entity Display' },
                ]}
                required
                fullWidth
                label="Purpose"
                helperText="Gallery: User-submitted content | Entity Display: Official entity images"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput 
                source="description" 
                multiline 
                rows={4} 
                fullWidth
                label="Description"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Entity Association Section */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          border: '1px solid #7c3aed', 
          borderRadius: '8px',
          backgroundColor: 'rgba(124, 58, 237, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#7c3aed', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Entity Association
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SelectInput 
                source="ownerType" 
                label="Entity Type"
                choices={[
                  { id: 'character', name: 'Character' },
                  { id: 'arc', name: 'Arc' },
                  { id: 'event', name: 'Event' },
                  { id: 'gamble', name: 'Gamble' },
                  { id: 'faction', name: 'Faction' },
                  { id: 'user', name: 'User' },
                ]}
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <DynamicEntitySelector />
            </Grid>
            <Grid item xs={6}>
              <TextInput 
                source="chapterNumber" 
                label="Chapter Number"
                type="number"
                fullWidth
                helperText="Optional: For progression-based content"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Moderation Section */}
        <Box sx={{ 
          mb: 2, 
          p: 3, 
          border: '1px solid #f57c00', 
          borderRadius: '8px',
          backgroundColor: 'rgba(245, 124, 0, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#f57c00', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Moderation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SelectInput 
                source="status" 
                choices={[
                  { id: 'pending', name: 'Pending Review' },
                  { id: 'approved', name: 'Approved' },
                  { id: 'rejected', name: 'Rejected' },
                ]}
                required
                fullWidth
                label="Status"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput 
                source="rejectionReason" 
                multiline 
                rows={3} 
                fullWidth
                label="Rejection Reason"
                helperText="Only required when status is 'Rejected'"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </SimpleForm>
    </Edit>
  )
}

export const MediaCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="url" required />
      <SelectInput 
        source="type" 
        choices={[
          { id: 'image', name: 'Image' },
          { id: 'video', name: 'Video' },
          { id: 'audio', name: 'Audio' },
        ]}
        required
      />
      <TextInput source="description" multiline rows={4} />
      
      {/* Polymorphic relationship fields */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
        Entity Relationship
      </Typography>
      <SelectInput 
        source="ownerType" 
        label="Entity Type"
        choices={[
          { id: 'character', name: 'Character' },
          { id: 'arc', name: 'Arc' },
          { id: 'event', name: 'Event' },
          { id: 'gamble', name: 'Gamble' },
          { id: 'faction', name: 'Faction' },
          { id: 'user', name: 'User' },
        ]}
      />
      <TextInput 
        source="ownerId" 
        label="Entity ID"
        type="number"
        helperText="ID of the related entity"
      />
      <TextInput 
        source="chapterNumber" 
        label="Chapter Number"
        type="number"
        helperText="For chapter-based progression (optional)"
      />
      <SelectInput 
        source="purpose" 
        label="Purpose"
        choices={[
          { id: 'gallery', name: 'Gallery' },
          { id: 'entity_display', name: 'Entity Display' },
        ]}
        defaultValue="gallery"
        helperText="Purpose of the media - gallery for user uploads or entity display for official entity images"
      />
      
      <SelectInput 
        source="status" 
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
        ]}
        defaultValue="pending"
        required
      />
    </SimpleForm>
  </Create>
)