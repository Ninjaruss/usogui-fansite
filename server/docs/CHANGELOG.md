# Changelog and notes

## 2025-08-22
### Changes
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
### Changes
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


### TODO:
- Need a refresher on extending classes. I am not familar with strategies (choice for which auth method to use) and guards (block requests based on authenticated status)
- Implement some sort of backup of existing database 

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