'use client'

import React, { useState } from 'react'
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
  Divider
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

interface EntityEmbedHelperProps {
  onInsertEmbed?: (embedCode: string) => void
}

const EntityEmbedHelper: React.FC<EntityEmbedHelperProps> = ({ onInsertEmbed }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const entityTypes = [
    {
      type: 'character',
      label: 'Character',
      icon: <User size={16} />,
      color: theme.palette.usogui?.character || theme.palette.primary.main,
      description: 'Link to character profiles',
      examples: [
        { code: '{{character:1}}', description: 'Basic character embed' },
        { code: '{{character:1:Baku Madarame}}', description: 'Character with custom text' }
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
        { code: '{{arc:5:Tower Arc}}', description: 'Arc with custom text' }
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
        { code: '{{gamble:12:Air Poker}}', description: 'Gamble with custom text' }
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
        { code: '{{guide:3:Gambling Rules Guide}}', description: 'Guide with custom text' }
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
        { code: '{{organization:2:Kakerou}}', description: 'Organization with custom text' }
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
        { code: '{{chapter:150:The Final Gamble}}', description: 'Chapter with custom text' }
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
        { code: '{{volume:20:The Conclusion}}', description: 'Volume with custom text' }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (onInsertEmbed) {
      onInsertEmbed(embedCode)
    }
    copyToClipboard(embedCode)
  }

  const exampleContent = `# Example Guide with Entity Embeds

This guide demonstrates how entity embeds work in practice.

## Characters
Meet the main character: {{character:1:Baku Madarame}}

## Story Arcs
This event happens during the {{arc:5:Tower Arc}}.

## Gambles
The most complex gamble was {{gamble:12:Air Poker}}.

## References
For more details, see {{guide:3:Gambling Rules Guide}} and {{chapter:150}}.`

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
            You can embed interactive cards for characters, arcs, gambles, and more using the syntax: <code>{'{{type:id}}'}</code> or <code>{'{{type:id:custom_text}}'}</code>
          </Typography>

          {/* Quick Insert Buttons */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {entityTypes.slice(0, 4).map((entityType) => (
              <Chip
                key={entityType.type}
                label={entityType.label}
                icon={entityType.icon}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: entityType.color,
                  color: entityType.color,
                  '&:hover': {
                    backgroundColor: `${entityType.color}10`
                  }
                }}
                onClick={() => handleInsertEmbed(`{{${entityType.type}:1}}`)}
              />
            ))}
          </Box>
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
            You can add custom display text: <code>{'{{character:1:Baku Madarame}}'}</code>
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
                Custom display text helps provide context: <code>{'{{character:5:the main antagonist}}'}</code>
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

export default EntityEmbedHelper
