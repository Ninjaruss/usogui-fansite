import React, { useState, useEffect } from 'react'
import {
  List,
  Datagrid,
  TextField,
  ArrayField,
  ChipField,
  SingleFieldList,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  NumberInput,
  NumberField,
  FunctionField,
  ReferenceManyField,
  ReferenceField,
  WithRecord,
  SearchInput,
  ReferenceInput,
  AutocompleteInput,
  BulkDeleteButton,
  useRecordContext,
  useNotify,
  useRefresh,
  usePermissions,
  Button as RAButton,
  TopToolbar,
  BooleanField,
  EditButton
} from 'react-admin'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button as MuiButton,
  Divider, Tooltip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel,
  Autocomplete, TextField as MuiTextField, CircularProgress
} from '@mui/material'
import { Edit3, Plus, Users, ArrowRight, Building2, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react'
import { EntityDisplayMediaSection } from './EntityDisplayMediaSection'
import { Link } from 'react-router-dom'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'
import { RelationshipType } from '../../types'
import { api } from '../../lib/api'
import { RichMarkdownAdminInput } from '../RichMarkdownEditor/RichMarkdownAdminInput'
import { RELATIONSHIP_TYPE_VALUES, MAX_CHAPTER } from '../../lib/constants'

const RelationshipModalTrigger = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [characters, setCharacters] = useState<any[]>([])
  const [loadingChars, setLoadingChars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    targetCharacter: null as any,
    relationshipType: 'ally',
    description: '',
    reverseRelationshipType: '',
    reverseDescription: '',
    startChapter: '',
    endChapter: '',
    spoilerChapter: ''
  })

  const handleOpen = () => {
    setOpen(true)
    if (characters.length === 0) {
      setLoadingChars(true)
      api.getCharacters({ limit: 500 })
        .then(res => setCharacters(res.data || []))
        .catch(() => notify('Failed to load characters', { type: 'error' }))
        .finally(() => setLoadingChars(false))
    }
  }

  const handleClose = () => {
    setOpen(false)
    setForm({ targetCharacter: null, relationshipType: 'ally', description: '', reverseRelationshipType: '', reverseDescription: '', startChapter: '', endChapter: '', spoilerChapter: '' })
  }

  const handleSubmit = async () => {
    if (!form.targetCharacter) return notify('Please select a target character', { type: 'warning' })
    setSaving(true)
    try {
      await api.post('/character-relationships', {
        sourceCharacterId: record?.id,
        targetCharacterId: form.targetCharacter.id,
        relationshipType: form.relationshipType,
        description: form.description || undefined,
        reverseRelationshipType: form.reverseRelationshipType || undefined,
        reverseDescription: form.reverseDescription || undefined,
        startChapter: form.startChapter ? Number(form.startChapter) : undefined,
        endChapter: form.endChapter ? Number(form.endChapter) : undefined,
        spoilerChapter: form.spoilerChapter ? Number(form.spoilerChapter) : undefined
      })
      notify('Relationship added', { type: 'success' })
      refresh()
      handleClose()
    } catch {
      notify('Failed to add relationship', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <MuiButton
        onClick={handleOpen}
        size="small"
        variant="contained"
        startIcon={<Plus size={16} />}
        sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}
      >
        Add Relationship
      </MuiButton>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: '1.1rem' }}>
          Add Relationship — {record?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Autocomplete
            options={characters}
            getOptionLabel={(o: any) => o.name || ''}
            value={form.targetCharacter}
            onChange={(_, v) => setForm(f => ({ ...f, targetCharacter: v }))}
            loading={loadingChars}
            renderInput={(params) => (
              <MuiTextField {...params} label="Target Character *"
                helperText="The character this relationship points to"
                InputProps={{ ...params.InputProps, endAdornment: (<>{loadingChars && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>) }} />
            )}
          />
          <FormControl fullWidth>
            <InputLabel>Relationship Type</InputLabel>
            <Select value={form.relationshipType} label="Relationship Type"
              onChange={(e) => setForm(f => ({ ...f, relationshipType: e.target.value }))}>
              {RELATIONSHIP_TYPE_VALUES.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <MuiTextField label="Description (optional)" multiline rows={2} fullWidth
            helperText="Brief note about this relationship from the source character's perspective"
            value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Reverse Relationship Type (optional)</InputLabel>
            <Select value={form.reverseRelationshipType} label="Reverse Relationship Type (optional)"
              onChange={(e) => setForm(f => ({ ...f, reverseRelationshipType: e.target.value }))}>
              <MenuItem value="">No reverse relationship</MenuItem>
              {RELATIONSHIP_TYPE_VALUES.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          {form.reverseRelationshipType && (
            <MuiTextField label="Reverse Description (optional)" multiline rows={2} fullWidth
              helperText="How the target character views this relationship"
              value={form.reverseDescription} onChange={(e) => setForm(f => ({ ...f, reverseDescription: e.target.value }))} />
          )}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <MuiTextField label="Start Chapter" fullWidth type="number"
                helperText="Chapter this began (1–539)"
                inputProps={{ min: 1, max: 539 }}
                value={form.startChapter} onChange={(e) => setForm(f => ({ ...f, startChapter: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <MuiTextField label="End Chapter" fullWidth type="number"
                helperText="Chapter this ended (optional)"
                inputProps={{ min: 1, max: 539 }}
                value={form.endChapter} onChange={(e) => setForm(f => ({ ...f, endChapter: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <MuiTextField label="Spoiler Chapter" fullWidth type="number"
                helperText="Hides before this chapter"
                inputProps={{ min: 1, max: 539 }}
                value={form.spoilerChapter} onChange={(e) => setForm(f => ({ ...f, spoilerChapter: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <MuiButton onClick={handleClose} disabled={saving} size="large">Cancel</MuiButton>
          <MuiButton onClick={handleSubmit} variant="contained" size="large" disabled={saving || !form.targetCharacter}
            sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}>
            {saving ? 'Saving...' : 'Save Relationship'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

const OrgMembershipModalTrigger = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    organization: null as any,
    role: '',
    notes: '',
    startChapter: '',
    endChapter: '',
    spoilerChapter: ''
  })

  const handleOpen = () => {
    setOpen(true)
    if (organizations.length === 0) {
      setLoadingOrgs(true)
      api.getOrganizations({ limit: 500 })
        .then(res => setOrganizations(res.data || []))
        .catch(() => notify('Failed to load organizations', { type: 'error' }))
        .finally(() => setLoadingOrgs(false))
    }
  }

  const handleClose = () => {
    setOpen(false)
    setForm({ organization: null, role: '', notes: '', startChapter: '', endChapter: '', spoilerChapter: '' })
  }

  const handleSubmit = async () => {
    if (!form.organization) return notify('Please select an organization', { type: 'warning' })
    if (!form.role) return notify('Please enter a role', { type: 'warning' })
    setSaving(true)
    try {
      await api.post('/character-organizations', {
        characterId: record?.id,
        organizationId: form.organization.id,
        role: form.role,
        notes: form.notes || undefined,
        startChapter: form.startChapter ? Number(form.startChapter) : undefined,
        endChapter: form.endChapter ? Number(form.endChapter) : undefined,
        spoilerChapter: form.spoilerChapter ? Number(form.spoilerChapter) : undefined
      })
      notify('Membership added', { type: 'success' })
      refresh()
      handleClose()
    } catch {
      notify('Failed to add membership', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <MuiButton
        onClick={handleOpen}
        size="small"
        variant="contained"
        startIcon={<Plus size={16} />}
        sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
      >
        Add Membership
      </MuiButton>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '1.1rem' }}>
          Add Organization Membership — {record?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Autocomplete
            options={organizations}
            getOptionLabel={(o: any) => o.name || ''}
            value={form.organization}
            onChange={(_, v) => setForm(f => ({ ...f, organization: v }))}
            loading={loadingOrgs}
            renderInput={(params) => (
              <MuiTextField {...params} label="Organization *"
                helperText="The organization this character belongs to"
                InputProps={{ ...params.InputProps, endAdornment: (<>{loadingOrgs && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>) }} />
            )}
          />
          <MuiTextField label="Role *" fullWidth placeholder="e.g. Leader, Member, Referee"
            helperText="This character's position or title within the organization"
            value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} />
          <MuiTextField label="Notes (optional)" multiline rows={2} fullWidth
            helperText="Any additional context about this membership"
            value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <MuiTextField label="Start Chapter" fullWidth type="number"
                helperText="Chapter joined (1–539)"
                inputProps={{ min: 1, max: 539 }}
                value={form.startChapter} onChange={(e) => setForm(f => ({ ...f, startChapter: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <MuiTextField label="End Chapter" fullWidth type="number"
                helperText="Chapter left (optional)"
                inputProps={{ min: 1, max: 539 }}
                value={form.endChapter} onChange={(e) => setForm(f => ({ ...f, endChapter: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <MuiTextField label="Spoiler Chapter" fullWidth type="number"
                helperText="Hides before this chapter"
                inputProps={{ min: 1, max: 539 }}
                value={form.spoilerChapter} onChange={(e) => setForm(f => ({ ...f, spoilerChapter: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <MuiButton onClick={handleClose} disabled={saving} size="large">Cancel</MuiButton>
          <MuiButton onClick={handleSubmit} variant="contained" size="large" disabled={saving || !form.organization || !form.role}
            sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}>
            {saving ? 'Saving...' : 'Save Membership'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Color mapping for relationship types
const getRelationshipColor = (type: string) => {
  switch (type) {
    case 'ally': return '#22c55e'
    case 'rival': return '#f97316'
    case 'mentor': return '#8b5cf6'
    case 'subordinate': return '#06b6d4'
    case 'family': return '#ec4899'
    case 'partner': return '#ef4444'
    case 'enemy': return '#dc2626'
    case 'acquaintance': return '#6b7280'
    default: return '#9e9e9e'
  }
}

const characterFilters = [
  <SearchInput key="q" source="q" placeholder="Search characters" alwaysOn />,
  <ReferenceInput key="organizationId" source="organizationId" reference="organizations" label="Organization" alwaysOn>
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <NumberInput key="firstAppearanceFrom" source="firstAppearanceChapter_gte" label="First appearance from" min={1} max={MAX_CHAPTER} />,
  <NumberInput key="firstAppearanceTo" source="firstAppearanceChapter_lte" label="First appearance to" min={1} max={MAX_CHAPTER} />
]

const CharacterBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

const VerifyButton = ({ apiMethod }: { apiMethod: (id: number) => Promise<any> }) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const { permissions } = usePermissions()

  if (permissions !== 'admin' && permissions !== 'moderator') return null
  if (!record) return null

  const handleVerify = async () => {
    try {
      await apiMethod(Number(record.id))
      notify('Verified successfully', { type: 'success' })
      refresh()
    } catch (error: any) {
      notify(error?.message || 'Could not verify — you may have authored the last edit', { type: 'error' })
    }
  }

  if (record.isVerified) {
    return (
      <RAButton label="Verified" disabled color="success" startIcon={<CheckCircle size={16} />} onClick={() => {}} />
    )
  }

  return (
    <RAButton label="Verify" onClick={handleVerify} color="primary" startIcon={<Clock size={16} />} />
  )
}

const CharacterShowActions = () => (
  <TopToolbar>
    <EditButton />
    <VerifyButton apiMethod={api.verifyCharacter.bind(api)} />
  </TopToolbar>
)

export const CharacterList = () => (
  <List sort={{ field: 'name', order: 'ASC' }} filters={characterFilters}>
    <Datagrid rowClick="show" bulkActionButtons={<CharacterBulkActionButtons />}>
      <TextField source="id" sortable />
      <TextField source="name" sortable />
      <NumberField source="firstAppearanceChapter" label="First Chapter" sortable />
      <FunctionField
        label="Alternate Names"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: '200px' }}>
            {(record.alternateNames || []).slice(0, 3).map((name: string, index: number) => (
              <Chip
                key={index}
                label={name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            ))}
            {(record.alternateNames || []).length > 3 && (
              <Chip
                label={`+${record.alternateNames.length - 3}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(158, 158, 158, 0.1)',
                  color: '#9e9e9e',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            )}
          </Box>
        )}
      />
      <FunctionField
        label="Organizations"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: '200px' }}>
            {(record.organizations || []).map((org: any) => (
              <Chip
                key={org.id}
                label={org.name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            ))}
          </Box>
        )}
      />
      <FunctionField
        label=""
        render={(record: any) => (
          <Tooltip title={`View media for ${record.name}`}>
            <Link
              to={`/media?filter=${encodeURIComponent(JSON.stringify({ characterIds: String(record.id) }))}&page=1&perPage=25`}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#f97316' } }}>
                <ImageIcon size={16} />
              </IconButton>
            </Link>
          </Tooltip>
        )}
      />
      <BooleanField source="isVerified" label="Verified" />
    </Datagrid>
  </List>
)

export const CharacterShow = () => (
  <Show actions={<CharacterShowActions />}>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <FunctionField
        label="Description"
        render={(record: any) =>
          record.description ? (
            <EnhancedSpoilerMarkdown
              content={record.description}
              className="admin-description"
              enableEntityEmbeds={true}
              compactEntityCards={true}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No description
            </Typography>
          )
        }
      />
      <FunctionField
        label="Backstory"
        render={(record: any) =>
          record.backstory ? (
            <EnhancedSpoilerMarkdown
              content={record.backstory}
              className="admin-backstory"
              enableEntityEmbeds={true}
              compactEntityCards={true}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No backstory
            </Typography>
          )
        }
      />
      <NumberField source="firstAppearanceChapter" />
      <FunctionField
        label="Alternate Names"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(record.alternateNames || []).map((name: string, index: number) => (
              <Chip
                key={index}
                label={name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>
        )}
      />

      {/* Organization Memberships */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={20} />
          Organization Memberships
        </Typography>
        <ReferenceManyField
          reference="character-organizations"
          target="characterId"
          label={false}
        >
          <Datagrid
            bulkActionButtons={false}
            rowClick="show"
            empty={
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No organization memberships
              </Typography>
            }
          >
            <ReferenceField source="organizationId" reference="organizations" link="show" label="Organization">
              <TextField source="name" />
            </ReferenceField>
            <FunctionField
              label="Role"
              render={(record: any) => (
                <Chip
                  label={record.role}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}
                />
              )}
            />
            <FunctionField
              label="Chapter Range"
              render={(record: any) => (
                <Chip
                  label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                  size="small"
                  variant="outlined"
                />
              )}
            />
          </Datagrid>
        </ReferenceManyField>
      </Box>

      {/* Relationships */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Users size={20} />
          Relationships
        </Typography>
        <ReferenceManyField
          reference="character-relationships"
          target="sourceCharacterId"
          label={false}
        >
          <Datagrid
            bulkActionButtons={false}
            rowClick="show"
            empty={
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No relationships defined
              </Typography>
            }
          >
            <FunctionField
              label="To"
              render={(record: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowRight size={14} />
                  <ReferenceField source="targetCharacterId" reference="characters" link="show">
                    <TextField source="name" />
                  </ReferenceField>
                </Box>
              )}
            />
            <FunctionField
              label="Type"
              render={(record: any) => (
                <Chip
                  label={record.relationshipType}
                  size="small"
                  sx={{
                    backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                    color: getRelationshipColor(record.relationshipType),
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                />
              )}
            />
            <FunctionField
              label="Chapter"
              render={(record: any) => (
                <Chip
                  label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                  size="small"
                  variant="outlined"
                />
              )}
            />
          </Datagrid>
        </ReferenceManyField>
      </Box>

      {/* Entity Display Media */}
      <WithRecord render={(record) => (
        <EntityDisplayMediaSection
          ownerType="character"
          ownerId={record.id}
          accentColor="#1976d2"
        />
      )} />
    </SimpleShowLayout>
  </Show>
)

export const CharacterEdit = () => (
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
          border: '2px solid #1976d2',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(25, 118, 210, 0.2)'
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
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
            Edit Character
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Update character information and details
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm
            sanitizeEmptyValues={false}
            toolbar={
              <EditToolbar
                resource="characters"
                confirmTitle="Delete Character"
                confirmMessage="Are you sure you want to delete this character? This will remove all associated data and cannot be undone."
              />
            }
            sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(25, 118, 210, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#1976d2'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#1976d2'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              },
              '& .MuiFormControl-root': {
                mb: 3
              }
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="name" required fullWidth />
                  <RichMarkdownAdminInput source="description" label="Description" minHeight={150} />
                  <RichMarkdownAdminInput source="backstory" label="Backstory" minHeight={200} />
                  <NumberInput source="firstAppearanceChapter" max={MAX_CHAPTER} min={1} fullWidth helperText={`Chapter number when this character first appears (1–${MAX_CHAPTER})`} />
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
                    Additional Details
                  </Typography>
                  <ArrayInput source="alternateNames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Alternate Name" fullWidth helperText="Other names this character is known by" />
                    </SimpleFormIterator>
                  </ArrayInput>
                </Box>
              </Grid>

              {/* Character Relationships Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: 'rgba(139, 92, 246, 0.3)' }} />
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={20} />
                      Character Relationships
                    </Typography>
                    <RelationshipModalTrigger />
                  </Box>

                  {/* Outgoing Relationships */}
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, mt: 2 }}>
                    This Character&apos;s Relationships
                  </Typography>
                  <ReferenceManyField
                    reference="character-relationships"
                    target="sourceCharacterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No outgoing relationships defined
                        </Typography>
                      }
                    >
                      <FunctionField
                        label="To"
                        render={(record: any) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArrowRight size={14} />
                            <ReferenceField source="targetCharacterId" reference="characters" link={false}>
                              <TextField source="name" />
                            </ReferenceField>
                          </Box>
                        )}
                      />
                      <FunctionField
                        label="Type"
                        render={(record: any) => (
                          <Chip
                            label={record.relationshipType}
                            size="small"
                            sx={{
                              backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                              color: getRelationshipColor(record.relationshipType),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Divider sx={{ my: 2, borderColor: 'rgba(139, 92, 246, 0.2)' }} />

                  {/* Incoming Relationships */}
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Others&apos; Relationships to This Character
                  </Typography>
                  <ReferenceManyField
                    reference="character-relationships"
                    target="targetCharacterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No incoming relationships defined
                        </Typography>
                      }
                    >
                      <FunctionField
                        label="From"
                        render={(record: any) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReferenceField source="sourceCharacterId" reference="characters" link={false}>
                              <TextField source="name" />
                            </ReferenceField>
                            <ArrowRight size={14} />
                          </Box>
                        )}
                      />
                      <FunctionField
                        label="Type"
                        render={(record: any) => (
                          <Chip
                            label={record.relationshipType}
                            size="small"
                            sx={{
                              backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                              color: getRelationshipColor(record.relationshipType),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-relationships?filter=${encodeURIComponent(JSON.stringify({ sourceCharacterId: record.id }))}`}
                        size="small"
                        startIcon={<Users size={16} />}
                        sx={{ color: '#8b5cf6' }}
                      >
                        View All Relationships
                      </MuiButton>
                    )} />
                  </Box>
                </Box>
              </Grid>

              {/* Organization Memberships Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: 'rgba(16, 185, 129, 0.3)' }} />
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Building2 size={20} />
                      Organization Memberships
                    </Typography>
                    <OrgMembershipModalTrigger />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    Track this character&apos;s organization memberships with roles and timeline
                  </Typography>

                  <ReferenceManyField
                    reference="character-organizations"
                    target="characterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No organization memberships defined
                        </Typography>
                      }
                    >
                      <ReferenceField source="organizationId" reference="organizations" link={false} label="Organization">
                        <TextField source="name" />
                      </ReferenceField>
                      <FunctionField
                        label="Role"
                        render={(record: any) => (
                          <Chip
                            label={record.role}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter Range"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                      <FunctionField
                        label="Spoiler Ch."
                        render={(record: any) => (
                          <Chip
                            label={`Ch. ${record.spoilerChapter}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-organizations?filter=${encodeURIComponent(JSON.stringify({ characterId: record.id }))}`}
                        size="small"
                        startIcon={<Building2 size={16} />}
                        sx={{ color: '#10b981' }}
                      >
                        View All Memberships
                      </MuiButton>
                    )} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Edit>
)

export const CharacterCreate = () => (
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
          border: '2px solid #1976d2',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(25, 118, 210, 0.2)'
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
            Create New Character
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Add a new character to the system
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(25, 118, 210, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#1976d2'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#1976d2'
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
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="name" required fullWidth />
                  <RichMarkdownAdminInput source="description" label="Description" minHeight={150} />
                  <RichMarkdownAdminInput source="backstory" label="Backstory" minHeight={200} />
                  <NumberInput source="firstAppearanceChapter" max={MAX_CHAPTER} min={1} fullWidth helperText={`Chapter number when this character first appears (1–${MAX_CHAPTER})`} />
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
                    Additional Details
                  </Typography>
                  <ArrayInput source="alternateNames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Alternate Name" fullWidth helperText="Other names this character is known by" />
                    </SimpleFormIterator>
                  </ArrayInput>
                </Box>
              </Grid>

            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Create>
)
