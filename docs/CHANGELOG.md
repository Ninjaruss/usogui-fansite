# Changelog and notes

## TODO
# Refine entity embed for guide markdown

## 2026-02-20
- Fluxer login option added with updates to the frontend to reflect this change (replacing Discord)
- Profile page now allows user to link or unlink their Fluxer

## 2026-02-10
- Entity display media management for admin dashboard
- Media preview fixed for admin dashboard

## 2026-02-09
- Gamble factions to indicate supporters for each gambler or outside entities within the gamble
- Auto detection for media type during submission
- Pagination updated to check for url

## 2026-02-08
- Media default view updated to show general (excluding volumes)
- Backstory field fix
- Tags reduced to 3
- Events form design updated to show relevant linked events for easier check for existing events
- Clean up of admin dashboard edit/show pages and any missing api for annotations

## 2026-02-07
- Media gallery image display update
- Users should now be able to edit their media and replace files
- Admin dashboard media page now filters out volumes for general filter
- Character backstory should now refresh properly
- Granular seeder skip config added

## 2026-02-04
### Backblaze B2 Upload Retry Logic
**Fixed 503 "service_unavailable" errors with automatic retry mechanism:**
- **Retry Logic**: Implemented exponential backoff with up to 3 retry attempts for failed uploads
- **Fresh Upload URLs**: Get a new upload URL on each retry attempt to handle expired tokens
- **Retryable Errors**: Automatically retry on 503, 500, 408 status codes and network errors
- **Better Error Logging**: Enhanced error messages with structured JSON logging for debugging
- **Backoff Strategy**: Exponential backoff (1s, 2s, 4s) between retry attempts to avoid overwhelming B2 servers

### Database Performance & Migration Safety Optimization
**Major performance improvements to prevent crashes and speed up operations 10-50x:**

#### Seeder Performance (10-50x Faster)
- **Batch Operations**: Converted all seeders from individual saves to bulk batch operations
  - Reduced database queries from ~1000+ to ~20-30 per seeder
  - All seeders (Characters, Organizations, Gambles, Quotes, Arcs, Tags, Volumes, Events, Chapters, CharacterOrganizations, FandomData) now use batch inserts
- **Optimized Existence Checks**: Single query to check all existing records instead of individual `findOne()` loops
- **Memory Usage**: Reduced by 70-80% through efficient connection pooling
- **Seeding Configuration** in `seed.ts`:
  - Disabled query logging during seeding for better I/O performance
  - Increased connection pool to 20 for parallel operations
  - Added 5-minute statement timeout for long-running operations

#### Database Indexes Added for Faster Queries
- Added index on `organization.name` for faster lookups
- Added unique index on `volume.number` for data integrity and faster queries
- Added unique index on `chapter.number` for data integrity and faster queries
- Added index on `gamble.name` for faster searches
- *Note: Run `yarn db:generate add-seeder-indexes` and `yarn db:migrate` to apply*

#### Migration Safety & Performance Improvements
**New Commands for Safe Migrations:**
- `yarn db:migrate:dry-run` - Preview what SQL will run without executing
- `yarn db:migrate:check` - Check for pending migrations
- `yarn db:status` - Show complete migration history

**Enhanced Migration Helper Script:**
- Pre-migration database connection validation
- Automatic pending migration detection
- Improved error handling with troubleshooting tips
- Safe backup prompts before any destructive operations
- Optimized PostgreSQL settings for faster migration execution

**TypeORM Configuration Optimization:**
- Disabled query logging during migrations for better performance
- Optimized connection pool settings (max: 10, statement_timeout: 5 min)
- Configurable timeout via `PGSTATEMENT_TIMEOUT` environment variable

#### Developer Experience
- **New Documentation**: Comprehensive [Migration Guide](../server/docs/MIGRATION_GUIDE.md) covering:
  - Safe migration workflow with checklist
  - Best practices for adding new data
  - Performance optimization guidelines for large datasets
  - Batch operation examples
  - Troubleshooting common issues (timeouts, crashes, failures)
  - Emergency rollback procedures

- **Base Seeder Utilities** in `base.seeder.ts`:
  - `batchUpsert()` - Efficient bulk upserts with `ON CONFLICT` handling
  - `batchInsert()` - Fast batch insertions for new records
  - `getExistingByField()` - Single-query lookups by any field

#### Bugs Fixed
- Fixed VS Code crashes during database seeding due to excessive memory usage from N+1 query patterns
- Fixed migration timeout issues with large datasets by adding statement timeouts
- Corrected TypeScript strict mode compliance in `fandom-data.seeder.ts` for nullable fields

## 2026-02-03
- backstory field for characters and explanation field for gambles

