'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
  Autocomplete,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper
} from '@mui/material'
import { 
  HelpCircle, 
  Code, 
  Copy, 
  ChevronDown,
  User,
  BookOpen,
  Dice6,
  FileText,
  Users,
  Hash,
  Volume2,
  Quote
} from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { api } from '../lib/api'

interface EntityOption {
  id: number
  name: string
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  subtitle?: string
}

interface EntityEmbedHelperProps {
  onInsertEmbed?: (embedCode: string) => void
}

const EntityEmbedHelperWithSearch: React.FC<EntityEmbedHelperProps> = ({ onInsertEmbed }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<EntityOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [allEntities, setAllEntities] = useState<{
    characters: any[]
    arcs: any[]
    gambles: any[]
    guides: any[]
    organizations: any[]
    chapters: any[]
    volumes: any[]
    quotes: any[]
  }>({
    characters: [],
    arcs: [],
    gambles: [],
    guides: [],
    organizations: [],
    chapters: [],
    volumes: [],
    quotes: []
  })

  const entityTypes = [
    {
      type: 'character',
      label: 'Character',
      icon: <User size={16} />,
      color: theme.palette.usogui?.character || theme.palette.primary.main,
      description: 'Link to character profiles',
      examples: [
        { code: '{{character:1}}', description: 'Basic character embed' },
        { code: '{{character:1|Baku Madarame}}', description: 'Character with custom text' }
      ]
    },
    {
      type: 'arc',
      label: 'Arc',
      icon: <BookOpen size={16} />,
      color: theme.palette.usogui?.arc || theme.palette.secondary.main,
      description: 'Link to story arcs',
      examples: [
        { code: '{{arc:5}}', description: 'Basic arc embed' },
        { code: '{{arc:5|Tower Arc}}', description: 'Arc with custom text' }
      ]
    },
    {
      type: 'gamble',
      label: 'Gamble',
      icon: <Dice6 size={16} />,
      color: theme.palette.usogui?.gamble || theme.palette.warning.main,
      description: 'Link to gambling events',
      examples: [
        { code: '{{gamble:12}}', description: 'Basic gamble embed' },
        { code: '{{gamble:12|Air Poker}}', description: 'Gamble with custom text' }
      ]
    },
    {
      type: 'guide',
      label: 'Guide',
      icon: <FileText size={16} />,
      color: theme.palette.usogui?.guide || theme.palette.success.main,
      description: 'Link to other guides',
      examples: [
        { code: '{{guide:3}}', description: 'Basic guide embed' },
        { code: '{{guide:3|Gambling Rules Guide}}', description: 'Guide with custom text' }
      ]
    },
    {
      type: 'organization',
      label: 'Organization',
      icon: <Users size={16} />,
      color: theme.palette.info.main,
      description: 'Link to organizations and groups',
      examples: [
        { code: '{{organization:2}}', description: 'Basic organization embed' },
        { code: '{{organization:2|Kakerou}}', description: 'Organization with custom text' }
      ]
    },
    {
      type: 'chapter',
      label: 'Chapter',
      icon: <Hash size={16} />,
      color: theme.palette.primary.main,
      description: 'Link to specific chapters',
      examples: [
        { code: '{{chapter:150}}', description: 'Basic chapter embed' },
        { code: '{{chapter:150|The Final Gamble}}', description: 'Chapter with custom text' }
      ]
    },
    {
      type: 'volume',
      label: 'Volume',
      icon: <Volume2 size={16} />,
      color: theme.palette.secondary.main,
      description: 'Link to manga volumes',
      examples: [
        { code: '{{volume:20}}', description: 'Basic volume embed' },
        { code: '{{volume:20|The Conclusion}}', description: 'Volume with custom text' }
      ]
    },
    {
      type: 'quote',
      label: 'Quote',
      icon: <Quote size={16} />,
      color: theme.palette.text.secondary,
      description: 'Link to memorable quotes',
      examples: [
        { code: '{{quote:45}}', description: 'Basic quote embed' }
      ]
    }
  ]

  // Load all entities on mount (similar to admin guides page approach)
  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes, quotesRes] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 }),
          api.getGambles({ limit: 100 }),
          api.getQuotes({ limit: 100 })
        ])
        
        setAllEntities({
          characters: charactersRes.data || [],
          arcs: arcsRes.data || [],
          gambles: gamblesRes.data || [],
          guides: [], // These would need separate API calls
          organizations: [], // These would need separate API calls
          chapters: [], // These would need separate API calls
          volumes: [], // These would need separate API calls
          quotes: quotesRes.data || []
        })
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }

    loadAllEntities()
  }, [])

  // Client-side search function (similar to admin guides page)
  const searchEntities = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const results: EntityOption[] = []
      const searchLower = query.toLowerCase()

      // Search characters
      const matchingCharacters = allEntities.characters
        .filter(c => c.name.toLowerCase().includes(searchLower))
        .map(c => ({
          id: c.id,
          name: c.name,
          type: 'character' as EntityOption['type'],
          subtitle: c.description || c.arc?.name
        }))
      results.push(...matchingCharacters.slice(0, 5))

      // Search arcs
      const matchingArcs = allEntities.arcs
        .filter(a => a.name.toLowerCase().includes(searchLower))
        .map(a => ({
          id: a.id,
          name: a.name,
          type: 'arc' as EntityOption['type'],
          subtitle: a.description
        }))
      results.push(...matchingArcs.slice(0, 5))

      // Search gambles
      const matchingGambles = allEntities.gambles
        .filter(g => g.name.toLowerCase().includes(searchLower))
        .map(g => ({
          id: g.id,
          name: g.name,
          type: 'gamble' as EntityOption['type'],
          subtitle: g.description || g.arc?.name
        }))
      results.push(...matchingGambles.slice(0, 5))

      // Search guides
      const matchingGuides = allEntities.guides
        .filter(g => g.title.toLowerCase().includes(searchLower))
        .map(g => ({
          id: g.id,
          name: g.title,
          type: 'guide' as EntityOption['type'],
          subtitle: g.description
        }))
      results.push(...matchingGuides.slice(0, 5))

      // Search organizations
      const matchingOrganizations = allEntities.organizations
        .filter((o: any) => o.name.toLowerCase().includes(searchLower))
        .map((o: any) => ({
          id: o.id,
          name: o.name,
          type: 'organization' as EntityOption['type'],
          subtitle: o.description
        }))
      results.push(...matchingOrganizations.slice(0, 3))

      // Search chapters
      const matchingChapters = allEntities.chapters
        .filter(c => 
          (c.title && c.title.toLowerCase().includes(searchLower)) ||
          c.number.toString().includes(query)
        )
        .map(c => ({
          id: c.id,
          name: c.title || `Chapter ${c.number}`,
          type: 'chapter' as EntityOption['type'],
          subtitle: c.summary
        }))
      results.push(...matchingChapters.slice(0, 3))

      // Search volumes
      const matchingVolumes = allEntities.volumes
        .filter(v => 
          (v.name && v.name.toLowerCase().includes(searchLower)) ||
          v.number.toString().includes(query)
        )
        .map(v => ({
          id: v.id,
          name: v.name || `Volume ${v.number}`,
          type: 'volume' as EntityOption['type'],
          subtitle: v.description
        }))
      results.push(...matchingVolumes.slice(0, 3))

      // Search quotes
      const matchingQuotes = allEntities.quotes
        .filter(q => q.text.toLowerCase().includes(searchLower))
        .map(q => ({
          id: q.id,
          name: q.text.substring(0, 50) + (q.text.length > 50 ? '...' : ''),
          type: 'quote' as EntityOption['type'],
          subtitle: q.character?.name || q.source
        }))
      results.push(...matchingQuotes.slice(0, 3))

      // Sort by relevance (exact matches first, then partial matches)
      const sortedResults = results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchLower
        const bExact = b.name.toLowerCase() === searchLower
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        
        const aStarts = a.name.toLowerCase().startsWith(searchLower)
        const bStarts = b.name.toLowerCase().startsWith(searchLower)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        
        return a.name.localeCompare(b.name)
      })

      setSearchResults(sortedResults.slice(0, 20)) // Limit to 20 results
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [allEntities])

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEntities(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchEntities])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (onInsertEmbed) {
      onInsertEmbed(embedCode)
    }
    copyToClipboard(embedCode)
  }

  const handleInsertEntity = (entity: EntityOption) => {
    const embed = `{{${entity.type}:${entity.id}:${entity.name}}}`
    handleInsertEmbed(embed)
    setSearchQuery('')
    setSearchResults([])
  }

  const getEntityColor = (type: string) => {
    return entityTypes.find(et => et.type === type)?.color || '#666'
  }

  const exampleContent = `# Example Guide with Entity Embeds

This guide demonstrates how entity embeds work in practice.

## Characters
Meet the main character: {{character:1|Baku Madarame}}

## Story Arcs
This event happens during the {{arc:5|Tower Arc}}.

## Gambles
The most complex gamble was {{gamble:12|Air Poker}}.

## References
For more details, see {{guide:3|Gambling Rules Guide}} and {{chapter:150}}.`

  return (
    <>
      <Card sx={{ 
        mb: 3,
        border: `1px solid ${theme.palette.primary.main}30`,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)`
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Entity Embeds
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpCircle size={16} />}
                onClick={() => setOpen(true)}
              >
                Help
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can embed interactive cards for characters, arcs, gambles, and more using the syntax: <code>{'{{type:id}}'}</code> or <code>{'{{type:id|custom_text}}'}</code>
          </Typography>
          
          {/* Debug info */}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Entities loaded: {allEntities.characters.length} characters, {allEntities.arcs.length} arcs, {allEntities.gambles.length} gambles, {allEntities.guides.length} guides
          </Typography>

          {/* Search Section */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Search Entities:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Type to search characters, arcs, gambles, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                endAdornment: searchLoading && <CircularProgress size={20} />
              }}
              sx={{ mb: 1 }}
            />
            
            {searchResults.length > 0 && (
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {searchResults.map((entity) => (
                  <ListItem key={`${entity.type}-${entity.id}`} disablePadding>
                    <ListItemButton onClick={() => handleInsertEntity(entity)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Chip
                          label={entity.type}
                          size="small"
                          sx={{
                            backgroundColor: getEntityColor(entity.type),
                            color: 'white',
                            minWidth: 80
                          }}
                        />
                        <ListItemText
                          primary={entity.name}
                          secondary={entity.subtitle}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
            
            {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No entities found matching "{searchQuery}"
              </Typography>
            )}
          </Paper>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code size={20} />
          Entity Embed Guide
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Entity embeds allow you to create interactive cards that link to characters, arcs, gambles, 
            and other content. They make your guides more engaging and help readers discover related content.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Basic Syntax
          </Typography>
          <Typography variant="body2" paragraph>
            Use double curly braces with the entity type and ID: <code>{'{{character:1}}'}</code>
          </Typography>
          <Typography variant="body2" paragraph>
            You can add custom display text: <code>{'{{character:1|Baku Madarame}}'}</code>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            How to Use
          </Typography>
          <Typography variant="body2" paragraph>
            1. <strong>Search Method:</strong> Type in the search field to find entities by name
          </Typography>
          <Typography variant="body2" paragraph>
            2. <strong>Manual Entry:</strong> Type the embed syntax directly in your markdown
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Available Entity Types
          </Typography>

          {entityTypes.map((entityType) => (
            <Accordion key={entityType.type}>
              <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: entityType.color }}>
                    {entityType.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {entityType.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entityType.description}
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={2}>
                  {entityType.examples.map((example, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {example.code}
                          </Typography>
                          <Tooltip title="Copy to clipboard">
                            <IconButton 
                              size="small"
                              onClick={() => handleInsertEmbed(example.code)}
                            >
                              <Copy size={14} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {example.description}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Tips for Using Entity Embeds
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2" paragraph>
                Use entity embeds to reference key characters, events, or concepts mentioned in your guide
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                Custom display text helps provide context: <code>{'{{character:5|the main antagonist}}'}</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                Entity embeds are interactive and will show up as clickable cards in your published guide
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                You can embed multiple entities in the same paragraph for comprehensive references
              </Typography>
            </li>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EntityEmbedHelperWithSearch
