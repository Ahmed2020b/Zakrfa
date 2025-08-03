require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// Bot configuration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// Store zakrfa styles and settings
let zakrfaStyles = new Map();
let zakrfaSettings = new Map();

// Store whitelist data
let whitelist = new Map();

// Load saved data
function loadData() {
    try {
        if (fs.existsSync('./zakrfa-data.json')) {
            const data = JSON.parse(fs.readFileSync('./zakrfa-data.json', 'utf8'));
            zakrfaStyles = new Map(data.styles || []);
            zakrfaSettings = new Map(data.settings || []);
            whitelist = new Map(data.whitelist || []);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Save data
function saveData() {
    try {
        const data = {
            styles: Array.from(zakrfaStyles.entries()),
            settings: Array.from(zakrfaSettings.entries()),
            whitelist: Array.from(whitelist.entries())
        };
        fs.writeFileSync('./zakrfa-data.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('zakrfa')
        .setDescription('Set zakrfa style for channels')
        .addStringOption(option =>
            option.setName('style')
                .setDescription('The zakrfa style to use')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Space character to use (optional)')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('type')
        .setDescription('Choose between channels or roles')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Choose channels or roles')
                .setRequired(true)
                .addChoices(
                    { name: 'channels', value: 'channels' },
                    { name: 'roles', value: 'roles' }
                )),
    
    new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create channels or roles with zakrfa style')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name for the channel/role (comma separated for multiple)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji to use')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('rent')
        .setDescription('Add server to whitelist with time')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Server ID to whitelist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time in days (e.g., 30 for 30 days)')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Check whitelist status for current server')
];

async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Handle zakrfa command
async function handleZakrfa(interaction) {
    const guildId = interaction.guildId;
    
    // Check if server is whitelisted
    if (!isWhitelisted(guildId)) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('عفوا يرجى انك تكلم صانع البوت <@1307733573549166713> لكي تستخدمني')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    // Check if user has Manage Channels permission
    if (!interaction.member.permissions.has('ManageChannels')) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('يجب أن تملك صلاحية إدارة الرومات لاستخدام هذا الأمر')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const style = interaction.options.getString('style');
    const space = interaction.options.getString('space') || ' ';
    
    // Store the style and settings
    zakrfaStyles.set(guildId, style);
    zakrfaSettings.set(guildId, { space });
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('تم تعين الزخرفه التلقائيه')
        .setDescription('استخدم /create لكي تسوي رومات او رتب')
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

// Handle type command
async function handleType(interaction) {
    const guildId = interaction.guildId;
    
    // Check if server is whitelisted
    if (!isWhitelisted(guildId)) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('عفوا يرجى انك تكلم صانع البوت <@1307733573549166713> لكي تستخدمني')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    // Check if user has Manage Channels permission
    if (!interaction.member.permissions.has('ManageChannels')) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('يجب أن تملك صلاحية إدارة الرومات لاستخدام هذا الأمر')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const choice = interaction.options.getString('choice');
    
    // Store the type choice
    const settings = zakrfaSettings.get(guildId) || {};
    settings.type = choice;
    zakrfaSettings.set(guildId, settings);
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('تم اختيار النوع')
        .setDescription(`تم اختيار: ${choice === 'channels' ? 'الرومات' : 'الرتب'}`)
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

// Check if server is whitelisted
function isWhitelisted(guildId) {
    const whitelistData = whitelist.get(guildId);
    if (!whitelistData) return false;
    
    const now = Date.now();
    const expiryTime = whitelistData.expiryTime;
    
    return now < expiryTime;
}

// Handle rent command
async function handleRent(interaction) {
    // Check if user is the bot owner
    if (interaction.user.id !== '1307733573549166713') {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('فقط صانع البوت يمكنه استخدام هذا الأمر')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const serverId = interaction.options.getString('id');
    const timeDays = parseInt(interaction.options.getString('time'));
    
    if (isNaN(timeDays) || timeDays <= 0) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('يجب إدخال عدد صحيح من الأيام')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const expiryTime = Date.now() + (timeDays * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    
    whitelist.set(serverId, {
        addedBy: interaction.user.id,
        addedAt: Date.now(),
        expiryTime: expiryTime,
        timeDays: timeDays
    });
    
    saveData();
    
    const expiryDate = new Date(expiryTime);
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('تم إضافة السيرفر للقائمة البيضاء')
        .setDescription(`تم إضافة السيرفر \`${serverId}\` للقائمة البيضاء`)
        .addFields(
            { name: 'المدة', value: `${timeDays} يوم`, inline: true },
            { name: 'تاريخ الانتهاء', value: expiryDate.toLocaleDateString('ar-SA'), inline: true },
            { name: 'تم الإضافة بواسطة', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

// Handle whitelist status command
async function handleWhitelist(interaction) {
    const guildId = interaction.guildId;
    const whitelistData = whitelist.get(guildId);
    
    if (!whitelistData) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('حالة القائمة البيضاء')
            .setDescription('هذا السيرفر غير مسجل في القائمة البيضاء')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const now = Date.now();
    const isExpired = now >= whitelistData.expiryTime;
    
    if (isExpired) {
        // Remove expired entry
        whitelist.delete(guildId);
        saveData();
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('حالة القائمة البيضاء')
            .setDescription('انتهت صلاحية هذا السيرفر في القائمة البيضاء')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const expiryDate = new Date(whitelistData.expiryTime);
    const remainingDays = Math.ceil((whitelistData.expiryTime - now) / (24 * 60 * 60 * 1000));
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('حالة القائمة البيضاء')
        .setDescription('هذا السيرفر مسجل في القائمة البيضاء')
        .addFields(
            { name: 'المدة الأصلية', value: `${whitelistData.timeDays} يوم`, inline: true },
            { name: 'الأيام المتبقية', value: `${remainingDays} يوم`, inline: true },
            { name: 'تاريخ الانتهاء', value: expiryDate.toLocaleDateString('ar-SA'), inline: true },
            { name: 'تم الإضافة بواسطة', value: `<@${whitelistData.addedBy}>`, inline: true },
            { name: 'تاريخ الإضافة', value: new Date(whitelistData.addedAt).toLocaleDateString('ar-SA'), inline: true }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

// Handle create command
async function handleCreate(interaction) {
    const names = interaction.options.getString('name').split(',').map(n => n.trim());
    const emoji = interaction.options.getString('emoji') || '📁';
    const guildId = interaction.guildId;
    
    // Check if server is whitelisted
    if (!isWhitelisted(guildId)) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('عفوا يرجى انك تكلم صانع البوت <@1307733573549166713> لكي تستخدمني')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    // Check if user has Manage Channels permission
    if (!interaction.member.permissions.has('ManageChannels')) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('يجب أن تملك صلاحية إدارة الرومات لاستخدام هذا الأمر')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const style = zakrfaStyles.get(guildId);
    const settings = zakrfaSettings.get(guildId) || {};
    
    if (!style) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('يجب عليك تعيين الزخرفه أولاً باستخدام /zakrfa')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed] });
    }
    
    const type = settings.type || 'channels';
    const space = settings.space || ' ';
    
    try {
        const createdItems = [];
        
        for (const name of names) {
            // Process the style with variables
            let processedStyle = style
                .replace(/~/g, emoji)
                .replace(/%/g, name)
                .replace(/\s/g, space); // Replace spaces with the custom space character
            
            if (type === 'channels') {
                // Create channel
                const channel = await interaction.guild.channels.create({
                    name: processedStyle,
                    type: 0, // Text channel
                    reason: 'Created with zakrfa bot'
                });
                createdItems.push(channel.name);
            } else {
                // Create role
                const role = await interaction.guild.roles.create({
                    name: processedStyle,
                    reason: 'Created with zakrfa bot'
                });
                createdItems.push(role.name);
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('تم انشاء الرومات الزخرفه')
            .setDescription(`تم إنشاء ${createdItems.length} ${type === 'channels' ? 'روم' : 'رتب'}:`)
            .addFields(
                createdItems.map((item, index) => ({
                    name: `${index + 1}.`,
                    value: item,
                    inline: true
                }))
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Error creating items:', error);
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('خطأ')
            .setDescription('حدث خطأ أثناء إنشاء الرومات/الرتب')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'zakrfa':
                await handleZakrfa(interaction);
                break;
            case 'type':
                await handleType(interaction);
                break;
            case 'create':
                await handleCreate(interaction);
                break;
            case 'rent':
                await handleRent(interaction);
                break;
            case 'whitelist':
                await handleWhitelist(interaction);
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        await interaction.reply({ 
            content: 'حدث خطأ أثناء تنفيذ الأمر',
            ephemeral: true 
        });
    }
});

// Bot ready event
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadData();
    await registerCommands();
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
