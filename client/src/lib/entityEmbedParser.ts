import React from 'react'
import type { MantineTheme } from '@mantine/core'
import { api } from '../lib/api'

export interface EntityEmbedData {
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  id: number
  data?: any
}

/**
 * Parse markdown content and extract entity embed syntax
 * Syntax: {{type:id}} or {{type:id:display_text}}
 * Examples:
 * - {{character:1}}
 * - {{arc:5:Tower Arc}}
 * - {{gamble:12:Air Poker}}
 * - {{guide:3}}
 * - {{organization:2:Kakerou}}
 * - {{chapter:150}}
 * - {{volume:20}}
 * - {{quote:45}}
 */
export function parseEntityEmbeds(content: string): {
  content: string
  embeds: Array<{
    id: string
    type: EntityEmbedData['type']
    entityId: number
    displayText?: string
    placeholder: string
  }>
} {
  const embeds: Array<{
    id: string
    type: EntityEmbedData['type']
    entityId: number
    displayText?: string
    placeholder: string
  }> = []

  // Regex to match {{type:id}} or {{type:id:display_text}}
  const embedRegex = /\{\{(character|arc|gamble|guide|organization|chapter|volume|quote):(\d+)(?::([^}]+))?\}\}/g
  
  let match
  let counter = 0
  
  const processedContent = content.replace(embedRegex, (fullMatch, type, id, displayText) => {
    const entityId = parseInt(id, 10)
    if (isNaN(entityId)) {
      return fullMatch // Return original if ID is not a valid number
    }

    const embedId = `entity-embed-${counter++}`
    const placeholder = `ENTITY_EMBED_${embedId}`
    
    embeds.push({
      id: embedId,
      type: type as EntityEmbedData['type'],
      entityId,
      displayText: displayText?.trim(),
      placeholder
    })
    
    return placeholder
  })

  return {
    content: processedContent,
    embeds
  }
}

/**
 * Fetch entity data for an embed
 */
export async function fetchEntityData(type: EntityEmbedData['type'], id: number): Promise<any> {
  try {
    switch (type) {
      case 'character':
        return await api.getCharacter(id)
      case 'arc':
        return await api.getArc(id)
      case 'gamble':
        return await api.getGamble(id)
      case 'guide':
        return await api.getGuide(id)
      case 'organization':
        return await api.getOrganization(id)
      case 'chapter':
        return await api.getChapter(id)
      case 'volume':
        return await api.getVolume(id)
      case 'quote':
        return await api.getQuote(id)
      default:
        throw new Error(`Unsupported entity type: ${type}`)
    }
  } catch (error) {
    console.error(`Failed to fetch ${type} with ID ${id}:`, error)
    return null
  }
}

/**
 * Convert entity type to readable label
 */
export function getEntityTypeLabel(type: EntityEmbedData['type']): string {
  const labels = {
    character: 'Character',
    arc: 'Arc',
    gamble: 'Gamble',
    guide: 'Guide',
    organization: 'Organization',
    chapter: 'Chapter',
    volume: 'Volume',
    quote: 'Quote'
  }
  return labels[type] || type
}

/**
 * Get default display text for an entity
 */
export function getDefaultDisplayText(type: EntityEmbedData['type'], data: any): string {
  if (!data) return `${getEntityTypeLabel(type)} (Not Found)`
  
  switch (type) {
    case 'character':
      return data.name || `Character #${data.id}`
    case 'arc':
      return data.name || `Arc #${data.id}`
    case 'gamble':
      return data.name || `Gamble #${data.id}`
    case 'guide':
      return data.title || `Guide #${data.id}`
    case 'organization':
      return data.name || `Organization #${data.id}`
    case 'chapter':
      return `Chapter ${data.number || data.id}`
    case 'volume':
      return `Volume ${data.number || data.id}`
    case 'quote':
      return data.text ? `"${data.text.substring(0, 50)}..."` : `Quote #${data.id}`
    default:
      return `${getEntityTypeLabel(type)} #${data.id}`
  }
}

/**
 * Generate entity URL path
 */
export function getEntityUrl(type: EntityEmbedData['type'], id: number): string {
  const paths = {
    character: `/characters/${id}`,
    arc: `/arcs/${id}`,
    gamble: `/gambles/${id}`,
    guide: `/guides/${id}`,
    organization: `/organizations/${id}`,
    chapter: `/chapters/${id}`,
    volume: `/volumes/${id}`,
    quote: `/quotes/${id}`
  }
  return paths[type] || '#'
}

/**
 * Get theme color for entity type
 */
export function getEntityThemeColor(_theme: MantineTheme, type: EntityEmbedData['type']): string {
  const colors = {
    character: 'usogui.character',
    arc: 'usogui.arc',
    gamble: 'usogui.gamble',
    guide: 'usogui.guide',
    organization: 'usogui.organization',
    chapter: 'primary.main',
    volume: 'secondary.main',
    quote: 'text.secondary'
  }
  return colors[type] || 'primary.main'
}
