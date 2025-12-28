'use client'

import React from 'react'
import { Admin, Resource } from 'react-admin'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../lib/theme'
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
import { MediaList, MediaEdit, MediaShow, MediaCreate } from '../../components/admin/Media'
import { UserList, UserEdit, UserShow } from '../../components/admin/Users'
import { QuoteList, QuoteEdit, QuoteCreate, QuoteShow } from '../../components/admin/Quotes'
import { TagList, TagEdit, TagCreate } from '../../components/admin/Tags'
import { OrganizationList, OrganizationEdit, OrganizationCreate } from '../../components/admin/Organizations'
import { BadgeList, BadgeEdit, BadgeCreate, BadgeShow } from '../../components/admin/Badges'
import { CharacterRelationshipList, CharacterRelationshipEdit, CharacterRelationshipCreate, CharacterRelationshipShow } from '../../components/admin/CharacterRelationships'
import { CharacterOrganizationList, CharacterOrganizationEdit, CharacterOrganizationCreate, CharacterOrganizationShow } from '../../components/admin/CharacterOrganizations'

// Icons
import { Users, User, BookOpen, Crown, Zap, FileText, Image, Quote, Tag, Shield, Award, Link2, Building2 } from 'lucide-react'

// Convert icons to components
const UsersIcon = () => <Users />
const UserIcon = () => <User />
const BookOpenIcon = () => <BookOpen />
const CrownIcon = () => <Crown />
const ZapIcon = () => <Zap />
const FileTextIcon = () => <FileText />
const ImageIcon = () => <Image />
const QuoteIcon = () => <Quote />
const TagIcon = () => <Tag />
const ShieldIcon = () => <Shield />
const AwardIcon = () => <Award />
const Link2Icon = () => <Link2 />
const Building2Icon = () => <Building2 />

export default function AdminApp() {
  return (
    <ThemeProvider theme={theme}>
      <Admin
        dataProvider={AdminDataProvider}
        authProvider={AdminAuthProvider}
        layout={AdminLayout}
        dashboard={Dashboard}
        theme={theme}
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
        icon={UserIcon}
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
        name="organizations"
        list={OrganizationList}
        edit={OrganizationEdit}
        create={OrganizationCreate}
        icon={ShieldIcon}
      />
      <Resource
        name="badges"
        list={BadgeList}
        edit={BadgeEdit}
        create={BadgeCreate}
        show={BadgeShow}
        icon={AwardIcon}
      />
      <Resource
        name="character-relationships"
        list={CharacterRelationshipList}
        edit={CharacterRelationshipEdit}
        create={CharacterRelationshipCreate}
        show={CharacterRelationshipShow}
        icon={Link2Icon}
        options={{ label: 'Relationships' }}
      />
      <Resource
        name="character-organizations"
        list={CharacterOrganizationList}
        edit={CharacterOrganizationEdit}
        create={CharacterOrganizationCreate}
        show={CharacterOrganizationShow}
        icon={Building2Icon}
        options={{ label: 'Org Memberships' }}
      />
    </Admin>
    </ThemeProvider>
  )
}