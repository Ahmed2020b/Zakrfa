# Zakrfa Discord Bot

A Discord bot for creating channels and roles with custom zakrfa styles.

## Features

- `/zakrfa` - Set zakrfa style for channels/roles
- `/type` - Choose between channels or roles
- `/create` - Create channels or roles with the set style
- Variable support: `~` for emoji, `%` for text
- Persistent storage of styles and settings

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Discord Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the bot token

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

4. **Invite the bot to your server:**
   - Go to OAuth2 > URL Generator
   - Select "bot" scope
   - Select permissions: Manage Channels, Manage Roles, Send Messages, Use Slash Commands
   - Use the generated URL to invite the bot

5. **Run the bot:**
   ```bash
   npm start
   ```

## Usage Examples

### Setting up zakrfa style:
```
/zakrfa style:𝐀𝟑〢~〉%
```

### Choosing type:
```
/type choice:channels
```

### Creating channels/roles:
```
/create name:test,test2 emoji:🔎
```

## Variables

- `~` - Replaced with the emoji you specify
- `%` - Replaced with the name you provide

## Example Workflow

1. Set zakrfa style: `/zakrfa style:𝐀𝟑〢~〉%`
2. Choose type: `/type choice:channels`
3. Create channels: `/create name:test,test2 emoji:🔎`

This will create channels with names like: `𝐀𝟑〢🔎〉test` and `𝐀𝟑〢🔎〉test2`

## Permissions Required

The bot needs the following permissions:
- Manage Channels
- Manage Roles
- Send Messages
- Use Slash Commands

## Data Storage

The bot stores zakrfa styles and settings in `zakrfa-data.json` file, which is automatically created and managed.