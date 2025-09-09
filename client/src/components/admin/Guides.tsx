import React from 'react'
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
  ReferenceField,
  SelectInput,
  NumberField,
  ReferenceInput,
  ReferenceArrayInput,
  ReferenceArrayField,
  AutocompleteInput,
  AutocompleteArrayInput,
  SingleFieldList,
  ChipField,
  usePermissions,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  Filter,
  Loading
} from 'react-admin'
import { 
  Box, 
  Chip, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Avatar 
} from '@mui/material'
import { 
  Check, 
  X, 
  FileText, 
  User, 
  Eye, 
  Heart, 
  Calendar, 
  Clock,
  Edit3
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'

const GuideStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const status = record[source]
  const color = status === 'published' ? 'success' : status === 'rejected' ? 'error' : 'warning'
  
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

const GuideFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput 
      source="status" 
      choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'pending', name: 'Pending' },
        { id: 'published', name: 'Published' },
        { id: 'rejected', name: 'Rejected' },
      ]}
      alwaysOn
    />
  </Filter>
)

const ApproveGuideButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.approveGuide(Number(record.id))
      notify('Guide approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving guide'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status !== 'pending') return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<Check size={20} />}
    />
  )
}

const RejectGuideButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleReject = async () => {
    if (!record) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      await api.rejectGuide(Number(record.id), reason)
      notify('Guide rejected successfully')
      refresh()
    } catch (error: any) {
      console.error('Error rejecting guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting guide'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status !== 'pending') return null
  
  return (
    <Button 
      label="Reject" 
      onClick={handleReject}
      color="secondary"
      startIcon={<X size={20} />}
    />
  )
}

