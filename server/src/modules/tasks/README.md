# Tasks Module

This module handles scheduled tasks for the Usogui Database backend, primarily focused on automated badge management.

## Features

### Scheduled Tasks

1. **Daily Badge Expiration Check** - Runs every day at midnight
   - Automatically expires badges that have reached their expiration date
   - Clears custom titles for expired Active Supporter badges
   - Logs detailed information about expired badges

2. **Monthly Badge Report** - Runs on the first day of every month
   - Placeholder for future monthly statistics and reporting

### Manual Triggers

Admin users can manually trigger badge expiration via the API:

```
POST /api/badges/expire-badges
Authorization: Bearer <admin-jwt-token>
```

### Badge Statistics

Get comprehensive badge statistics:

```
GET /api/badges/statistics
Authorization: Bearer <admin-jwt-token>
```

Returns:
- Badge counts by type (Supporter, Active Supporter, Sponsor, Custom)
- Number of badges expiring in the next 7 days
- Total donation statistics
- Generated timestamp

## Environment Variables

- `KOFI_WEBHOOK_TOKEN` - Optional verification token for Ko-fi webhooks

## Implementation Details

### Badge Expiration Logic

1. Finds all active badges with expiration dates
2. Compares expiration date to current time
3. Marks expired badges as inactive
4. For Active Supporter badges: clears custom titles
5. Logs all expiration activities

### Ko-fi Webhook Security

Enhanced verification includes:
- Required field validation
- Amount reasonableness checks ($1 - $10,000)
- Timestamp validation (within last hour)
- Optional verification token matching
- Detailed logging for security monitoring

### Logging

All badge operations are logged with:
- User information
- Badge details
- Operation outcomes
- Error handling
- Security events

## Usage in Production

The ScheduleModule is automatically loaded when the server starts. Tasks will run according to their cron schedules without manual intervention.

For monitoring, check application logs for:
- `BadgesService` - Badge operations and expiration
- `DonationsService` - Ko-fi webhook processing
- `TasksService` - Scheduled task execution
