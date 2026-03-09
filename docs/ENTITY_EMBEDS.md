# Entity Embed System

The Usogui Database includes a powerful entity embed system that allows you to create interactive cards within markdown content. These embeds help readers discover related content and make your guides more engaging.

## Basic Syntax

Entity embeds use double curly braces with the entity type and ID:

```
{{entity_type:id}}
```

You can also add custom display text:

```
{{entity_type:id:custom_display_text}}
```

## Supported Entity Types

### Characters
Link to character profiles with detailed information.

**Syntax:** `{{character:id}}` or `{{character:id:custom_text}}`

**Examples:**
- `{{character:1}}` - Basic character embed
- `{{character:1:the protagonist}}` - Character with custom text
- `{{character:5:Baku Madarame}}` - Character with full name

### Story Arcs
Link to narrative arc pages with chapter ranges and events.

**Syntax:** `{{arc:id}}` or `{{arc:id:custom_text}}`

**Examples:**
- `{{arc:5}}` - Basic arc embed
- `{{arc:5:Tower Arc}}` - Arc with custom name
- `{{arc:3:the climactic arc}}` - Arc with descriptive text

### Gambles
Link to gambling event pages with rules and participants.

**Syntax:** `{{gamble:id}}` or `{{gamble:id:custom_text}}`

**Examples:**
- `{{gamble:12}}` - Basic gamble embed
- `{{gamble:12:Air Poker}}` - Gamble with name
- `{{gamble:8:the final showdown}}` - Gamble with description

### Guides
Link to other user-created guides and analysis.

**Syntax:** `{{guide:id}}` or `{{guide:id:custom_text}}`

**Examples:**
- `{{guide:3}}` - Basic guide embed
- `{{guide:3:Gambling Rules Guide}}` - Guide with title
- `{{guide:7:my previous analysis}}` - Guide with custom reference

### Organizations
Link to organization pages with member information.

**Syntax:** `{{organization:id}}` or `{{organization:id:custom_text}}`

**Examples:**
- `{{organization:2}}` - Basic organization embed
- `{{organization:2:Kakerou}}` - Organization with name
- `{{organization:1:the main organization}}` - Organization with description

### Chapters
Link to specific chapter pages.

**Syntax:** `{{chapter:id}}` or `{{chapter:id:custom_text}}`

**Examples:**
- `{{chapter:150}}` - Basic chapter embed
- `{{chapter:150:The Final Gamble}}` - Chapter with title
- `{{chapter:100:the turning point}}` - Chapter with description

### Volumes
Link to manga volume pages.

**Syntax:** `{{volume:id}}` or `{{volume:id:custom_text}}`

**Examples:**
- `{{volume:20}}` - Basic volume embed
- `{{volume:20:The Conclusion}}` - Volume with title
- `{{volume:15:where everything changes}}` - Volume with description

### Quotes
Link to memorable character quotes.

**Syntax:** `{{quote:id}}` or `{{quote:id:custom_text}}`

**Examples:**
- `{{quote:45}}` - Basic quote embed
- `{{quote:45:Baku's famous line}}` - Quote with reference

## Usage Examples

### In Guide Content

```markdown
# Understanding the Tower Arc

The {{arc:5:Tower Arc}} is one of the most complex storylines in Usogui. It primarily features {{character:1:Baku Madarame}} facing off against multiple opponents in {{gamble:12:Air Poker}}.

For more information about the gambling rules, see {{guide:3:Gambling Rules Guide}}.

The arc takes place from {{chapter:150}} to {{chapter:200}} and is contained within {{volume:20}} and {{volume:21}}.

Key participants include members of {{organization:2:Kakerou}} and other organizations.
```

### Multiple Embeds in Context

```markdown
In {{chapter:175}}, {{character:1:Baku}} delivers his famous quote {{quote:45}} while playing {{gamble:12}} against {{character:8:his main rival}}.
```

## Best Practices

### When to Use Entity Embeds

- **Reference Key Characters**: When mentioning important characters in your analysis
- **Cite Sources**: When referencing specific chapters, volumes, or other guides
- **Explain Context**: When discussing gambles, arcs, or organizations
- **Cross-Reference**: When connecting related content

### Custom Display Text Guidelines

- **Be Descriptive**: Use text that provides context for your readers
- **Stay Consistent**: Use similar naming conventions throughout your guide
- **Avoid Spoilers**: Be careful not to reveal plot points in the display text
- **Keep It Concise**: Short, clear descriptions work best

### Writing Tips

1. **Start Simple**: Use basic embeds first, then add custom text as needed
2. **Preview Often**: Use the preview tab to see how your embeds look
3. **Test Links**: Make sure the entities you're referencing actually exist
4. **Balance Usage**: Don't overuse embeds - they should enhance, not overwhelm
5. **Consider Flow**: Place embeds naturally within your text

## Visual Examples

When rendered, entity embeds appear as interactive cards with:

- **Entity Icon**: Visual representation of the entity type
- **Entity Name**: The name or custom display text
- **Entity Type Badge**: Shows what type of entity it is
- **Contextual Information**: Additional details like chapter ranges, character organizations, etc.
- **Hover Effects**: Visual feedback when users interact with the cards
- **Click Navigation**: Direct links to the full entity pages

## Technical Notes

- Entity embeds are processed client-side for optimal performance
- Cards load entity data asynchronously to avoid blocking page rendering
- Broken or invalid entity references will display error states
- All embeds are fully responsive and work on mobile devices
- The system maintains full compatibility with existing spoiler protection

## Troubleshooting

### Common Issues

**Embed Not Showing**: Check that the entity ID exists and is valid
**Broken Link**: Verify the entity hasn't been deleted or moved
**Display Problems**: Ensure you're using the correct syntax with double curly braces
**Performance Issues**: Avoid using too many embeds in a single guide

### Getting Help

If you encounter issues with entity embeds:
1. Check the syntax in this documentation
2. Use the preview feature to test your embeds
3. Contact moderators if entities appear to be missing
4. Report bugs through the feedback system

## Advanced Usage

### Combining with Spoiler Tags

Entity embeds work seamlessly with spoiler protection:

```markdown
> [!SPOILER Chapter 200] 
> In the final confrontation, {{character:1}} defeats {{character:8}} using {{gamble:12}}.
```

### Embedding in Lists

```markdown
Key characters in this arc:
- {{character:1:Baku Madarame}} - The protagonist
- {{character:8:Main Antagonist}} - The primary opponent
- {{character:15:Supporting Character}} - Provides crucial assistance
```

### Complex References

```markdown
This analysis builds on {{guide:3:previous guide}} and focuses on events from {{arc:5}} through {{arc:7}}, specifically examining {{gamble:12}} and {{gamble:18}} as turning points in the relationship between {{organization:1}} and {{organization:2}}.
```

---

*This entity embed system makes the Usogui Database more interconnected and helps readers discover related content naturally while reading guides and analysis.*