## 2026-02-01
### Admin Dashboard UX Improvements
- **Created shared `usePendingCounts` hook**: Centralized pending count fetching for guides, media, events, and annotations with auto-refresh every 30s
- **Enhanced AppBar pending counter**: Now tracks all 4 moderatable resources (guides, media, events, annotations) with dropdown menu showing per-resource breakdown
- **Dashboard stat cards**: Added pending count badges to Community Guides, Media Submissions, and Events cards
- **Quick actions with live counts**: All moderation quick actions now show live pending counts (e.g., "Review pending guides (5)") and dim when count is 0
- **Smart default filters**: Guides, Media, Events, and Annotations list views now default to `status: pending` filter for faster moderation workflow
- **Sidebar pending badges**: Guides, Media, and Annotations menu items show live pending count badges
- **Role-adaptive dashboard layouts**:
  - Moderators/Editors: Moderation Queue panel appears first with Content Creation shortcuts
  - Admins: Quick Actions panel with System Overview showing total users and total pending items
- **Role-based menu filtering**: User Management section now hidden for non-admins
- **Fixed build error**: Removed duplicate cleanup effect in QuotesPageContent.tsx (useHoverModal already handles cleanup)

## 2026-01-31
- Users list cache refreshes when changes are made to a user's profile (improved with react-query predicate-based invalidation)
- Showcase now rotates properly
- Editor role added
- Tag system validation to enforce 5 tags max per guide
- Guide submission form now includes TagsInput component with max 5 tags limit
- Volume showcase sizing significantly reduced to prevent overlap with search bar (overflow: clip)
- Media gallery preview system improved to properly display YouTube thumbnails, uploaded images, and external direct image URLs
- React-query cache invalidation improved with predicate-based queries for all user-related data
- Fixed React hydration error #300 on home page by making showcase selection client-side only

## 2026-01-30
- Site deployed on Flyio, Supabase, and Vercel! Some adjustments to secret keys (.env) and CORS stuff was needed before everything connected
- Removal of external URL submissions except for videos/music
- Media upload more streamlined to include additional data and better security practices
- User submissions system added to track all submitted content; ui shown on public user page and profile page
- Skipping for some seeders for production
- Fixed counters on the home page to reflect approved content
- Auth state sync on logout fixed
- Parallel queries support to avoid rate limiting for normal users
- Adjusted media form to have entity display as an option
- Event filtering by character relationship instead of by text title
- Media linking info added for contributions
- Added volume 2 popout
- Moderators can now access dashboard properly without getting kicked out
- Users list should now update properly

## 2026-01-29
### Annotation System Refactor
- **Removed CHAPTER from AnnotationOwnerType**: Annotations can no longer be directly owned by chapters
- **Chapter Annotations via Reference**: Annotations now appear on chapters based on the `chapterReference` field
  - This allows annotations (for characters, gambles, arcs, etc.) to appear on specific chapters contextually
  - Backend: New `findApprovedByChapterReference` service method
  - Frontend: Updated `AnnotationSection` component to support `chapterReference` prop
- **Updated Seeder**: Converted existing chapter-type annotations to arc-type with chapter references
- **Validation**: Removed chapter validation from `validateOwnerExists` method
- **Admin UI**: Removed chapter option from annotation forms and filters

**Breaking Change**: Existing chapter-type annotations in production databases will need migration to arc/character/gamble types

## 2026-01-27
- Added annotations and contribution tracking (may not be complete due to previously losing untracked edits)
- Added sections for admin dashboard sidebar

## 2026-01-20
### Code Cleanup & ESLint Fixes
- **ESLint Configuration**: Updated `eslint.config.mjs` to exclude dev tools from linting
  - Excluded `database/tools/` and `reset-db.ts` (one-time scripts)
  - Downgraded strict type-checking rules to warnings for raw SQL queries
  - Added underscore-prefix pattern for intentionally unused variables
- **Fixed Switch Case Declarations**: Wrapped switch cases in braces in `search.service.ts`
- **Fixed Async/Await Issues**: Removed unnecessary `async` from methods without awaits
  - `gambles.service.ts` - findByTeam
  - `media.service.ts` - migrateToPolymorphic
  - `media-url-resolver.service.ts` - resolvePixivUrl
- **Fixed TypeScript Imports**: Changed to `import type` for Express types in auth controllers
- **Removed Unused Imports**: Cleaned up unused imports across entities and controllers
- **Client Debug Logging**: Gated API debug console.logs behind `NODE_ENV=development` in `api.ts`
- **Regex Fix**: Removed unnecessary escape characters in `create-media.dto.ts`


## 2026-01-17
### Security Audit & Hardening
Comprehensive security review addressing 17 issues across authentication, data integrity, and reliability.

**Critical Security (2 issues)**
- ✅ Removed client-side dev secret exposure
- ✅ Added timing-safe comparison for secrets (prevents timing attacks)

**High Security (4 issues)**
- ✅ Refresh token expiration implemented (30 days)
- ✅ Removed cascading tag deletes
- ✅ Added token refresh lock (race condition fix)
- ✅ CSRF guard development bypass safeguarded

**Medium Security (3 issues)**
- ✅ Test user backdoor production guarded (triple-check: NODE_ENV + ENABLE_TEST_USER + email match)
- ✅ Sensitive logging gated behind NODE_ENV
- ✅ JWT invalidation limitation documented

