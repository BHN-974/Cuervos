const {
    Client,
    GatewayIntentBits,
    PermissionFlagsBits,
    ChannelType,
    SlashCommandBuilder,
    REST,
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// =====================================================
// CONFIGURATION
// =====================================================

const GUILD_ID = "1550316593794261023";

const ROLE_NAMES = {
    chef: "Chef",
    coleader: "Co-Leader",
    brasDroit: "Bras Droit",
    recruteur: "Recruteur",
    membre: "Membre",
    recrue: "Recrue"
};

// =====================================================
// FONCTIONS
// =====================================================

async function getOrCreateRole(guild, name, permissions = []) {
    let role = guild.roles.cache.find(r => r.name === name);

    if (!role) {
        role = await guild.roles.create({
            name,
            permissions,
            reason: "Configuration Cuervos"
        });
    }

    return role;
}

async function getOrCreateCategory(guild, name, overwrites = []) {
    let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
    );

    if (!category) {
        category = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: overwrites
        });
    }

    return category;
}

async function getOrCreateChannel(guild, name, category, overwrites = []) {
    let channel = guild.channels.cache.find(
        c =>
            c.type === ChannelType.GuildText &&
            c.name === name &&
            c.parentId === category.id
    );

    if (!channel) {
        channel = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: overwrites
        });
    }

    return channel;
}

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {
    console.log(`🟢 Cuervos est connecté : ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        console.log("❌ Serveur Cuervos introuvable.");
        return;
    }

    console.log(`🟢 Serveur trouvé : ${guild.name}`);

    // Commandes
    const commands = [
        new SlashCommandBuilder()
            .setName("setup")
            .setDescription("Configure le serveur Cuervos")
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator.toString()
            ),

        new SlashCommandBuilder()
            .setName("reglement")
            .setDescription("Affiche le règlement Cuervos"),

        new SlashCommandBuilder()
            .setName("recrutement")
            .setDescription("Ouvre le formulaire de recrutement"),

        new SlashCommandBuilder()
            .setName("ticket")
            .setDescription("Ouvre un ticket privé")
    ].map(command => command.toJSON());

    const rest = new REST({ version: "10" })
        .setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, GUILD_ID),
            { body: commands }
        );

        console.log("🟢 Commandes Cuervos enregistrées.");
    } catch (error) {
        console.error("❌ Erreur commandes :", error);
    }
});

// =====================================================
// INTERACTIONS
// =====================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.guild) return;

    if (interaction.guild.id !== GUILD_ID) {
        if (interaction.isChatInputCommand()) {
            return interaction.reply({
                content: "❌ Ce bot est configuré pour le serveur Cuervos.",
                ephemeral: true
            });
        }

        return;
    }

    // =================================================
    // /SETUP
    // =================================================

    if (interaction.isChatInputCommand() && interaction.commandName === "setup") {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Tu dois être administrateur pour utiliser cette commande.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        // -----------------------------
        // RÔLES
        // -----------------------------

        const chef = await getOrCreateRole(
            guild,
            ROLE_NAMES.chef,
            [PermissionFlagsBits.Administrator]
        );

        const coleader = await getOrCreateRole(
            guild,
            ROLE_NAMES.coleader
        );

        const brasDroit = await getOrCreateRole(
            guild,
            ROLE_NAMES.brasDroit
        );

        const recruteur = await getOrCreateRole(
            guild,
            ROLE_NAMES.recruteur
        );

        const membre = await getOrCreateRole(
            guild,
            ROLE_NAMES.membre
        );

        const recrue = await getOrCreateRole(
            guild,
            ROLE_NAMES.recrue
        );

        // -----------------------------
        // CATÉGORIE INFORMATIONS
        // -----------------------------

        const informations = await getOrCreateCategory(
            guild,
            "📌 INFORMATIONS"
        );

        const reglement = await getOrCreateChannel(
            guild,
            "📜・reglement",
            informations
        );

        const annonces = await getOrCreateChannel(
            guild,
            "📢・annonces",
            informations
        );

        // -----------------------------
        // CATÉGORIE COMMUNAUTÉ
        // -----------------------------

        const communaute = await getOrCreateCategory(
            guild,
            "💬 COMMUNAUTÉ"
        );

        const discussion = await getOrCreateChannel(
            guild,
            "💬・discussion",
            communaute
        );

        // -----------------------------
        // CATÉGORIE RECRUTEMENT
        // -----------------------------

        const recrutement = await getOrCreateCategory(
            guild,
            "📋 RECRUTEMENT"
        );

        const recrutementChannel = await getOrCreateChannel(
            guild,
            "📋・recrutement",
            recrutement,
            [
                {
                    id: guild.roles.everyone.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ]
                },
                {
                    id: recruteur.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: chef.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: coleader.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                }
            ]
        );

        // -----------------------------
        // CATÉGORIE TICKETS
        // -----------------------------

        const tickets = await getOrCreateCategory(
            guild,
            "🎫 TICKETS"
        );

        // -----------------------------
        // CATÉGORIE STAFF
        // -----------------------------

        const staff = await getOrCreateCategory(
            guild,
            "🔒 STAFF",
            [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: chef.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: coleader.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: brasDroit.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: recruteur.id,
                    allow: [PermissionFlagsBits.ViewChannel]
                }
            ]
        );

        const staffChannel = await getOrCreateChannel(
            guild,
            "🔒・staff",
            staff
        );

        // -----------------------------
        // RÈGLEMENT
        // -----------------------------

        const reglementEmbed = new EmbedBuilder()
            .setTitle("🐦‍⬛ RÈGLEMENT — CUERVOS")
            .setDescription(
                [
                    "**1. Respect**",
                    "Respect obligatoire entre tous les membres.",
                    "",
                    "**2. Hiérarchie**",
                    "Les grades et responsabilités doivent être respectés.",
                    "",
                    "**3. Confidentialité**",
                    "Les informations internes de Cuervos restent dans les espaces prévus à cet effet.",
                    "",
                    "**4. Recrutement**",
                    "Toute personne souhaitant rejoindre Cuervos doit passer par le recrutement prévu.",
                    "",
                    "**5. Tickets**",
                    "Les tickets doivent être utilisés pour les demandes nécessitant l'intervention du staff.",
                    "",
                    "**6. Salons privés**",
                    "Les espaces réservés aux grades supérieurs ne doivent pas être partagés avec les personnes qui n'y ont pas accès.",
                    "",
                    "**7. Décisions du staff**",
                    "Les décisions de la direction concernant l'organisation interne doivent être respectées.",
                    "",
                    "**8. Sanctions**",
                    "Le non-respect du règlement peut entraîner un retrait de rôle ou une exclusion du serveur."
                ].join("\n")
            )
            .setFooter({
                text: "Cuervos • Organisation interne"
            });

        await reglement.send({
            embeds: [reglementEmbed]
        }).catch(() => {});

        // -----------------------------
        // GRADES
        // -----------------------------

        const gradesEmbed = new EmbedBuilder()
            .setTitle("🏷️ GRADES — CUERVOS")
            .setDescription(
                [
                    "👑 **Chef**",
                    "Direction générale et décisions principales.",
                    "",
                    "🥷 **Co-Leader**",
                    "Seconde la direction et supervise l'organisation.",
                    "",
                    "🛡️ **Bras Droit**",
                    "Responsable de la coordination et de la supervision.",
                    "",
                    "💼 **Recruteur**",
                    "S'occupe des candidatures et des recrutements.",
                    "",
                    "🐦‍⬛ **Membre**",
                    "Membre confirmé de Cuervos.",
                    "",
                    "🔰 **Recrue**",
                    "Nouvelle personne en période d'intégration."
                ].join("\n")
            );

        await annonces.send({
            embeds: [gradesEmbed]
        }).catch(() => {});

        await interaction.editReply(
            "✅ **Cuervos a été configuré !**\n\nRôles, salons, règlement et permissions ont été préparés."
        );
    }

    // =================================================
    // /REGLEMENT
    // =================================================

    if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "reglement"
    ) {
        const embed = new EmbedBuilder()
            .setTitle("🐦‍⬛ Règlement Cuervos")
            .setDescription(
                "Respect • Hiérarchie • Confidentialité • Organisation • Respect des espaces privés."
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: false
        });
    }

    // =================================================
    // /RECRUTEMENT
    // =================================================

    if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "recrutement"
    ) {

        const button = new ButtonBuilder()
            .setCustomId("ouvrir_recrutement")
            .setLabel("📋 Candidater")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle("📋 RECRUTEMENT CUERVOS")
            .setDescription(
                "Tu souhaites rejoindre Cuervos ?\n\nClique sur **Candidater** et remplis le formulaire."
            );

        return interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }

    // =================================================
    // /TICKET
    // =================================================

    if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "ticket"
    ) {

        const button = new ButtonBuilder()
            .setCustomId("ouvrir_ticket")
            .setLabel("🎫 Ouvrir un ticket")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle("🎫 SUPPORT CUERVOS")
            .setDescription(
                "Clique sur le bouton ci-dessous pour ouvrir un ticket privé."
            );

        return interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }

    // =================================================
    // BOUTON RECRUTEMENT
    // =================================================

    if (interaction.isButton() && interaction.customId === "ouvrir_recrutement") {

        const modal = new ModalBuilder()
            .setCustomId("formulaire_recrutement")
            .setTitle("📋 Recrutement Cuervos");

        const nom = new TextInputBuilder()
            .setCustomId("nom")
            .setLabel("Nom")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const prenom = new TextInputBuilder()
            .setCustomId("prenom")
            .setLabel("Prénom")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const age = new TextInputBuilder()
            .setCustomId("age")
            .setLabel("Âge")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const motivation = new TextInputBuilder()
            .setCustomId("motivation")
            .setLabel("Pourquoi rejoindre Cuervos ?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const experience = new TextInputBuilder()
            .setCustomId("experience")
            .setLabel("Expérience / parcours")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nom),
            new ActionRowBuilder().addComponents(prenom),
            new ActionRowBuilder().addComponents(age),
            new ActionRowBuilder().addComponents(motivation),
            new ActionRowBuilder().addComponents(experience)
        );

        return interaction.showModal(modal);
    }

    // =================================================
    // RÉSULTAT RECRUTEMENT
    // =================================================

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "formulaire_recrutement"
    ) {

        const nom = interaction.fields.getTextInputValue("nom");
        const prenom = interaction.fields.getTextInputValue("prenom");
        const age = interaction.fields.getTextInputValue("age");
        const motivation = interaction.fields.getTextInputValue("motivation");
        const experience =
            interaction.fields.getTextInputValue("experience") || "Non renseignée";

        const recruteurRole = interaction.guild.roles.cache.find(
            r => r.name === ROLE_NAMES.recruteur
        );

        const recrutementChannel = interaction.guild.channels.cache.find(
            c => c.name === "📋・recrutement"
        );

        if (recrutementChannel) {

            const embed = new EmbedBuilder()
                .setTitle("📋 NOUVELLE CANDIDATURE")
                .addFields(
                    {
                        name: "Nom",
                        value: nom
                    },
                    {
                        name: "Prénom",
                        value: prenom
                    },
                    {
                        name: "Âge",
                        value: age
                    },
                    {
                        name: "Motivation",
                        value: motivation
                    },
                    {
                        name: "Expérience",
                        value: experience
                    },
                    {
                        name: "Discord",
                        value: `${interaction.user}`
                    }
                )
                .setTimestamp();

            await recrutementChannel.send({
                content: recruteurRole
                    ? `<@&${recruteurRole.id}>`
                    : "",
                embeds: [embed]
            });
        }

        return interaction.reply({
            content: "✅ Ta candidature a été envoyée aux recruteurs.",
            ephemeral: true
        });
    }

    // =================================================
    // BOUTON TICKET
    // =================================================

    if (interaction.isButton() && interaction.customId === "ouvrir_ticket") {

        const guild = interaction.guild;

        const existing = guild.channels.cache.find(
            c =>
                c.name === `ticket-${interaction.user.username.toLowerCase()}` &&
                c.type === ChannelType.GuildText
        );

        if (existing) {
            return interaction.reply({
                content: `❌ Tu as déjà un ticket : ${existing}`,
                ephemeral: true
            });
        }

        const category = guild.channels.cache.find(
            c =>
                c.type === ChannelType.GuildCategory &&
                c.name === "🎫 TICKETS"
        );

        const chef = guild.roles.cache.find(
            r => r.name === ROLE_NAMES.chef
        );

        const coleader = guild.roles.cache.find(
            r => r.name === ROLE_NAMES.coleader
        );

        const recruteur = guild.roles.cache.find(
            r => r.name === ROLE_NAMES.recruteur
        );

        const overwrites = [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ];

        for (const role of [chef, coleader, recruteur]) {
            if (role) {
                overwrites.push({
                    id: role.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }
        }

        const channel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category ? category.id : null,
            permissionOverwrites: overwrites
        });

        const closeButton = new ButtonBuilder()
            .setCustomId("fermer_ticket")
            .setLabel("🔒 Fermer")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(closeButton);

        const embed = new EmbedBuilder()
            .setTitle("🎫 Ticket Cuervos")
            .setDescription(
                "Bienvenue.\n\nExplique clairement ta demande. Un membre autorisé du staff viendra te répondre."
            );

        await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [embed],
            components: [row]
        });

        return interaction.reply({
            content: `✅ Ton ticket a été créé : ${channel}`,
            ephemeral: true
        });
    }

    // =================================================
    // FERMETURE TICKET
    // =================================================

    if (interaction.isButton() && interaction.customId === "fermer_ticket") {

        const channel = interaction.channel;

        await interaction.reply({
            content: "🔒 Fermeture du ticket dans 5 secondes..."
        });

        setTimeout(async () => {
            await channel.delete().catch(() => {});
        }, 5000);
    }
});

// =====================================================
// CONNEXION
// =====================================================

client.login(process.env.DISCORD_TOKEN);
