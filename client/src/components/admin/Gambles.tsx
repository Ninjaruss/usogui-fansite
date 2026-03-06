import React, { useState } from 'react'
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
  TextInput,
  NumberInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  TabbedForm,
  FormTab,
  DateField,
  useEditController,
  TabbedShowLayout,
  Tab,
  ReferenceManyField,
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
  SearchInput,
  NumberField,
  FunctionField,
  WithRecord,
  useNotify,
  useRefresh
} from 'react-admin'
import {
  Box, Typography, Tooltip, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, TextField as MuiTextField, CircularProgress,
  Button as MuiButton, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Edit3, Plus, X } from 'lucide-react'
import { api } from '../../lib/api'

const FACTION_MEMBER_ROLES = ['leader', 'member', 'supporter', 'observer']

interface FactionMember {
  character: any
  role: string
}

interface FactionData {
  id?: number
  name: string
  supportedGambler: any | null
  members: FactionMember[]
}

const FactionEditor = ({ gambleId, initialFactions }: { gambleId: number, initialFactions: any[] }) => {
  const notify = useNotify()
  const refresh = useRefresh()
  const [factions, setFactions] = useState<FactionData[]>(
    initialFactions.map(f => ({
      id: f.id,
      name: f.name || '',
      supportedGambler: f.supportedGambler || null,
      members: (f.members || []).map((m: any) => ({ character: m.character, role: m.role || 'member' }))
    }))
  )
  const [characters, setCharacters] = useState<any[]>([])
  const [loadingChars, setLoadingChars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [factionForm, setFactionForm] = useState<FactionData>({ name: '', supportedGambler: null, members: [] })
  const [pendingMember, setPendingMember] = useState<{ character: any, role: string }>({ character: null, role: 'member' })

  const loadCharacters = () => {
    if (characters.length === 0 && !loadingChars) {
      setLoadingChars(true)
      api.getCharacters({ limit: 500 })
        .then(res => setCharacters(res.data || []))
        .catch(() => notify('Failed to load characters', { type: 'error' }))
        .finally(() => setLoadingChars(false))
    }
  }

  const handleOpenAdd = () => {
    setEditingIndex(null)
    setFactionForm({ name: '', supportedGambler: null, members: [] })
    setPendingMember({ character: null, role: 'member' })
    setModalOpen(true)
    loadCharacters()
  }

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index)
    setFactionForm({ ...factions[index], members: factions[index].members.map(m => ({ ...m })) })
    setPendingMember({ character: null, role: 'member' })
    setModalOpen(true)
    loadCharacters()
  }

  const handleDeleteFaction = (index: number) => {
    setFactions(f => f.filter((_, i) => i !== index))
  }

  const handleAddMember = () => {
    if (!pendingMember.character) return
    if (factionForm.members.find(m => m.character?.id === pendingMember.character.id)) return
    setFactionForm(f => ({ ...f, members: [...f.members, { ...pendingMember }] }))
    setPendingMember({ character: null, role: 'member' })
  }

  const handleRemoveMember = (idx: number) => {
    setFactionForm(f => ({ ...f, members: f.members.filter((_, i) => i !== idx) }))
  }

  const handleSaveFactionModal = () => {
    if (factionForm.members.length === 0) {
      notify('A faction must have at least one member', { type: 'warning' })
      return
    }
    if (editingIndex !== null) {
      setFactions(f => f.map((faction, i) => i === editingIndex ? { ...factionForm } : faction))
    } else {
      setFactions(f => [...f, { ...factionForm }])
    }
    setModalOpen(false)
  }

  const handleSaveFactions = async () => {
    setSaving(true)
    try {
      await api.put(`/gambles/${gambleId}`, {
        factions: factions.map(f => ({
          name: f.name || undefined,
          supportedGamblerId: f.supportedGambler?.id || undefined,
          memberIds: f.members.map(m => m.character.id),
          memberRoles: f.members.map(m => m.role)
        }))
      })
      notify('Factions saved successfully', { type: 'success' })
      refresh()
    } catch {
      notify('Failed to save factions', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
          Factions / Teams
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <MuiButton size="small" variant="outlined" startIcon={<Plus size={14} />}
            onClick={handleOpenAdd}
            sx={{ borderColor: 'rgba(211,47,47,0.5)', color: '#d32f2f', '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(211,47,47,0.05)' } }}>
            Add Faction
          </MuiButton>
          <MuiButton size="small" variant="contained" onClick={handleSaveFactions} disabled={saving}
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}>
            {saving ? 'Saving...' : 'Save Factions'}
          </MuiButton>
        </Box>
      </Box>

      {factions.length === 0 ? (
        <Box sx={{ p: 2, border: '1px dashed rgba(211,47,47,0.3)', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            No factions defined. Click "Add Faction" to create one.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {factions.map((faction, i) => (
            <Box key={i} sx={{ p: 1.5, border: '1px solid rgba(211,47,47,0.25)', borderRadius: 1, backgroundColor: '#0f0f0f', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mb: 0.5, fontWeight: 600 }}>
                  {faction.name || `Faction ${i + 1}`}
                  {faction.supportedGambler && (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'normal', marginLeft: 6 }}>
                      — Supports {faction.supportedGambler.name}
                    </span>
                  )}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {faction.members.map((m, mi) => (
                    <Chip key={mi} size="small"
                      label={`${m.character?.name || '?'} (${m.role || 'member'})`}
                      sx={{ fontSize: '0.65rem', height: 20, backgroundColor: 'rgba(211,47,47,0.1)', color: 'rgba(255,255,255,0.8)' }} />
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                <IconButton size="small" onClick={() => handleOpenEdit(i)}
                  sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#d32f2f' } }}>
                  <Edit3 size={14} />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteFaction(i)}
                  sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ef4444' } }}>
                  <X size={14} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(211,47,47,0.12)', color: '#d32f2f' }}>
          {editingIndex !== null ? 'Edit Faction' : 'Add Faction'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <MuiTextField label="Faction Name (optional)" size="small" fullWidth
            placeholder="e.g. Kakerou, L'air…" value={factionForm.name}
            onChange={(e) => setFactionForm(f => ({ ...f, name: e.target.value }))} />
          <Autocomplete
            options={characters}
            getOptionLabel={(o: any) => o.name || ''}
            value={factionForm.supportedGambler}
            onChange={(_, v) => setFactionForm(f => ({ ...f, supportedGambler: v }))}
            loading={loadingChars}
            renderInput={(params) => (
              <MuiTextField {...params} label="Supported Gambler (optional)" size="small"
                InputProps={{ ...params.InputProps, endAdornment: (<>{loadingChars && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>) }} />
            )}
          />
          <Box sx={{ border: '1px solid rgba(211,47,47,0.2)', borderRadius: 1, p: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, display: 'block', mb: 1 }}>
              Members *
            </Typography>
            {factionForm.members.map((m, mi) => (
              <Box key={mi} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>{m.character?.name}</Typography>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select value={m.role}
                    onChange={(e) => setFactionForm(f => ({
                      ...f, members: f.members.map((mem, i) => i === mi ? { ...mem, role: e.target.value } : mem)
                    }))}>
                    {FACTION_MEMBER_ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={() => handleRemoveMember(mi)}
                  sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef4444' } }}>
                  <X size={14} />
                </IconButton>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Autocomplete sx={{ flex: 1 }}
                options={characters.filter(c => !factionForm.members.find(m => m.character?.id === c.id))}
                getOptionLabel={(o: any) => o.name || ''}
                value={pendingMember.character}
                onChange={(_, v) => setPendingMember(p => ({ ...p, character: v }))}
                loading={loadingChars}
                renderInput={(params) => <MuiTextField {...params} label="Add character" size="small" />}
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>Role</InputLabel>
                <Select value={pendingMember.role} label="Role"
                  onChange={(e) => setPendingMember(p => ({ ...p, role: e.target.value }))}>
                  {FACTION_MEMBER_ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
                </Select>
              </FormControl>
              <MuiButton size="small" variant="outlined" onClick={handleAddMember}
                disabled={!pendingMember.character}
                sx={{ borderColor: 'rgba(211,47,47,0.5)', color: '#d32f2f', minWidth: 'auto', px: 1.5, '&:hover': { borderColor: '#d32f2f' } }}>
                <Plus size={16} />
              </MuiButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setModalOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={handleSaveFactionModal} variant="contained"
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}>
            {editingIndex !== null ? 'Update Faction' : 'Add Faction'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EntityDisplayMediaSection } from './EntityDisplayMediaSection'
import { EditToolbar } from './EditToolbar'


const GambleFilters = [
  <SearchInput key="search" source="name" placeholder="Search by name" alwaysOn />,
  <NumberInput key="chapter-filter" source="chapterId" label="Chapter" />,
]

const GambleListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const GambleList = () => (
  <List 
    filters={GambleFilters} 
    actions={<GambleListActions />}
    sort={{ field: 'chapterId', order: 'DESC' }}
  >
    <Datagrid rowClick="show" sx={{ '& .RaDatagrid-headerCell': { fontWeight: 600 } }}>
      <TextField source="name" sx={{ fontWeight: 500 }} />
      <FunctionField
        label="Description"
        render={(record: any) => {
          // Use description if available, otherwise fallback to rules
          let displayText = record.description

          if (!displayText || displayText.trim() === '') {
            displayText = record.rules || 'No description available'
          }

          return (
            <Box sx={{ maxWidth: '350px' }}>
              <Typography
                variant="body2"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.8rem',
                  color: displayText === 'No description available' ? 'text.disabled' : 'text.secondary',
                  lineHeight: 1.3,
                  fontStyle: displayText === 'No description available' ? 'italic' : 'normal'
                }}
              >
                {displayText}
              </Typography>
            </Box>
          )
        }}
      />
      <NumberField source="chapterId" label="Chapter" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
        </SingleFieldList>
      </ArrayField>
      <DateField source="createdAt" showTime={false} label="Created" sortable />
      <FunctionField
        label=""
        render={(record: any) => (
          <Tooltip title={`View media for ${record.name}`}>
            <Link
              to={`/media?filter=${encodeURIComponent(JSON.stringify({ gambleIds: String(record.id) }))}&page=1&perPage=25`}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#f97316' } }}>
                <ImageIcon size={16} />
              </IconButton>
            </Link>
          </Tooltip>
        )}
      />
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaShow-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <TabbedShowLayout sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedShowLayout-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            },
            '&:hover': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#d32f2f',
            height: 3
          }
        }
      }}>
        <Tab label="Overview">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <TextField source="name" 
              sx={{ 
                mb: 3, 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                display: 'block',
                '& .MuiTypography-root': { 
                  fontSize: '1.5rem', 
                  fontWeight: 600,
                  color: '#ffffff'
                }
              }} 
            />
            
            <Box sx={{
              p: 2,
              bgcolor: '#0f0f0f',
              borderRadius: 1,
              border: '1px solid rgba(211, 47, 47, 0.3)',
              mb: 3
            }}>
              <Typography variant="subtitle2" color="#d32f2f" fontWeight="bold" gutterBottom>Description</Typography>
              <FunctionField
                source="description"
                render={(record: any) =>
                  record.description ? (
                    <EnhancedSpoilerMarkdown
                      content={record.description}
                      className="admin-gamble-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No description provided
                    </Typography>
                  )
                }
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(211, 47, 47, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#d32f2f" fontWeight="bold" gutterBottom>Chapter</Typography>
                <NumberField source="chapterId" sx={{ fontWeight: 500, fontSize: '1.1rem', color: '#ffffff' }} />
              </Box>
              
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#1976d2" fontWeight="bold" gutterBottom>Created</Typography>
                <DateField source="createdAt" showTime={false} sx={{ fontWeight: 500, color: '#ffffff' }} />
                <DateField source="updatedAt" showTime={false} label="Updated" sx={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }} />
              </Box>
            </Box>
          </Box>
        </Tab>
      
        <Tab label="Game Rules">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Rules</Typography>
            <FunctionField 
              source="rules"
              render={(record: any) => 
                record.rules ? (
                  <Box sx={{
                    p: 2, 
                    bgcolor: '#0f0f0f', 
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                    mb: 3
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.rules}
                      className="admin-gamble-rules"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No rules defined
                  </Typography>
                )
              }
            />
            
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Win Conditions</Typography>
            <FunctionField 
              source="winCondition"
              render={(record: any) => 
                record.winCondition ? (
                  <Box sx={{
                    p: 2, 
                    bgcolor: '#0f0f0f', 
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.winCondition}
                      className="admin-gamble-win-condition"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific win conditions defined
                  </Typography>
                )
              }
            />

            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mt: 3 }}>Explanation & Analysis</Typography>
            <FunctionField
              source="explanation"
              render={(record: any) =>
                record.explanation ? (
                  <Box sx={{
                    p: 2,
                    bgcolor: '#0f0f0f',
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.explanation}
                      className="admin-gamble-explanation"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No explanation provided
                  </Typography>
                )
              }
            />
          </Box>
        </Tab>

        <Tab label="Participants">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            {/* Display factions if available */}
            <FunctionField
              render={(record: any) => {
                if (record.factions && record.factions.length > 0) {
                  return (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
                        Factions / Teams
                      </Typography>
                      {record.factions.map((faction: any, index: number) => (
                        <Box
                          key={faction.id || index}
                          sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: '#0f0f0f',
                            border: '1px solid rgba(211, 47, 47, 0.3)',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 1 }}>
                            {faction.name || `Faction ${index + 1}`}
                            {faction.supportedGambler && (
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'normal', marginLeft: 8 }}>
                                (Supporting: {faction.supportedGambler.name})
                              </span>
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {faction.members?.map((member: any) => (
                              <Box
                                key={member.id}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                  border: '1px solid rgba(211, 47, 47, 0.3)',
                                  borderRadius: 1,
                                  color: '#ffffff',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {member.character?.name || 'Unknown'}
                                {member.role && (
                                  <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                                    ({member.role})
                                  </span>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </>
                  )
                }
                return null
              }}
            />

            {/* Legacy participants display */}
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
              All Participants (Legacy)
            </Typography>
            <ArrayField source="participants" label={false}>
              <Datagrid
                bulkActionButtons={false}
                sx={{
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  borderRadius: 1,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="nicknames" label="Also known as" emptyText="-" sx={{ color: '#ffffff' }} />
              </Datagrid>
            </ArrayField>
          </Box>
        </Tab>
      
        <Tab label="Related Events">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Events in this Gamble</Typography>
            <ReferenceManyField
              reference="events"
              target="gambleId"
              label={false}
              emptyText="No related events found"
            >
              <Datagrid 
                bulkActionButtons={false} 
                rowClick="show" 
                sx={{ 
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  borderRadius: 1,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="title" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="type" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
                <NumberField source="chapterNumber" label="Ch." sx={{ color: '#ffffff' }} />
                <TextField source="status" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
              </Datagrid>
            </ReferenceManyField>
          </Box>
        </Tab>
        <Tab label="Media">
          <WithRecord render={(record) => (
            <EntityDisplayMediaSection
              ownerType="gamble"
              ownerId={record.id}
              accentColor="#d32f2f"
            />
          )} />
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

const GambleEditForm = () => {
  const { record, isLoading } = useEditController()
  
  if (isLoading || !record) return null

  // Transform record to include participantIds for the form
  const transformedRecord = {
    ...record,
    participantIds: record.participants ? record.participants.map((p: any) => p.id) : []
  }

  return (
    <TabbedForm
      record={transformedRecord}
      sanitizeEmptyValues={false}
      toolbar={<GambleEditToolbar />}
      sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedForm-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            },
            '&:hover': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#d32f2f',
            height: 3
          }
        },
        '& .MuiTextField-root': {
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            '&:hover': {
              borderColor: 'rgba(211, 47, 47, 0.5)'
            },
            '&.Mui-focused': {
              borderColor: '#d32f2f'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#d32f2f'
            }
          },
          '& .MuiInputBase-input': {
            color: '#ffffff'
          },
          '& .MuiFormHelperText-root': {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        },
        '& .MuiFormControl-root': {
          mb: 3
        }
      }}
    >
      <FormTab label="Basic Info">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Gamble Details</Typography>
          <TextInput
            source="name"
            required
            fullWidth
            sx={{ mb: 3 }}
            helperText="Name or title of this gamble"
          />

          <TextInput
            source="description"
            multiline
            rows={3}
            fullWidth
            label="Description"
            helperText="Brief description of this gamble (optional). Supports Markdown formatting."
            sx={{ mb: 3 }}
          />

          <NumberInput
            source="chapterId"
            label="Chapter Number"
            required
            min={1}
            max={539}
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ width: '200px' }}
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ maxWidth: 800, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>How the Game Works</Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works. Supports Markdown formatting."
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Victory Conditions</Typography>
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional). Supports Markdown formatting."
          />

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Explanation & Analysis</Typography>
          <TextInput
            source="explanation"
            multiline
            rows={8}
            fullWidth
            label="Explanation"
            helperText="In-depth explanation of gamble mechanics, strategy, and analysis (optional). Supports Markdown formatting."
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Gamble Participants</Typography>
          <ReferenceArrayInput source="participantIds" reference="characters" perPage={200}>
            <AutocompleteArrayInput
              optionText="name"
              helperText="Characters who participated in this gamble (legacy - for quick selection)"
              fullWidth
              noOptionsText="No characters available"
              sx={{
                '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f'
                }
              }}
            />
          </ReferenceArrayInput>

          <FactionEditor gambleId={record.id} initialFactions={record.factions || []} />
        </Box>
      </FormTab>

      <FormTab label="Related Events">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Associated Events</Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
            Events related to this gamble are managed from the Events admin page.
            After saving this gamble, you can link events to it from the Events section.
          </Typography>
        </Box>
      </FormTab>
    </TabbedForm>
  )
}

const GambleEditToolbar = () => (
  <EditToolbar 
    resource="gambles"
    confirmTitle="Delete Gamble"
    confirmMessage="Are you sure you want to delete this gamble? This will remove all associated events and data and cannot be undone."
  />
)

export const GambleEdit = () => {
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
        <GambleEditForm />
      </Box>
    </Edit>
  )
}

export const GambleCreate = () => {
  return (
    <Create>
      <Box sx={{ 
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        p: 3,
        '& .RaCreate-main': {
          backgroundColor: 'transparent'
        }
      }}>
        <TabbedForm sx={{
          backgroundColor: '#0a0a0a',
          '& .RaTabbedForm-content': {
            backgroundColor: '#0a0a0a',
            border: '2px solid #16a34a',
            borderRadius: 2,
            borderTop: 'none',
            p: 0
          },
          '& .MuiTabs-root': {
            backgroundColor: '#0a0a0a',
            border: '2px solid #16a34a',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.1)'
              },
              '&:hover': {
                color: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.05)'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#16a34a',
              height: 3
            }
          },
          '& .MuiTextField-root': {
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
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(255, 255, 255, 0.6)'
            }
          },
          '& .MuiFormControl-root': {
            mb: 3
          }
        }}>
          <FormTab label="Basic Info">
            <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>New Gamble</Typography>
              <TextInput
                source="name"
                required
                fullWidth
                sx={{ mb: 3 }}
                helperText="Name or title of this gamble"
              />

              <TextInput
                source="description"
                multiline
                rows={3}
                fullWidth
                label="Description"
                helperText="Brief description of this gamble (optional). Supports Markdown formatting."
                sx={{ mb: 3 }}
              />

              <NumberInput
                source="chapterId"
                label="Chapter Number"
                required
                min={1}
                max={539}
                helperText="Chapter where this gamble occurs (1-539)"
                sx={{ width: '200px' }}
              />
            </Box>
          </FormTab>

          <FormTab label="Game Rules">
            <Box sx={{ maxWidth: 800, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>How the Game Works</Typography>
              <TextInput 
                source="rules" 
                multiline 
                rows={8} 
                required 
                fullWidth
                label="Game Rules"
                helperText="Detailed explanation of how the gamble works. Supports Markdown formatting."
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Victory Conditions</Typography>
              <TextInput 
                source="winCondition" 
                multiline 
                rows={4}
                fullWidth
                label="Win Conditions"
                helperText="What determines victory in this gamble (optional). Supports Markdown formatting."
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Explanation & Analysis</Typography>
              <TextInput
                source="explanation"
                multiline
                rows={8}
                fullWidth
                label="Explanation"
                helperText="In-depth explanation of gamble mechanics, strategy, and analysis (optional). Supports Markdown formatting."
              />
            </Box>
          </FormTab>

          <FormTab label="Participants">
            <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Gamble Participants</Typography>
              <ReferenceArrayInput source="participantIds" reference="characters" perPage={200}>
                <AutocompleteArrayInput 
                  optionText="name" 
                  helperText="Characters who participated in this gamble"
                  fullWidth
                  noOptionsText="No characters available"
                  sx={{
                    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f'
                    }
                  }}
                />
              </ReferenceArrayInput>
            </Box>
          </FormTab>

          <FormTab label="Related Events">
            <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Associated Events</Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
                Events related to this gamble are managed from the Events admin page.
                After creating this gamble, you can link events to it from the Events section.
              </Typography>
            </Box>
          </FormTab>
        </TabbedForm>
      </Box>
    </Create>
  )
}