**Data Integrity (3 issues)**
- ✅ Media entity onDelete constraint added (SET NULL)
- ✅ N+1 query fixed (batch tag insert in guides)
- ✅ B2 upload error handling added

**Reliability (3 issues)**
- ✅ Silent API failures now throw errors
- ✅ Request timeouts added (30s)
- ✅ Error boundaries for key pages (characters, guides)

**Configuration (2 issues)**
- ✅ Environment validation for B2/Discord credentials
- ✅ Schema sync default changed to false (prevents accidental data loss)

### Features
- Added sub arcs hierarchy

## 2026-01-16
- Updated seeder data to have more accurate initial data (though tons of placeholder text exists)
- Favorite quote/gamble selection color updated

## 2026-01-15
- Docker and Supabase setup complete

## 2026-01-04
- Added bulk actions for guides/media
- Fixed pending approval button to navigate to higher priority pending items (by count)

## 2026-01-02
### Admin & Moderator Workflow Improvements
- **Role Elevation Protection**: Added confirmation dialog when promoting users to admin role
  - Shows explicit warning about admin privileges before confirmation
  - Moderators can no longer see admin role option in dropdown (backend already enforced)
- **Guide Rejection Validation**: Added real-time validation requiring rejection reason when status is set to "Rejected"
  - Visual warning box highlights missing reason
  - Form validation prevents saving without reason
- **Bulk Actions for Guides**: Added bulk approve/reject buttons to Guide list view
  - Multi-select guides and approve/reject in batch
  - Bulk rejection requires shared reason for all selected guides
- **Bulk Actions for Media**: Added bulk approve/reject buttons to Media list and approval queue
  - Multi-select media items and approve/reject in batch
  - Bulk rejection requires shared reason for all selected items
- **Bulk Actions for Events**: Added bulk approve/reject buttons to Events list view
  - Multi-select events and approve/reject pending items in batch
  - Only processes events with pending status

### Admin Dashboard UX Improvements
- **Clickable Dashboard Navigation**: All stat cards and quick actions now navigate to respective pages
  - Stat cards link directly to resource list views
  - Quick actions link to filtered lists (e.g., pending items) or create forms
  - Hover effects indicate clickability with smooth animations
