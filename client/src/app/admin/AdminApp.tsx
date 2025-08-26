
'use client';

import { Admin, Resource } from 'react-admin';
import { dataProvider } from '@/lib/api/dataProvider';
import authProvider from '@/lib/api/authProvider';
import AdminLogin from './AdminLogin';
import { CharacterList } from './characters/CharacterList';
import { CharacterEdit } from './characters/CharacterEdit';
import { CharacterCreate } from './characters/CharacterCreate';
import { CharacterShow } from './characters/CharacterShow';
import { ArcList } from './arcs/ArcList';
import { ArcEdit } from './arcs/ArcEdit';
import { ArcCreate } from './arcs/ArcCreate';
import { ArcShow } from './arcs/ArcShow';
import { ChapterList } from './chapters/ChapterList';
import { ChapterEdit } from './chapters/ChapterEdit';
import { ChapterCreate } from './chapters/ChapterCreate';
import { ChapterShow } from './chapters/ChapterShow';
import { EventList } from './events/EventList';
import { EventEdit } from './events/EventEdit';
import { EventCreate } from './events/EventCreate';
import { EventShow } from './events/EventShow';
import { FactionList } from './factions/FactionList';
import { FactionEdit } from './factions/FactionEdit';
import { FactionCreate } from './factions/FactionCreate';
import { FactionShow } from './factions/FactionShow';
import { GambleList } from './gambles/GambleList';
import { GambleEdit } from './gambles/GambleEdit';
import { GambleCreate } from './gambles/GambleCreate';
import { GambleShow } from './gambles/GambleShow';
import { GuideList } from './guides/GuideList';
import { GuideEdit } from './guides/GuideEdit';
import { GuideCreate } from './guides/GuideCreate';
import { GuideShow } from './guides/GuideShow';
import { MediaList } from './media/MediaList';
import { MediaEdit } from './media/MediaEdit';
import { MediaCreate } from './media/MediaCreate';
import { MediaShow } from './media/MediaShow';
import { QuoteList } from './quotes/QuoteList';
import { QuoteEdit } from './quotes/QuoteEdit';
import { QuoteCreate } from './quotes/QuoteCreate';
import { QuoteShow } from './quotes/QuoteShow';
import { SeriesList } from './series/SeriesList';
import { SeriesEdit } from './series/SeriesEdit';
import { SeriesCreate } from './series/SeriesCreate';
import { SeriesShow } from './series/SeriesShow';
import { TagList } from './tags/TagList';
import { TagEdit } from './tags/TagEdit';
import { TagCreate } from './tags/TagCreate';
import { TagShow } from './tags/TagShow';
import { UserList } from './users/UserList';
import { UserEdit } from './users/UserEdit';
import { UserCreate } from './users/UserCreate';
import { UserShow } from './users/UserShow';
import { VolumeList } from './volumes/VolumeList';
import { VolumeEdit } from './volumes/VolumeEdit';
import { VolumeCreate } from './volumes/VolumeCreate';
import { VolumeShow } from './volumes/VolumeShow';

const AdminApp = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider} loginPage={AdminLogin}>
    <Resource
      name="characters"
      list={CharacterList}
      edit={CharacterEdit}
      create={CharacterCreate}
      show={CharacterShow}
    />
    <Resource
      name="arcs"
      list={ArcList}
      edit={ArcEdit}
      create={ArcCreate}
      show={ArcShow}
    />
    <Resource
      name="chapters"
      list={ChapterList}
      edit={ChapterEdit}
      create={ChapterCreate}
      show={ChapterShow}
    />
    <Resource
      name="events"
      list={EventList}
      edit={EventEdit}
      create={EventCreate}
      show={EventShow}
    />
    <Resource
      name="factions"
      list={FactionList}
      edit={FactionEdit}
      create={FactionCreate}
      show={FactionShow}
    />
    <Resource
      name="gambles"
      list={GambleList}
      edit={GambleEdit}
      create={GambleCreate}
      show={GambleShow}
    />
    <Resource
      name="guides"
      list={GuideList}
      edit={GuideEdit}
      create={GuideCreate}
      show={GuideShow}
    />
    <Resource
      name="media"
      list={MediaList}
      edit={MediaEdit}
      create={MediaCreate}
      show={MediaShow}
    />
    <Resource
      name="quotes"
      list={QuoteList}
      edit={QuoteEdit}
      create={QuoteCreate}
      show={QuoteShow}
    />
    <Resource
      name="series"
      list={SeriesList}
      edit={SeriesEdit}
      create={SeriesCreate}
      show={SeriesShow}
    />
    <Resource
      name="tags"
      list={TagList}
      edit={TagEdit}
      create={TagCreate}
      show={TagShow}
    />
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      show={UserShow}
    />
    <Resource
      name="volumes"
      list={VolumeList}
      edit={VolumeEdit}
      create={VolumeCreate}
      show={VolumeShow}
    />
  </Admin>
);

export default AdminApp;