export const GuideList = () => (
  <List filters={<GuideFilter />} filterDefaultValues={{ status: 'pending' }}>
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
      <TextField 
        source="title" 
        sx={{ 
          maxWidth: '200px',
          '& span': {
            fontWeight: 'bold',
            color: 'primary.main'
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
      <ReferenceField source="authorId" reference="users" label="Author" sx={{ width: '120px' }}>
        <TextField 
          source="username" 
          sx={{
            '& span': {
              fontWeight: '500',
              color: 'info.main'
            }
          }}
        />
      </ReferenceField>
      <Box sx={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
        <GuideStatusField source="status" />
      </Box>
      <ReferenceArrayField 
        source="characterIds" 
        reference="characters" 
        label="Characters"
        sx={{ 
          maxWidth: '150px',
          '& .RaReferenceArrayField-ul': {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            listStyle: 'none',
            padding: 0,
            margin: 0
          }
        }}
      >
        <SingleFieldList linkType={false}>
          <ChipField 
            source="name" 
            size="small"
            sx={{
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              color: '#f43f5e',
              fontSize: '0.7rem',
              height: '20px'
            }}
          />
        </SingleFieldList>
      </ReferenceArrayField>
      <ReferenceField 
        source="arcId" 
        reference="arcs" 
        label="Arc"
        sx={{ width: '100px' }}
        emptyText=""
      >
        <ChipField 
          source="name" 
          size="small"
          sx={{
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            color: '#a855f7',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      </ReferenceField>
      <TextField 
        source="rejectionReason" 
        label="Rejection" 
        sx={{ 
          maxWidth: '150px',
          '& span': {
            fontSize: '0.8rem',
            color: 'error.main',
            fontStyle: 'italic'
          }
        }} 
      />
      <NumberField source="viewCount" label="Views" sx={{ width: '70px', textAlign: 'center' }} />
      <NumberField source="likeCount" label="Likes" sx={{ width: '70px', textAlign: 'center' }} />
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
          minWidth: '140px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '60px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }
        }}
      >
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

export const GuideApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Guide Approval Queue">
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
      <TextField 
        source="title" 
        sx={{ 
          maxWidth: '250px',
          '& span': {
            fontWeight: 'bold',
            color: 'primary.main'
          }
        }} 
      />
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
      <ReferenceField source="authorId" reference="users" label="Author" sx={{ width: '120px' }}>
        <TextField 
          source="username" 
          sx={{
            '& span': {
              fontWeight: '500',
              color: 'info.main'
            }
          }}
        />
      </ReferenceField>
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
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

const GuideShowContent = () => {
  const record = useRecordContext()
  
  if (!record) {
    return <Loading />
  }

  return (
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
                <FileText size={32} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: 'white', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {record?.title || 'Guide Title'}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.1rem',
                  opacity: 0.95
                }}>
                  {record?.description || 'No description provided'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ mb: 1 }}>
                  <GuideStatusField source="status" />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ID: {record?.id}
                </Typography>
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
              <ApproveGuideButton />
              <RejectGuideButton />
            </Box>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Guide Content */}
            {record?.content ? (
              <Card elevation={0} sx={{ 
                mb: 3,
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(225, 29, 72, 0.3)'
              }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                  color: 'white',
                  p: 2
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FileText size={24} />
                    Guide Content
                  </Typography>
                </Box>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    p: 3, 
                    border: '2px solid rgba(225, 29, 72, 0.2)', 
                    borderRadius: 2,
                    backgroundColor: '#0f0f0f',
                    minHeight: '200px',
                    '& h1': { 
                      fontSize: '1.75rem', 
                      fontWeight: 'bold', 
                      mb: 2,
                      color: '#e11d48',
                      borderBottom: '2px solid #e11d48',
                      pb: 1
                    },
                    '& h2': { 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      mb: 1.5,
                      color: '#f43f5e',
                      borderBottom: '1px solid rgba(225, 29, 72, 0.5)',
                      pb: 0.5
                    },
                    '& h3': { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      mb: 1,
                      color: '#f43f5e'
                    },
                    '& p': { 
                      mb: 1.5, 
                      lineHeight: 1.7,
                      fontSize: '1rem',
                      color: '#ffffff'
                    },
                    '& ul, & ol': { 
                      mb: 2, 
                      pl: 3,
                      color: '#ffffff',
                      '& li': { 
                        mb: 0.8,
                        lineHeight: 1.6
                      }
                    },
                    '& code': { 
                      backgroundColor: 'rgba(225, 29, 72, 0.2)', 
                      color: '#f43f5e',
                      padding: '4px 8px', 
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      border: '1px solid rgba(225, 29, 72, 0.3)',
                      fontFamily: 'monospace'
                    },
                    '& pre': { 
                      backgroundColor: '#000000', 
                      color: '#ffffff',
                      p: 3, 
                      borderRadius: 2, 
                      overflow: 'auto',
                      mb: 2,
                      border: '2px solid #e11d48',
                      '& code': {
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: 0
                      }
                    },
                    '& blockquote': {
                      borderLeft: '4px solid #e11d48',
                      backgroundColor: 'rgba(225, 29, 72, 0.1)',
                      pl: 3,
                      pr: 2,
                      py: 2,
                      ml: 0,
                      mr: 0,
                      fontStyle: 'italic',
                      mb: 2,
                      borderRadius: '0 8px 8px 0',
                      color: '#ffffff'
                    },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      mb: 2,
                      '& th, & td': {
                        border: '1px solid rgba(225, 29, 72, 0.3)',
                        padding: '12px',
                        textAlign: 'left',
                        color: '#ffffff'
                      },
                      '& th': {
                        backgroundColor: 'rgba(225, 29, 72, 0.2)',
                        fontWeight: 'bold',
                        color: '#f43f5e'
                      }
                    },
                    '& a': {
                      color: '#e11d48',
                      textDecoration: 'underline',
                      '&:hover': {
                        color: '#f43f5e'
                      }
                    }
                  }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {record.content}
                    </ReactMarkdown>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card elevation={0} sx={{ 
                mb: 3,
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(225, 29, 72, 0.3)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No content available for this guide.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar with Meta Information */}
          <Grid item xs={12} md={4}>
            {/* Author Information */}
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
                  <User size={20} />
                  Author Information
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: '#e11d48', 
                    width: 48, 
                    height: 48,
                    border: '2px solid rgba(225, 29, 72, 0.5)'
                  }}>
                    <User size={24} />
                  </Avatar>
                  <Box>
                    <ReferenceField source="authorId" reference="users" label="" link="show">
                      <TextField 
                        source="username" 
                        sx={{ 
                          '& span': { 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            color: '#e11d48'
                          }
                        }}
                      />
                    </ReferenceField>
                    <Typography variant="body2" color="text.secondary">
                      Guide Author
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Relations */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FileText size={20} />
                  Related Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {record?.characters && record.characters.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {record.characters.map((character: any) => (
                        <Chip 
                          key={character.id}
                          label={character.name} 
                          color="primary" 
                          size="small"
                          sx={{ backgroundColor: 'rgba(225, 29, 72, 0.2)', color: '#f43f5e' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {record?.arc && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Arc
                    </Typography>
                    <Chip 
                      label={record.arc.name} 
                      color="secondary" 
                      size="small"
                      sx={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#a855f7' }}
                    />
                  </Box>
                )}
                
                {record?.gambles && record.gambles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Gambles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {record.gambles.map((gamble: any) => (
                        <Chip 
                          key={gamble.id}
                          label={gamble.name} 
                          color="info" 
                          size="small"
                          sx={{ backgroundColor: 'rgba(25, 118, 210, 0.2)', color: '#60a5fa' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {(!record?.characters || record.characters.length === 0) && 
                 !record?.arc && 
                 (!record?.gambles || record.gambles.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No related content associated
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Eye size={20} />
                  Statistics
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(225, 29, 72, 0.3)'
                    }}>
                      <Eye size={24} color="#e11d48" style={{ marginBottom: 8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                        <NumberField source="viewCount" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(225, 29, 72, 0.3)'
                    }}>
                      <Heart size={24} color="#e11d48" style={{ marginBottom: 8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                        <NumberField source="likeCount" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Likes
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Dates & Rejection Reason */}
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
                  Submission Details
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created
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
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Updated
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={16} color="#e11d48" />
                    <DateField 
                      source="updatedAt" 
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
  )
}

export const GuideShow = () => {
  return (
    <Show>
      <GuideShowContent />
    </Show>
  )
}

export const GuideEdit = () => {
  const { permissions } = usePermissions()
  
  return (
    <Edit>
      <Box sx={{ 
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        p: 3,
        '& .RaEdit-main': {
          backgroundColor: 'transparent'
        }
      }}>
        <Card 
          elevation={0}
          sx={{ 
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #e11d48',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(225, 29, 72, 0.2)'
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
            p: 3,
            color: 'white'
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              <Edit3 size={32} />
              Edit Guide
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update guide content and settings
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <SimpleForm sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(225, 29, 72, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#e11d48'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#e11d48'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              },
              '& .MuiFormControl-root': {
                mb: 3
              }
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(225, 29, 72, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#e11d48', mb: 2, fontWeight: 'bold' }}>
                      Basic Information
                    </Typography>
                    <TextInput 
                      source="title" 
                      required 
                      fullWidth
                      label="Guide Title"
                      helperText="Enter a descriptive title for your guide"
                    />
                    <TextInput 
                      source="description" 
                      multiline 
                      rows={3} 
                      required 
                      fullWidth
                      label="Guide Description"
                      helperText="Provide a brief summary of what this guide covers"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(124, 58, 237, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#7c3aed', mb: 2, fontWeight: 'bold' }}>
                      Guide Content
                    </Typography>
                    <TextInput 
                      source="content" 
                      multiline 
                      rows={15} 
                      required 
                      fullWidth
                      label="Content (Markdown Supported)"
                      helperText="Write your guide content using Markdown formatting"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          lineHeight: 1.6
                        }
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                      Author Settings
                    </Typography>
                    <ReferenceInput 
                      source="authorId" 
                      reference="users" 
                      label="Author"
                      fullWidth
                    >
                      <AutocompleteInput 
                        optionText="username" 
                        disabled={permissions !== 'admin' && permissions !== 'moderator'}
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceInput>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(245, 124, 0, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(245, 124, 0, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                      Publication Status
                    </Typography>
                    <SelectInput 
                      source="status" 
                      choices={[
                        { id: 'draft', name: 'Draft' },
                        { id: 'pending', name: 'Pending Review' },
                        { id: 'published', name: 'Published' },
                        { id: 'rejected', name: 'Rejected' }
                      ]} 
                      fullWidth
                      sx={{
                        '& .MuiSelect-select': {
                          backgroundColor: '#0f0f0f'
                        }
                      }}
                    />
                    <TextInput 
                      source="rejectionReason" 
                      multiline 
                      rows={3} 
                      label="Rejection Reason" 
                      helperText="Required when status is rejected"
                      fullWidth
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 3, fontWeight: 'bold' }}>
                      Related Content
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <ReferenceArrayInput 
                          source="characterIds" 
                          reference="characters" 
                          label="Characters"
                        >
                          <AutocompleteArrayInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceArrayInput>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ReferenceInput 
                          source="arcId" 
                          reference="arcs" 
                          label="Arc"
                        >
                          <AutocompleteInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceInput>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ReferenceArrayInput 
                          source="gambleIds" 
                          reference="gambles" 
                          label="Gambles"
                        >
                          <AutocompleteArrayInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceArrayInput>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </SimpleForm>
          </CardContent>
        </Card>
      </Box>
    </Edit>
  )
}

export const GuideCreate = () => (
  <Create>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaCreate-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <Card 
        elevation={0}
        sx={{ 
          maxWidth: '1000px',
          mx: 'auto',
          backgroundColor: '#0a0a0a',
          border: '2px solid #e11d48',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(225, 29, 72, 0.2)'
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          p: 3,
          color: 'white'
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <FileText size={32} />
            Create New Guide
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Add a new guide to the system
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(225, 29, 72, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#e11d48'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#e11d48'
                }
              },
              '& .MuiInputBase-input': {
                color: '#ffffff'
              }
            },
            '& .MuiFormControl-root': {
              mb: 3
            }
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(225, 29, 72, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(225, 29, 72, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#e11d48', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="title" required fullWidth />
                  <TextInput source="description" multiline rows={3} required fullWidth />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(124, 58, 237, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#7c3aed', mb: 2, fontWeight: 'bold' }}>
                    Guide Content
                  </Typography>
                  <TextInput source="content" multiline rows={12} required fullWidth />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Author & Status
                  </Typography>
                  <ReferenceInput source="authorId" reference="users" label="Author">
                    <AutocompleteInput optionText="username" />
                  </ReferenceInput>
                  <SelectInput source="status" choices={[
                    { id: 'draft', name: 'Draft' },
                    { id: 'pending', name: 'Pending' },
                    { id: 'published', name: 'Published' },
                    { id: 'rejected', name: 'Rejected' }
                  ]} defaultValue="pending" />
                  <TextInput source="rejectionReason" multiline rows={3} label="Rejection Reason" helperText="Required when status is rejected" />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                    Related Content
                  </Typography>
                  <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
                    <AutocompleteArrayInput optionText="name" />
                  </ReferenceArrayInput>
                  <ReferenceInput source="arcId" reference="arcs" label="Arc">
                    <AutocompleteInput optionText="name" />
                  </ReferenceInput>
                  <ReferenceArrayInput source="gambleIds" reference="gambles" label="Gambles">
                    <AutocompleteArrayInput optionText="name" />
                  </ReferenceArrayInput>
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Create>
)