- **Badges Admin Standardization**: Updated Badges component to match styling of other admin resources
  - Added EditToolbar with delete confirmation dialog to BadgeEdit
  - Standardized card layouts, gradient headers, and color theming (amber #f59e0b)
  - Enhanced BadgeShow, BadgeCreate, and BadgeEdit with consistent admin UI patterns

### Code Quality
- **Removed Debug Statements**: Cleaned up 30+ console.log/console.warn statements from AdminDataProvider.ts
  - Kept console.error in catch blocks for production error logging
  - Reduces console noise during development and production

## 2025-12-31
- Added CSS-based card hover effects to globals.css (`.hoverable-card`, `.hoverable-card-*` entity variants)
- Replaced inline `onMouseEnter`/`onMouseLeave` style manipulation with CSS classes across all listing pages:
  - CharactersPageContent, ArcsPageContent, GamblesPageContent, EventsPageContent, QuotesPageContent, GuidesPageContent
- Added focus trap to mobile navigation menu using `useFocusTrap` from @mantine/hooks
- Added body scroll lock when mobile menu is open
- Added Escape key handler to close mobile menu
- Implemented URL hash sync for tab state on detail pages (CharacterPageClient, GamblePageClient)
  - Tabs now persist in URL (e.g., `/characters/1#timeline`) and support back/forward navigation
- Fixed search bar clearing to properly reset filters and URL state
  - Updated `updateURL` function to handle organization filter parameter
  - Added URL sync effect to sync component state with URL params on back/forward navigation
  - Fixed `handleClearSearch` to properly clear all filters from URL
- Added loading state and accessibility improvements to Discord OAuth login button
  - Shows loading spinner during redirect
  - Added `aria-busy` and dynamic `aria-label` for screen readers
  - Button text changes to "Redirecting to Discord..." during redirect
- Improved DeviantArt expired token handling in MediaThumbnail
  - Added "View on DeviantArt" link when images are unavailable due to expired CDN tokens

## 2025-12-30
- Fixed hover styles in GamblePageClient
- Fixed MediaGallery DOM manipulation
- Created centralized routes configuration
- Add breadcrumbs to detail pages for better url navigation
- Made quote speakers clickable
- Fix Ko-fi support link
- Improve quote card grid layout
- Migrate pages to useHoverModal hook

## 2025-12-27
- Fixed React Admin "Created item missing required id field" error for bidirectional relationship creation
- Fixed double spoiler overlay on relationship cards (TimelineSpoilerWrapper now handles both card and thumbnail)
- Fixed MediaThumbnail empty state sizing for medium containers (32-80px) - now shows proportional icon only
- Added spoilers to quotes and organization pages
- Organization memberships added
- Removed multiple unused files and removed compromised secrets found in cookies.txt through adding it in .gitignore

## 2025-12-25
- Added Character Relationships system with full CRUD operations
  - New entity with relationship types: ally, rival, mentor, subordinate, family, partner, enemy, acquaintance
  - Backend module with spoiler protection based on chapter progress
  - Support for bidirectional relationships (A→B and B→A) in a single create operation
- Added CharacterRelationships admin page (List, Show, Create, Edit) with color-coded relationship types
- Integrated relationship management into Character Edit page in admin dashboard
  - Shows outgoing and incoming relationships in separate datagrids
  - Add Relationship button pre-fills source character
  - View All Relationships link with character filter
- Added relationships section to character detail page
  - Grouped by relationship type with icons and badges
  - Separate sections for outgoing (character's relationships) and incoming (others' views)
  - Character thumbnails with links to related character pages

## 2025-12-24

- Replaced browser `prompt()` with styled modal for guide and media rejection workflow
- Added navigation to pending counter badge (clicks through to pending guides/media)
- Added "showing X of Y" indicator to entity filter dropdowns in Guides admin
- Fixed empty button handlers in GuideDraftManager (Edit/Approve now functional)
- Changed Characters resource icon from Users to User for visual distinction
- Replaced CSS pseudo-element URL tooltip with MUI Tooltip for cross-browser/touch support
- Fixed duplicate badge name display in badge award modal dropdown
- Changed Gambles list "Ch." column header to "Chapter" for clarity
- Added notification feedback when unauthenticated users click like button on guides list page
- Added notification feedback when unauthenticated users click like button on guide detail page
- Login page now displays auth error messages from URL parameters
- Fixed MediaPageContent to use API_BASE_URL constant with filename check for uploaded media URLs
- Added pagination limits (100) to quotes/gambles fetch on profile page for performance
- Created shared MAX_CHAPTER constant (lib/constants.ts) and updated user profile pages to use it

## 2025-12-23
- Added README.md at project root with comprehensive project overview
- Added MIT License
- Arc timeline events compacted
- Event headers now use the first event as the title
- Spoiler added to arc events
- Fixed bug where events list page did not show modal for revealed events
- Small adjustment to popular profile pic header and badge modal text (profile page)
- Search for list pages now works if user manually deletes text rather than pressing X to clear
- Added general README and MIT license

## 2025-12-22
- QA checks for frontend pages including color design and mobile friendly buttons
- Timeline tab updates to ensure color visual consistency

## 2025-12-18
- Added modal checking for chapter progress; mark as spoiler and show modal if spoiler is revealed

## 2025-12-17
- Fixed the entity display image for the list and detail pages of characters, arcs, organizations, gambles, and events
- Added check for user authenticated for guides list page

## 2025-12-12
- Fixed sorting characters by first chapter appearance; remove newest filter from characters, arcs, gambles; add a better specific filter?
- Guides list page also shows author user profile picture
- Search bar result shows chapter number of chapter next to the chapter title

## 2025-12-11
- Url sync to allow saving pages with search filters
- Standardized hover modal component to reusable component
- Shared back button component for all public detail pages

## 2025-12-10
- Further clean up using Opus 4.5 to QA the application
- Resolved "property id should not exist" issue with admin dashboard (it was not trimming the additional fields received from react admin)
- Adjusting search for users page
- Updates to admin dashboard show/edit look
- Standardize pagination to 12 items per page
Added sorting to characters, arcs, and gambles list pages
- Consistent 404 handling for all list pages

## 2025-10-01
- Multiple updates to ensure build goes through properly (eslint and typing)
- Updated theming to user detail page
- Landing page volume cover pop outs accept single and pair volume covers (still need to test)
- 

## 2025-09-23
- Adjustments to look of list pages and detail pages
- Cleaned up landing page to have only essential elements

## 2025-09-22
- Updated events admin page to be similar to guides/media admin pages
- Adjusted colors/themeing to be centralized to mantine theme
- Added hover effects to tabs using global css (does not work with mantine navbar)

## 2025-09-20
- Added filter only volumes for media
- Centeralized Mantine theme; needs adjustment of text colors (some are using overlapping colors)
- Characters detail page layout updated

## 2025-09-19
- Finished layout/styling of arcs list page
- Added detail modal for arcs list page
- Adjusted styling of all public list pages
- Fixed profile page and any edit modals
- Data scraped from Usogui Fandom the volume covers and chapter titles
- All 49 volume covers and 539 chapter titles are indexed and seeded properly
- Paged hook caching implemented as well as optimizations to search and adding limits with TTL config


### Notes
- Debouncing is the solution for the search function calling continuous api calls. A simple timeout delay between the first call and subsequent calls limits how many calls are made while typing in search.

## 2025-09-18
- Conversion of all public pages from MUI to Mantine

### Notes
- So after a long day of attempts, I've decided to scrap the idea of migrating to shadcn from MUI. This is mainly due to the fact I've built most of the project already and shadcn for my project would be using a set of base components that need a lot of adjustment. Bascially, in the future I will consider using shadcn when starting from scratch.
- Doing a bit of research, a good alternative I am working to migrate to is Mantine. It seems to be simiar to MUI, but a lot less opinionated in its approach and seems a lot easier to work with for SSR. Another reason to use Mantine is that I am not very interested in having to fine tune components at the moment; I am satisfied with a good base that allows for some decent flexibility (which MUI was not providing as seen by SSR/hydration issues and strict styling)
- I have bought a subscription to Codex and at least first impression, it is clearly a step above Claude right now. There was a specific issue where I wanted to migrate the Navbar to start using Matine instead of MUI, but Claude Code would consistently give broken code. It could be that the Serena MCP could be interfering for the results or as usual my prompting, but will further test to see consistency. Those Claude Code performance issues might have some validity as I noted in earlier notes.

## 2025-09-16
- Renamed all instances of organization into organization
- Small updates to landing page (counters, footer, discord banner)
- Implemented SSR and meta tags for all data pages and detail pages except users/guides/admin and any client heavy page.

### Notes
- I am realizing more and more that using Material UI has become a lot more troublesome. Mainly due to it conflicting with a lot of server side rendering and causes many hydration issues. The reason to leverage server side rendering is to improve SEO and to provide the user with a prerendered page with initial data (so the backend can continue to load the rest of the javascript in the background). The drawback is a longer initial load, but subsequent loads are extremely fast. 

## 2025-09-15
- Replaced all markdown components into enhanced version (support for entity embeds and spoilers)
- Embedded entity support editing added to guide admin page
- Added badge system with support for Ko-fi and expiration of badge
- Fixed issues with badge system from admin pages
- Added custom role display to user profile if active supporter badge is active
- Redesign of navbar; categories to group content pages and search bar
### Notes
- It seems MUI styling can interfere with event detection for mouse leaving a component.

## 2025-09-14
- Updated guides admin page to look like the media admin page
- Updated media/guide endpoints to allow sorting 
- Search and filter by entity added to both media/guide admin pages
- Added embedded entity support for markdown

## 2025-09-13
- Added organization relation to character detail page and added characters to organizations detail page
- Added support for markdown for descriptions of entities
- Fixed log in pop up to close properly
- Hid 401 unauthenticated error when not logged in
- Fixed display of user profile pictures in guides
- Added about page and donate button
- Pending items counter added for guides/media
- Cleaned up quotes page and gamble detail page
- Updated media page to use better filters and truncate urls

## 2025-09-12
- Profile picture can now select from available character display media or keep default Discord profile
- Updated users page and profile to load the new modern profile header
- Normalized spoiler wrapper component by replacing it with timeline spoiler component
- Normalized entity display to be shown on arcs, gambles, gambles, volumes, and organizations 
- Added highlight of most popular quote, gamble, and character profile picture 

### Notes
- I really like the new profile picture selection. I was inspired by the og duelingnetwork profile pictures that showed the card art of the iconic monsters.

## 2025-09-11
- Overhauled media to now support polymorphic ownership; added entity purpose
- Added media thumbnails to load images
- Implemented media with entity display type to load based on chapter progress and update the thumbnail

## 2025-09-10
- Fixed arc relation for events/gambles admin pages
- Fixed guides page to show descriptions and link user profiles
- Added confirmation for deletion of data

## 2025-09-09
- Replaced email register/login with Discord Oauth2 login

### Notes
- Claude code had a lot of issues trying to implement Discord OAuth2 login. It seemed to get lik 80-90% of the code, but couldn't get it to work until a couple of tries to debug.

## 2025-09-07
- Fixed guides data saving in admin pages; added relations to characters, arcs, and gambles

### Notes
- Spent a little too long trying to troubleshoot relation issues. A lot of these issues are from not really knowing how the frontend handles the data as typically the backend endpoints I know work correctly.
- Apparently, Anthropic admitted there were performance issues over the past month, so likely some of my sessions were affected. I'll see if Claude code is more consistent over the next week.
- So far, there have been no issues with the LLM forgetting to check the build and the code generated. This was an issue that got worse over last week where I would try to have it implement a feature, but the code would be riddled with missing types or duplicated brackets.

## 2025-09-06
- Added tabs and media to gambles

### Notes
- Lots of fiddeling around with getting relations to work for each entity in the admin pages.


## 2025-09-05
- Fixed syntax errors in arc and character detail pages causing build failures
- Completed ArcTimeline component implementation with spoiler protection
- Streamlined timelines to have modals, spoilers, and event type filtering
- Updates to the looks of timelines; separation by arcs for characters and split detection for arcs/gambles timelines.
- Event overhaul completed. Need to double check admin pages are working and look good.

### Notes
- I need to start manually asking Claude to summarize long chats to limit use of tokens and continue working on complex features that require continous context. The command seems to be /compact to summarize context.
- So I made the mistake of asking Claude to create a timeline for gambles based on the timelines of characters and arcs. The result was the original timelines got refactored and not being the look of their original design. I noticed this too late, so I need to step by step revert changes rather than resetting to previous Git save. 
- Definitely need to look into making sure I understand how state/data is passed around in frontend. I understand the code, but applying that understanding to fixing bugs takes a lot of time. Additionally, Claude seems to make decent design decisions as long as context and half decent prompt is provided. I really like the design of arcs timeline even though it was Claude that refactored it.
- Might have issues with styling down the line since styling is split between MUI React components (v6) and Tailwind CSS. This is because MUI uses JSS for styling, while Tailwind uses utility classes. I am probably leaving an absolute mess for anyone (me) if I need to edit the styling.

## 2025-09-04
- Added disclaimer page and FAQ section
- Fixed spoilers on character detail page to use useSpoilerSettings hook
- Updated character timeline to hide spoilers and list multiple events per arc
- Jump to chapter functionality added to character timeline
- Separate tabs for overview, timeline, and media
- Fixed filtering out events for character detail page; events properly load in and have spoiler warnings
- Added event modal that shows up when hovering over events in character timeline

### Notes
- For reference, a key inspiration for the site is masterduelmeta.com, eldenring.wiki.fextralife.com, and anilist.co; primarily focusing on providing streamlined data and adding any features that will enhance the website without too much bloat.
- I considered adding comments, but opted not to cause of additional time spent moderating the site and leaving the community interaction for Discord, Youtube, Reddit, etc.
- Spoilers was a big thing I noticed when I spent a lot of time going through wikis back then. So implementing the user progress is a big thing that will allow people to read the wiki without having to finish the manga. As the biggest goal is to make this a good resource to understand the story.
- Claude code sonnet 4.0 is still having issues making code clean and will occasionally forget/hallucinate. A lot of the tokens recently have been spent trying to fix issues that are hard to spot for the coding agent like loading data properly. The trend seems to be that it will usually miss an already implemented component as it wasn't defined in the prompt (even though I expect MCP Serena to clue it in)
- Not sure if the 5 hour limit is a good thing as occasionally it will hit the limit while it is refactoring/generating code. I tend to get carried away with coding so having a forced break is somewhat helpful. Either way, the limit is still usually reached within 2 hours of use even though I am trying to /clear the context as much as possible.
- Some tips are: always try to run /clear to free up context to limit tokens used. Long chats will continue to pull previous tokens, so it's best to clear it often.

## 2025-09-03
- Update show and edit admin pages for guides/media layout to be easier to see
- Fix view all guides in user (filter doesn't work on guides page)
- Added spoilers to gambles
- Added events to arcs page
- Updated chapter progress button and pop up for better UX
- Added media gallery with media view; updated submission link validations
- Previous user handling for chapter progress; allows local save to retain progress
- Changed view count to also track and display unique views
- Fixed filtering for character quotes
- Updating look of character detail page

### Notes
- I am thinking of going through with the name L-file for the website. Although it is not completely faithful for the canon use of the term, it's a cool name and neat codename for the project. I will include other ways of making sure the site shows up in relevant search results.
- It seems to be a good choice to sort of do this project with a rough idea of what is needed/wanted in my mind. I'm finding a lot of additional small things to add as I implement each feature. Maybe not the best workflow for a project, but I think I'd be stuck with planning a little too long. Seeing the website change gives me more reason to keep going.

## 2025-09-02
- Arc and gamble appearances added to character detail page
- Fixed saving data of observers/participants in gambles admin page
- Adjustment in layout for nav bar to center
- Updated theming of website to use red, purple, white and black color palette 
- Font for headers updated to use LTC Goudy Text (https://fontmeme.com/fonts/goudy-text-font/)
- Added proper view counting for pages as well as trending section
- Updated consistency of Lucide icons use (themeing)
- Added Volumes 37/38 to the landing page with animations
- Detail pages added for chapters, users, volumes, organizations
- Reading progress button added; hidden on admin page
- Added alias to character search
- Author linking and updated user profile view
- Allow non logged in users and regular users to see user profiles
- Added disclaimer footer and links
- Added editing your own guide
- Removal of media approval queue; set default to show pending for guides and media
- 

### Notes
- Cloister Black was a close contender for font, but I wanted to prioritize legibility of the uppercase.
- I am considering adding light theme, but for the sake of theming and consistency the site will be dark themed.
- Taking my time with adding frontend edits to ensure user experience is good. However, I am going at a lot slower pace since I am trying to fine tune certain things (i.e. landing page) without a plan to reference

## 2025-09-01
- Updated character page with further details and show events/gambles
- Gambles admin page streamlined to look better
- Removed start/end chapter and set single chapter event occurs
- Updated dropdowns to show loaded data with proper loading states
- Enhanced gamble admin dropdowns with better UX (loading messages, helper text, empty states)
- Added proper references to admin pages (i.e. click on character to go to character page)
- Fixed arc relation for admin dashboard
- Added guide view count tracking
- Finished spoiler detection for characters
- Included quotes (need to add gambles as well) to character detail page

### Notes
- As stated previously, there are ongoing issues with Claude and it's hard for me to know if my Serena MCP is working as intended or Claude's code quality really is poorer at the moment. I am finding more issues with the code it generates, so I need to try refining my prompting a lot more to mitigate the issues.

## 2025-08-31
- Show titles for events in events page
- Added likes to guides
- Update admin dashboard to show accurate number of data entries
- Guides workflow for approval/reject added along with filtering for guide status
- Applied auth protection and loading for authenticated pages
- Adding backblaze b2 service for uploading character/arc image (admin/moderator only) (needs cdn/domain)

### Notes
- It seems there have been changes or fluctuations to Claude code this recent week (no official announcement, was looking through reddit lol). May have been the cause for code to be weaker in quality.


## 2025-08-30
- Adjusting fields for admin pages to edit data
- Fixed updating data of most fields; need more work on complex fields like gambles
- Fixed views of gambles, events, and guides on the home page; also added search by title for gambles/events
- Updated routes to use /api/* endpoint
- Replaced foreign key settings on the frontend with selection from data tables
- Approval/reject works for media approval queue (need to add rejected search to media)
- User profile page improved to update chapter progress and select favorite quote/gamble


### Notes
- There's been minor issues with ensuring code is consistent; primarily with trying to keep context concise. The "5-hour limit" for Claude Pro runs out very quickly when it comes to making sweeping changes. Clearing the context seems to help, but still feels limiting. For reference, I spent maybe 2 hours last night and little above 3 hours this morning before I hit each session's limits.
- Fixing code tends to not fix the issue if there are missing endpoints or functions that are assumed. This is apparent for something like requesting a media approval queue as it sends a query to the backend with additional params that don't exist on the backend. 
- Added Serena MCP to improve Claude code. So far, it has saved a bit more on the usage limit and seems to be more understanding of the code. I need to look into adjusting Serena because it is clear Claude misses a bit of the memories it store. Not sure if this is a config issue. Despite this, I will look into more MCP implementations as adding Serena has improved the quality of the responses overall while not costing additional usage.

## 2025-08-28
- Reset everything to regenerate code from scratch with Claude 3.7

### Notes
- After a long amount of frustrations with Gemini 2.5 and basic models for Github Copilot, I am trying out Claude Code. It seems to be just as good as using it as the model for Copilot so far. Definitely a lot better in terms of initial impressions as auth was immediately working from generated code. Still has mistakes, but this will actually solve the issues is what I noticed compared to other models. 
- Looking over the code, it seems a good way to avoid issues is to clearly define the relationships in your data. A lot of bugs I am finding are from the LLM not realizing that it needs to expect a more complex object that a simple string or number.
- Fixed character relation for events (still need to update for character/event pages)

## 2025-08-27
- Reset everything for the frontend; rebuilt basic frontend with Grok Code Fast 1 (preview)
- Working admin dashboard for data; elements seem to work, but need to hook endpoints for data on admin updates

### Notes
- Been messing around with Grok since it is available for a limited time. It seems significantly useful, but that may be due to it being a larger model than the free unlimited models. I find results to be significantly more accurate once I give more specific instructions with a limited scope. Though, it may be due to the LLM checking my existing copilot-instructions as it will get derailed if you have not updated parts of your code.

## 2025-08-26
- Generated basic webpage frontend
- Updating backend endpoints to return Paginated response rather than an Array of data
- Normalizing expecting paginated responses for all pages
- Added auth header for login with JWT token; authProvider implemented to manage login state
- Implemented react-admin for all datapoints
- Adding cookies and cookie-parser to allow for signed logins
- Basic admin page almost completed. Working on fixing react-admin (guides and selecting data) and cleaning up structure.
- Standardized all list endpoints to return the canonical paginated response `{ data, total, page, perPage, totalPages }` and ensured `X-Total-Count` is exposed for clients that read headers.
- Fixed issues with getOne and added handling to ensure an id exists; if it doesn't, id = params.id

### Notes
- Working with Gemini's Agent Mode seems to be decent, but fails to have as much consistency as using a premium model with Github Copilot. It feels like the generated code often breaks quickly or the coding structure is very flawed (probably due to not reading files in a logical manner?). I will stick to GPT-5 mini preview with Github Copilot as it seems to consistently identify and solve issues. If I continue using Pro, I will use Claude Sonnet 4.0 for premium requests.
- NextJS requires building the frontend to deploy changes
- I will need to practice identifying and coding state changes on the frontend. Even though I've worked with frontend here and there, I am not familar enough to let the LLM generate a bunch of code for me to try and fix. This is partly due to the errors being a lot more vague to me on the frontend.
- It's been a little bit of an issue making sure to clean up files. Mainly, it's making sure if I change an entitiy and its relations, that I reflect that change throughout its module (i.e. entity changes may require change to typeorm relationships).
- I realize that I would have saved myself a lot of headaches if I knew about making instruction documents for the LLM. For example, defining use of OpenAPI documents/decorators or specifying structure for response. Even though I would prompt the LLM to scan through files and find any discrepancies, it would not realize the file's data structure was not the same as the rest of the project.

## 2025-08-25
- Added guides module for users to write out guides in markdown
- Added full search to check across all data (no full text yet; may consider for guides/gambles/events)
- Updated user to have chapter userProgress stored

### Notes
- API documentation is simple and straightforward. Although I could spend the time writing out the info by myself, the LLM gives enough relevant info to get started.
- There is a setting button for Github Copilot's chat window to generate instructions. Using this will generate a reference document for the LLM to refer to based on the entire project. So far, the auto generated one looks really helpful, but could benefit specifics if I plan to implemeent complex features that interact with a lot of moving parts.

## 2025-08-23
- Removed chapter-spoilers and consolidated it into events module
- Added quotes data
- Normalized OpenAPI tags between controllers and entities
- Added ability for users to set their profile pic to a preset character image (hosted on the frontend), select their favorite quote, and select their favorite gamble
- Updated translation entities (for consistency in the future, not to be used for now)
- Combing through datapoints to ensure OpenAPI documentation and routes are correct

### Notes
- AdminJS was having issues with ESM support as the backend uses NestJS; will implement React Admin on the frontend for the dashboard
- Figured out that migrations are necessary if we already have data on the server and need to change the data structure. This is definitiely something to look out for in places that involve user submitted data like user database and media

## 2025-08-22
- Support for Japanese translated database via translation module
- Added additional character details (firstChapter, alternate names, roles, etc)
- Included chapter spoiler for deaths 
- OpenAPI decorators for all API routes
- Email service hooked to Resend
- URL validation for uploaded media including normalization of link url
- For some reason, I thought I would put gambles into arcs or something; added gambles to database
- Added copilot instructions file
- Cleaned up any discrepancies between entity, controller, and dto for each module

### Notes
- Translation setup for Japanese made; however, will need to manually input translations in the admin panel. Considering AI translation for any missing translations.
- Default language is English, can fetch translation via -jp in request. Translation module allows for us to keep using backend without worrying for missing translations
- create-character.dto and similar files are made to specify the entity DTO, allowing us to implement pagination and filtering. Recommended if route needs validation.
- It seems that the Large Language Modules (LLMs) for GitHub Copilot Agent mode chat can easily hallucinate and forget how to keep consistency if using a basic model (ChatGPT 4.1). Currently using Claude Sonnet 3.7 which seems to be a lot more consistent. 
- Hopefully, copilot instructions are a bit more easier for the basic models to get project context
- Migrations seem to be an absolute headache when it comes to working with several data points. I need to ensure that any data that is changed their corresponding files that use said data need to be changed (i.e. entity <-> controller). Absolutely annoying when I need to add a new data point like gambles and volumes
- e2e testing using jest seems really useful, but I highly doubt I would want to spend the time writing out all the tests


## 2025-08-21

- Added modules for auth including setup for authentication role guards
- Authentication reads both local and jwt tokens
- Confirmed all routes for register user, verify email, log in user, get user, request password request, confirm password request  via Postman testing
- Added media module to handle saving of media urls
- Added search/filter for characters, arcs, chapters, and events. As well as a filter to check desc
- Implemented an additional "order" field to organize arcs and series canonically
- Added sorting by number for chapters. Additional sorting for rest of data points for future tables to be made on the frontend
- Added security including .env checking, global exception handling, rate limiting
- Added chapter spoiler functionality as well as database migrations

### Notes
- Going to focus on implementing an admin dashboard rather than a linked spreadsheet to edit data. Google sheets seems useful, but will likely cause issues once hundreds of entries for chapter spoilers and events are added
- Recently added DataTransferObjects for auth; although I'm familar with DTOs, it's hard to remember when to use one when entity already exists. It seems mainly used to quickly pass small data that won't be saved on the backend
- Last min, I learned that GitHub Copilot was inbuilt into vscode (for some reason I never tried using it during these recent years). This is extremely useful as not only is it actually taking in the context of my project, it takes the time to explain all of its changes. I'm afraid I may be a little to reliant on this tool, but it's better than wasting a lot of time muddling with "basic" code that I would have to run around docs for. At the very least, I feel really comfortable with building large systems (from previous tinkering on Roblox and making a Linux file system a while ago)
- .env should be made for local and cloud separately. .env example is useful as a template
- Global exception handling is helpful to protect the application, but may not be as thorough in specifics
- Database migrations might be a headache if I don't ensure connection of the database is clean. Hard reset may be required when it gets really confusing; so I should have a backup of the data saved


## 2025-08-20

- Initialized data for multiple data points (characters, arcs, chapters, etc)
- Connected TypeOrmModule for postgres connection; added relationships between data to relevant entities (ex. Media for Characters)
- Controllers for REST endpoints, Services for basic Create-Remove-Update-Delete functions, Modules for abstraction (separation of features for easier debugging)
- Added basic data for future features (spoiler checks, tagging, user submissions)

### Notes
- ChatGPT is really good at getting boiler plate code; however, I need to always be mindful on keeping context concise when adjusting the code
- Another thing to note is that I know how to read the code and understand what's being done, but writing new code would be very difficult unless I am following an example (i.e. existing documentation)
- Seperation of data into Model-View-Controller is now feeling useful; it actually makes sense to compartmentalize data (especially when using module/factory paradigm)
- NestJS so far is a lot easier to write once I am aware of the structure required to implement Rest API and features