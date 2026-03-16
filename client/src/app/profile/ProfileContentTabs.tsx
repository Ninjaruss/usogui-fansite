'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Box, Text, Group, Stack, Tabs, Badge, Button,
  TextInput, SegmentedControl, ActionIcon, Alert, Menu,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  FileText, FileImage, Calendar, MessageSquare,
  Search, X, Plus,
} from 'lucide-react'
import Link from 'next/link'
import SubmissionCard from '../../components/SubmissionCard'
import type { SubmissionItem } from '../../components/SubmissionCard'
import { GuideStatus } from '../../types'

interface UserGuide {
  id: number
  title: string
  description?: string
  status: GuideStatus
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

type ContentTab = 'guides' | 'media' | 'events' | 'annotations'

interface ProfileContentTabsProps {
  userGuides: UserGuide[]
  submissions: any[]
  onDeleteGuide: (id: number) => Promise<void>
  onDeleteMedia: (id: string) => Promise<void>
  onDeleteEvent: (id: number) => Promise<void>
  onDeleteAnnotation: (id: number) => Promise<void>
}

const TAB_CONFIG = [
  { value: 'guides' as ContentTab,      label: 'Guides',      icon: FileText,      entityKey: 'guide',      submissionType: 'guide',      defaultVisible: 6 },
  { value: 'media' as ContentTab,       label: 'Media',       icon: FileImage,     entityKey: 'media',      submissionType: 'media',      defaultVisible: 10 },
  { value: 'events' as ContentTab,      label: 'Events',      icon: Calendar,      entityKey: 'event',      submissionType: 'event',      defaultVisible: 10 },
  { value: 'annotations' as ContentTab, label: 'Annotations', icon: MessageSquare, entityKey: 'annotation', submissionType: 'annotation',  defaultVisible: 10 },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function ProfileContentTabs({
  userGuides,
  submissions,
  onDeleteGuide,
  onDeleteMedia,
  onDeleteEvent,
  onDeleteAnnotation,
}: ProfileContentTabsProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('guides')
  const [filters, setFilters] = useState<Record<ContentTab, { status: string; search: string; visible: number }>>({
    guides:      { status: 'all', search: '', visible: 6 },
    media:       { status: 'all', search: '', visible: 10 },
    events:      { status: 'all', search: '', visible: 10 },
    annotations: { status: 'all', search: '', visible: 10 },
  })
  const [debouncedSearch] = useDebouncedValue(filters[activeTab].search, 300)

  const updateFilter = useCallback((tab: ContentTab, key: 'status' | 'search' | 'visible', value: string | number) => {
    setFilters(prev => ({ ...prev, [tab]: { ...prev[tab], [key]: value } }))
  }, [])

  const handleStatusChange = useCallback((tab: ContentTab, status: string) => {
    const config = TAB_CONFIG.find(t => t.value === tab)
    setFilters(prev => ({ ...prev, [tab]: { ...prev[tab], status, visible: config?.defaultVisible ?? 10 } }))
  }, [])

  const getItems = useCallback((tab: ContentTab) => {
    if (tab === 'guides') return userGuides
    const config = TAB_CONFIG.find(t => t.value === tab)!
    return submissions.filter(s => s.type === config.submissionType)
  }, [userGuides, submissions])

  const getFiltered = useCallback((tab: ContentTab) => {
    const { status, visible } = filters[tab]
    const search = debouncedSearch.toLowerCase()
    let items = getItems(tab)
    if (status !== 'all') items = items.filter(item => item.status === status)
    if (search) items = items.filter(item =>
      item.title?.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search)
    )
    return { filtered: items, visible: items.slice(0, visible), hasMore: items.length > visible, remaining: items.length - visible }
  }, [filters, debouncedSearch, getItems])

  const counts = useMemo(() => TAB_CONFIG.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'guides'
      ? userGuides.length
      : submissions.filter(s => s.type === tab.submissionType).length
    return acc
  }, {} as Record<ContentTab, number>), [userGuides, submissions])

  const deleteHandlers: Record<ContentTab, (id: any) => Promise<void>> = {
    guides:      (id) => onDeleteGuide(id),
    media:       (id) => onDeleteMedia(id),
    events:      (id) => onDeleteEvent(id),
    annotations: (id) => onDeleteAnnotation(id),
  }

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      {/* Header */}
      <Group justify="space-between" align="center" mb={10}>
        <Group gap={6} align="baseline">
          <Text style={{ fontSize: '13px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>My Content</Text>
          <Text style={{ fontSize: '9px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· case files</Text>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button
              size="xs"
              variant="outline"
              leftSection={<Plus size={12} />}
              style={{ borderColor: 'rgba(225,29,72,0.3)', color: '#e11d48', fontSize: '9px', padding: '2px 8px', height: 'auto' }}
            >
              new
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} href="/submit-guide" leftSection={<FileText size={14} />}>New Guide</Menu.Item>
            <Menu.Item component={Link} href="/submit-media" leftSection={<FileImage size={14} />}>New Media</Menu.Item>
            <Menu.Item component={Link} href="/submit-event" leftSection={<Calendar size={14} />}>New Event</Menu.Item>
            <Menu.Item component={Link} href="/submit-annotation" leftSection={<MessageSquare size={14} />}>New Annotation</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(v) => v && setActiveTab(v as ContentTab)}
        variant="outline"
        keepMounted={false}
        color="#e11d48"
      >
        <Tabs.List style={{ borderBottom: '1px solid #1a1a1a', marginBottom: '10px' }}>
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon
            const count = counts[tab.value]
            return (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                leftSection={<Icon size={14} />}
                rightSection={count > 0 ? (
                  <Badge size="xs" circle style={{ background: 'rgba(225,29,72,0.12)', color: '#3a1a1a', border: '1px solid rgba(225,29,72,0.2)', fontSize: '7px' }}>
                    {count}
                  </Badge>
                ) : null}
                style={{ fontSize: '9px', color: activeTab === tab.value ? '#e11d48' : '#444' }}
              >
                {tab.label}
              </Tabs.Tab>
            )
          })}
        </Tabs.List>

        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon
          const { filtered, visible, hasMore, remaining } = getFiltered(tab.value)
          const total = getItems(tab.value).length
          const config = TAB_CONFIG.find(t => t.value === tab.value)!

          return (
            <Tabs.Panel key={tab.value} value={tab.value}>
              <Stack gap="md">
                {/* Filter bar */}
                <Group gap="sm" wrap="wrap" p="xs" style={{ background: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <TextInput
                    placeholder={`Search ${tab.label.toLowerCase()}...`}
                    leftSection={<Search size={14} />}
                    value={filters[tab.value].search}
                    onChange={(e) => updateFilter(tab.value, 'search', e.target.value)}
                    rightSection={filters[tab.value].search ? (
                      <ActionIcon size="sm" variant="subtle" onClick={() => updateFilter(tab.value, 'search', '')}>
                        <X size={12} />
                      </ActionIcon>
                    ) : null}
                    radius="md"
                    size="xs"
                    style={{ flex: '1 1 160px', minWidth: '120px' }}
                  />
                  <SegmentedControl
                    size="xs"
                    radius="md"
                    value={filters[tab.value].status}
                    onChange={(v) => handleStatusChange(tab.value, v)}
                    data={STATUS_OPTIONS}
                  />
                </Group>

                {/* Content */}
                {total === 0 ? (
                  <Alert icon={<Icon size={14} />} title={`No ${tab.label.toLowerCase()} yet`} variant="light">
                    No {tab.label.toLowerCase()} submitted yet.
                  </Alert>
                ) : filtered.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="md">No {tab.label.toLowerCase()} match your filter.</Text>
                ) : (
                  <>
                    <Stack gap="xs">
                      {visible.map((item: any) => (
                        <SubmissionCard
                          key={`${tab.value}-${item.id}`}
                          submission={tab.value === 'guides' ? {
                            id: item.id,
                            type: 'guide',
                            title: item.title,
                            description: item.description,
                            status: item.status,
                            rejectionReason: item.rejectionReason,
                            createdAt: item.createdAt,
                          } as SubmissionItem : item as SubmissionItem}
                          isOwnerView
                          onDelete={async (id) => {
                            try {
                              await deleteHandlers[tab.value](id)
                            } catch {
                              notifications.show({ title: 'Error', message: `Failed to delete ${tab.label.toLowerCase().slice(0, -1)}.`, color: 'red' })
                            }
                          }}
                        />
                      ))}
                    </Stack>
                    {hasMore && (
                      <Button
                        variant="subtle"
                        fullWidth
                        size="xs"
                        onClick={() => updateFilter(tab.value, 'visible', filters[tab.value].visible + config.defaultVisible)}
                      >
                        Show more ({remaining} remaining)
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            </Tabs.Panel>
          )
        })}
      </Tabs>
    </Box>
  )
}
