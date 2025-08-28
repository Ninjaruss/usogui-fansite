"use client";

import { Admin, Resource } from 'react-admin';
import { customDataProvider } from '@/lib/api/customDataProvider';
import { authProvider } from '@/lib/api/authProvider';

// Import resource components
import { SeriesList, SeriesEdit, SeriesCreate } from '@/components/admin/Series';
import { VolumeList, VolumeEdit, VolumeCreate } from '@/components/admin/Volume';
import { ChapterList, ChapterEdit, ChapterCreate } from '@/components/admin/Chapter';
import { ArcList, ArcEdit, ArcCreate } from '@/components/admin/Arc';
import { CharacterList, CharacterEdit, CharacterCreate } from '@/components/admin/Character';
import { FactionList, FactionEdit, FactionCreate } from '@/components/admin/Faction';
import { EventList, EventEdit, EventCreate } from '@/components/admin/Event';
import { TagList, TagEdit, TagCreate } from '@/components/admin/Tag';
import { QuoteList, QuoteEdit, QuoteCreate } from '@/components/admin/Quote';
import { GuideList, GuideEdit, GuideCreate } from '@/components/admin/Guide';
import { MediaList, MediaEdit, MediaCreate } from '@/components/admin/Media';
import { GambleList, GambleEdit, GambleCreate } from '@/components/admin/Gamble';
import { UserList, UserEdit, UserCreate } from '@/components/admin/User';

export default function AdminApp() {
  return (
    <Admin
      dataProvider={customDataProvider}
      authProvider={authProvider}
      requireAuth
    >
      {/* Series Management */}
      <Resource
        name="series"
        list={SeriesList}
        edit={SeriesEdit}
        create={SeriesCreate}
      />

      {/* Volume Management */}
      <Resource
        name="volumes"
        list={VolumeList}
        edit={VolumeEdit}
        create={VolumeCreate}
      />

      {/* Chapter Management */}
      <Resource
        name="chapters"
        list={ChapterList}
        edit={ChapterEdit}
        create={ChapterCreate}
      />

      {/* Arc Management */}
      <Resource
        name="arcs"
        list={ArcList}
        edit={ArcEdit}
        create={ArcCreate}
      />

      {/* Character Management */}
      <Resource
        name="characters"
        list={CharacterList}
        edit={CharacterEdit}
        create={CharacterCreate}
      />

      {/* Faction Management */}
      <Resource
        name="factions"
        list={FactionList}
        edit={FactionEdit}
        create={FactionCreate}
      />

      {/* Event Management */}
      <Resource
        name="events"
        list={EventList}
        edit={EventEdit}
        create={EventCreate}
      />

      {/* Tag Management */}
      <Resource
        name="tags"
        list={TagList}
        edit={TagEdit}
        create={TagCreate}
      />

      {/* Quote Management */}
      <Resource
        name="quotes"
        list={QuoteList}
        edit={QuoteEdit}
        create={QuoteCreate}
      />

      {/* Guide Management */}
      <Resource
        name="guides"
        list={GuideList}
        edit={GuideEdit}
        create={GuideCreate}
      />

      {/* Media Management */}
      <Resource
        name="media"
        list={MediaList}
        edit={MediaEdit}
        create={MediaCreate}
      />

      {/* Gamble Management */}
      <Resource
        name="gambles"
        list={GambleList}
        edit={GambleEdit}
        create={GambleCreate}
      />

      {/* User Management - Only for admins */}
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        create={UserCreate}
      />
    </Admin>
  );
}
