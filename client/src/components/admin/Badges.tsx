'use client';

import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  NumberField,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  Show,
  SimpleShowLayout,
  CreateButton,
  TopToolbar,
  useRecordContext,
  FunctionField,
} from 'react-admin';
import { Chip, Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Edit3, Plus, Award } from 'lucide-react'
import { EditToolbar } from './EditToolbar'

const BadgeActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

// Custom field to display badge preview using Material-UI Chip
const BadgePreview = ({ badge, size = 'medium' }: { badge?: any; size?: 'small' | 'medium' }) => {
  const record = useRecordContext();
  const badgeData = badge || record;
  if (!badgeData) return null;

  return (
    <Chip
      label={badgeData.name}
      size={size}
      variant="outlined"
      sx={{
        borderColor: badgeData.color,
        color: badgeData.color,
        backgroundColor: badgeData.backgroundColor ? `${badgeData.backgroundColor}33` : 'transparent',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
        '&:hover': {
          backgroundColor: badgeData.backgroundColor ? `${badgeData.backgroundColor}44` : `${badgeData.color}11`,
          borderColor: badgeData.color,
          transform: 'scale(1.02)'
        },
        '& .MuiChip-label': {
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          fontWeight: 600
        }
      }}
    />
  );
};

export const BadgeList = () => (
  <List actions={<BadgeActions />}>
    <Datagrid rowClick="show">
      <FunctionField
        label="Preview"
        render={(record: any) => (
          <BadgePreview badge={record} size="small" />
        )}
      />
      <TextField source="name" />
      <TextField source="type" />
      <FunctionField
        label="Description"
        render={(record: any) => (
          <Box sx={{ maxWidth: '250px' }}>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.8rem',
                color: record.description ? 'text.secondary' : 'text.disabled',
                fontStyle: record.description ? 'normal' : 'italic'
              }}
            >
              {record.description || 'No description'}
            </Typography>
          </Box>
        )}
      />
      <NumberField source="displayOrder" label="Order" />
      <BooleanField source="isActive" />
      <BooleanField source="isManuallyAwardable" label="Manual Award" />
      <DateField source="createdAt" showTime={false} />
    </Datagrid>
  </List>
);

