# Changelog and notes

## 2025-08-21
### Changes
- Added modules for auth including setup for authentication role guards
- Authentication reads both local and jwt tokens
- Confirmed all routes for register user, verify email, log in user, get user, request password request, confirm password request  via Postman testing
- Added media module to handle saving of media urls

### Notes
- Going to focus on implementing an admin dashboard rather than a linked spreadsheet to edit data. Google sheets seems useful, but will likely cause issues once hundreds of entries for chapter spoilers and events are added
- Recently added DataTransferObjects for auth; although I'm familar with DTOs, it's hard to remember when to use one when entity already exists. It seems mainly used to quickly pass small data that won't be saved on the backend

### TODO:
- Add route protections depending on role (user, mod, admin)
- Need a refresher on extending classes. I am not familar with strategies (choice for which auth method to use) and guards (block requests based on authenticated status)

## 2025-08-20
### Changes
- Initialized data for multiple data points (characters, arcs, chapters, etc)
- Connected TypeOrmModule for postgres connection; added relationships between data to relevant entities (ex. Media for Characters)
- Controllers for REST endpoints, Services for basic Create-Remove-Update-Delete functions, Modules for abstraction (separation of features for easier debugging)
- Added basic data for future features (spoiler checks, tagging, user submissions)

### Notes
- ChatGPT is really good at getting boiler plate code; however, I need to always be mindful on keeping context concise when adjusting the code
- Another thing to note is that I know how to read the code and understand what's being done, but writing new code would be very difficult unless I am following an example (i.e. existing documentation)
- Seperation of data into Model-View-Controller is now feeling useful; it actually makes sense to compartmentalize data (especially when using module/factory paradigm)
- NestJS so far is a lot easier to write once I am aware of the structure required to implement Rest API and features

### TODO: 
- media module to handle user submissions
- look into how testing files work
- user auth and potential for contributor functionality
- google sheet sync