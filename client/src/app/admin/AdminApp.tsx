'use client'

import React from 'react'
import { Admin, Resource } from 'react-admin'
import { AdminDataProvider } from '../../components/admin/AdminDataProvider'
import { AdminAuthProvider } from '../../components/admin/AdminAuthProvider'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { Dashboard } from '../../components/admin/Dashboard'

// Resource components
import { CharacterList, CharacterEdit, CharacterCreate, CharacterShow } from '../../components/admin/Characters'
import { ArcList, ArcEdit, ArcCreate, ArcShow } from '../../components/admin/Arcs'
import { GambleList, GambleEdit, GambleCreate, GambleShow } from '../../components/admin/Gambles'
import { EventList, EventEdit, EventCreate, EventShow } from '../../components/admin/Events'
import { GuideList, GuideEdit, GuideCreate, GuideShow } from '../../components/admin/Guides'
import { MediaList, MediaEdit, MediaShow, MediaCreate, MediaApprovalQueue } from '../../components/admin/Media'
import { UserList, UserEdit, UserShow } from '../../components/admin/Users'
import { QuoteList, QuoteEdit, QuoteCreate, QuoteShow } from '../../components/admin/Quotes'
import { TagList, TagEdit, TagCreate } from '../../components/admin/Tags'
import { FactionList, FactionEdit, FactionCreate } from '../../components/admin/Factions'

// Icons
import { Users, BookOpen, Crown, Zap, FileText, Image, Quote, Tag, Book, Shield } from 'lucide-react'

// Convert icons to components
const UsersIcon = () => <Users />
const BookOpenIcon = () => <BookOpen />
const CrownIcon = () => <Crown />
const ZapIcon = () => <Zap />
const FileTextIcon = () => <FileText />
const ImageIcon = () => <Image />
const QuoteIcon = () => <Quote />
const TagIcon = () => <Tag />
const BookIcon = () => <Book />
const ShieldIcon = () => <Shield />

export default function AdminApp() {
  return (
    <Admin
      dataProvider={AdminDataProvider}
      authProvider={AdminAuthProvider}
      layout={AdminLayout}
      dashboard={Dashboard}
    >
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        show={UserShow}
        icon={UsersIcon}
      />
      <Resource
        name="characters"
        list={CharacterList}
        edit={CharacterEdit}
        create={CharacterCreate}
        show={CharacterShow}
        icon={UsersIcon}
      />
      <Resource
        name="arcs"
        list={ArcList}
        edit={ArcEdit}
        create={ArcCreate}
        show={ArcShow}
        icon={BookOpenIcon}
      />
      <Resource
        name="gambles"
        list={GambleList}
        edit={GambleEdit}
        create={GambleCreate}
        show={GambleShow}
        icon={CrownIcon}
      />
      <Resource
        name="events"
        list={EventList}
        edit={EventEdit}
        create={EventCreate}
        show={EventShow}
        icon={ZapIcon}
      />
      <Resource
        name="guides"
        list={GuideList}
        edit={GuideEdit}
        create={GuideCreate}
        show={GuideShow}
        icon={FileTextIcon}
      />
      <Resource
        name="media"
        list={MediaList}
        edit={MediaEdit}
        create={MediaCreate}
        show={MediaShow}
        icon={ImageIcon}
      />
      <Resource
        name="media-approval"
        list={MediaApprovalQueue}
        options={{ label: 'Media Approval Queue' }}
        icon={ImageIcon}
      />
      <Resource
        name="quotes"
        list={QuoteList}
        edit={QuoteEdit}
        create={QuoteCreate}
        show={QuoteShow}
        icon={QuoteIcon}
      />
      <Resource
        name="tags"
        list={TagList}
        edit={TagEdit}
        create={TagCreate}
        icon={TagIcon}
      />
      <Resource
        name="factions"
        list={FactionList}
        edit={FactionEdit}
        create={FactionCreate}
        icon={ShieldIcon}
      />
    </Admin>
  )
}