export const BadgeShow = () => (
  <Show>
    <Box sx={{
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
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
          border: '2px solid #f59e0b',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
              <Award size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                source="name"
                sx={{
                  mb: 1,
                  '& .MuiTypography-root': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FunctionField
                  render={(record: any) => (
                    <Chip
                      label={record.type}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                  )}
                />
                <FunctionField
                  render={(record: any) => (
                    <Chip
                      label={record.isActive ? 'Active' : 'Inactive'}
                      sx={{
                        backgroundColor: record.isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Badge ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
              </Typography>
              <FunctionField
                render={(record: any) => (
                  <Box sx={{ mt: 1 }}>
                    <BadgePreview badge={record} size="medium" />
                  </Box>
                )}
              />
            </Box>
          </Box>
        </Box>
      </Card>

      <SimpleShowLayout sx={{
        backgroundColor: '#0a0a0a',
        p: 4,
        border: '2px solid #f59e0b',
        borderRadius: 2,
        '& .RaLabeled-label': {
          color: '#f59e0b',
          fontWeight: 'bold',
          fontSize: '0.875rem',
          marginBottom: '4px'
        }
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, fontWeight: 'bold' }}>Badge Details</Typography>
              <TextField source="description" sx={{ display: 'block', mb: 2, '& span': { color: '#ffffff' } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#f59e0b' }}>Icon</Typography>
                  <TextField source="icon" sx={{ display: 'block', '& span': { color: '#ffffff', fontSize: '1.5rem' } }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#f59e0b' }}>Color</Typography>
                  <TextField source="color" sx={{ display: 'block', '& span': { color: '#ffffff' } }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#f59e0b' }}>Background</Typography>
                  <TextField source="backgroundColor" sx={{ display: 'block', '& span': { color: '#ffffff' } }} />
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, fontWeight: 'bold' }}>Settings</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Display Order:</Typography>
                  <NumberField source="displayOrder" sx={{ '& span': { color: '#ffffff', fontWeight: 'bold' } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Active:</Typography>
                  <BooleanField source="isActive" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Manually Awardable:</Typography>
                  <BooleanField source="isManuallyAwardable" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Created:</Typography>
                  <DateField source="createdAt" sx={{ '& span': { color: '#ffffff' } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Updated:</Typography>
                  <DateField source="updatedAt" sx={{ '& span': { color: '#ffffff' } }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </SimpleShowLayout>
    </Box>
  </Show>
);

export const BadgeCreate = () => (
  <Create>
    <SimpleForm>
      <Box sx={{
        backgroundColor: '#0a0a0a',
        width: '100%',
        p: 3
      }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #16a34a',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(22, 163, 74, 0.2)'
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
              <Plus size={32} />
              Create New Badge
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new badge to the system
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
              '& .MuiTextField-root, & .MuiFormControl-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(22, 163, 74, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#16a34a'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#16a34a'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              }
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(22, 163, 74, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(22, 163, 74, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                      Badge Details
                    </Typography>
                    <TextInput source="name" required fullWidth label="Badge Name" />
                    <TextInput source="description" multiline rows={3} fullWidth label="Description" />
                    <SelectInput
                      source="type"
                      choices={[
                        { id: 'supporter', name: 'Supporter' },
                        { id: 'active_supporter', name: 'Active Supporter' },
                        { id: 'sponsor', name: 'Sponsor' },
                        { id: 'custom', name: 'Custom' },
                      ]}
                      required
                      fullWidth
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(22, 163, 74, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(22, 163, 74, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                      Appearance
                    </Typography>
                    <TextInput source="icon" required fullWidth helperText="Emoji or icon character" />
                    <TextInput source="color" required fullWidth helperText="Hex color code (e.g., #FFD700)" />
                    <TextInput source="backgroundColor" fullWidth helperText="Hex color code (e.g., #1A1A1A)" />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(22, 163, 74, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(22, 163, 74, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                      Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <NumberInput source="displayOrder" defaultValue={10} required fullWidth />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <BooleanInput source="isActive" defaultValue={true} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <BooleanInput source="isManuallyAwardable" defaultValue={false} label="Manually Awardable" />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Create>
);

export const BadgeEdit = () => (
  <Edit>
    <SimpleForm
      toolbar={
        <EditToolbar
          resource="badges"
          confirmTitle="Delete Badge"
          confirmMessage="Are you sure you want to delete this badge? Users who have been awarded this badge will lose it. This action cannot be undone."
        />
      }
    >
      <Box sx={{
        backgroundColor: '#0a0a0a',
        width: '100%',
        p: 3
      }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #f59e0b',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
              Edit Badge
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update badge information and appearance
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
              '& .MuiTextField-root, & .MuiFormControl-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(245, 158, 11, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#f59e0b'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#f59e0b'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              }
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, fontWeight: 'bold' }}>
                      Badge Details
                    </Typography>
                    <TextInput source="name" required fullWidth label="Badge Name" />
                    <TextInput source="description" multiline rows={3} fullWidth label="Description" />
                    <SelectInput
                      source="type"
                      choices={[
                        { id: 'supporter', name: 'Supporter' },
                        { id: 'active_supporter', name: 'Active Supporter' },
                        { id: 'sponsor', name: 'Sponsor' },
                        { id: 'custom', name: 'Custom' },
                      ]}
                      required
                      fullWidth
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, fontWeight: 'bold' }}>
                      Appearance
                    </Typography>
                    <TextInput source="icon" required fullWidth helperText="Emoji or icon character" />
                    <TextInput source="color" required fullWidth helperText="Hex color code (e.g., #FFD700)" />
                    <TextInput source="backgroundColor" fullWidth helperText="Hex color code (e.g., #1A1A1A)" />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, fontWeight: 'bold' }}>
                      Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <NumberInput source="displayOrder" required fullWidth />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <BooleanInput source="isActive" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <BooleanInput source="isManuallyAwardable" label="Manually Awardable" />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Edit>
);

// Badge awarding component - Simple preview for testing
export const BadgeAward = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Badge Management</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Badge management functionality is integrated into the user management interface.
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
        To award or manage badges, go to Users → Select User → Award Badge
      </Typography>
    </Box>
  );
};
