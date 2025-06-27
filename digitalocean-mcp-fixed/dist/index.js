#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { DigitalOceanAPI } from './api.js';
class DigitalOceanMCPServer {
    server;
    api;
    constructor() {
        const token = process.env.DIGITALOCEAN_API_TOKEN;
        if (!token) {
            throw new Error('DIGITALOCEAN_API_TOKEN environment variable is required');
        }
        this.api = new DigitalOceanAPI(token);
        this.server = new Server({
            name: 'digitalocean-mcp-fixed',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'list_apps',
                    description: 'Liste toutes les applications sur votre compte DigitalOcean',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            page: { type: 'number', description: 'Numéro de page' },
                            per_page: { type: 'number', description: 'Nombre d\'apps par page' },
                            with_projects: { type: 'boolean', description: 'Inclure les informations de projet' }
                        }
                    }
                },
                {
                    name: 'create_app',
                    description: 'Crée une nouvelle application sur DigitalOcean App Platform',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            spec: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', description: 'Nom de l\'application' },
                                    region: { type: 'string', description: 'Région (ex: nyc3, fra1)' },
                                    services: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                github: {
                                                    type: 'object',
                                                    properties: {
                                                        repo: { type: 'string', description: 'Repository GitHub (ex: user/repo)' },
                                                        branch: { type: 'string', description: 'Branche (défaut: main)' }
                                                    },
                                                    required: ['repo']
                                                },
                                                instance_size_slug: { type: 'string', description: 'Taille instance (ex: apps-s-1vcpu-1gb)' }
                                            },
                                            required: ['name']
                                        }
                                    },
                                    static_sites: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                github: {
                                                    type: 'object',
                                                    properties: {
                                                        repo: { type: 'string' },
                                                        branch: { type: 'string' }
                                                    },
                                                    required: ['repo']
                                                },
                                                build_command: { type: 'string' },
                                                output_dir: { type: 'string' }
                                            },
                                            required: ['name']
                                        }
                                    }
                                },
                                required: ['name']
                            }
                        },
                        required: ['spec']
                    }
                },
                {
                    name: 'get_app',
                    description: 'Récupère les détails d\'une application par son ID',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'ID de l\'application' }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'delete_app',
                    description: 'Supprime une application par son ID',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'ID de l\'application à supprimer' }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'list_deployments',
                    description: 'Liste tous les déploiements d\'une application',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: { type: 'string', description: 'ID de l\'application' },
                            page: { type: 'number' },
                            per_page: { type: 'number' }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'create_deployment',
                    description: 'Crée un nouveau déploiement pour une application',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: { type: 'string', description: 'ID de l\'application' },
                            force_build: { type: 'boolean', description: 'Forcer la reconstruction' }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'get_deployment',
                    description: 'Récupère les détails d\'un déploiement',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: { type: 'string', description: 'ID de l\'application' },
                            deployment_id: { type: 'string', description: 'ID du déploiement' }
                        },
                        required: ['app_id', 'deployment_id']
                    }
                },
                {
                    name: 'get_logs',
                    description: 'Récupère les logs d\'une application ou d\'un déploiement',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: { type: 'string', description: 'ID de l\'application' },
                            deployment_id: { type: 'string', description: 'ID du déploiement (optionnel)' },
                            type: {
                                type: 'string',
                                enum: ['BUILD', 'DEPLOY', 'RUN', 'RUN_RESTARTED'],
                                description: 'Type de logs'
                            }
                        },
                        required: ['app_id', 'type']
                    }
                },
                {
                    name: 'list_regions',
                    description: 'Liste toutes les régions disponibles pour App Platform',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'list_instance_sizes',
                    description: 'Liste toutes les tailles d\'instances disponibles',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'list_apps': {
                        const result = await this.api.listApps(args);
                        const apps = result.apps || [];
                        if (apps.length === 0) {
                            return {
                                content: [{ type: 'text', text: 'Aucune application trouvée sur votre compte.' }]
                            };
                        }
                        const appsList = apps.map((app) => `📱 **${app.spec.name}** (ID: ${app.id})\n` +
                            `   Région: ${app.spec.region || 'Non spécifiée'}\n` +
                            `   Statut: ${app.last_deployment_active_at ? '🟢 Actif' : '🔴 Inactif'}\n` +
                            `   Créé: ${new Date(app.created_at).toLocaleDateString('fr-FR')}\n`).join('\n');
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🚀 **Applications DigitalOcean** (${apps.length} trouvée(s))\n\n${appsList}`
                                }]
                        };
                    }
                    case 'create_app': {
                        const result = await this.api.createApp(args.spec);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `✅ **Application créée avec succès !**\n\n` +
                                        `📱 Nom: ${result.app.spec.name}\n` +
                                        `🆔 ID: ${result.app.id}\n` +
                                        `🌍 Région: ${result.app.spec.region}\n` +
                                        `📅 Créée: ${new Date(result.app.created_at).toLocaleString('fr-FR')}\n\n` +
                                        `🔗 URL: https://cloud.digitalocean.com/apps/${result.app.id}`
                                }]
                        };
                    }
                    case 'get_app': {
                        const result = await this.api.getApp(args.id);
                        const app = result.app;
                        return {
                            content: [{
                                    type: 'text',
                                    text: `📱 **Détails de l'application**\n\n` +
                                        `🏷️ Nom: ${app.spec.name}\n` +
                                        `🆔 ID: ${app.id}\n` +
                                        `🌍 Région: ${app.spec.region}\n` +
                                        `📅 Créée: ${new Date(app.created_at).toLocaleString('fr-FR')}\n` +
                                        `📅 Mise à jour: ${new Date(app.updated_at).toLocaleString('fr-FR')}\n` +
                                        `🔗 URL: ${app.live_url || 'Non disponible'}\n\n` +
                                        `**Configuration:**\n${JSON.stringify(app.spec, null, 2)}`
                                }]
                        };
                    }
                    case 'delete_app': {
                        await this.api.deleteApp(args.id);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🗑️ **Application supprimée avec succès !**\n\nL'application avec l'ID ${args.id} a été supprimée.`
                                }]
                        };
                    }
                    case 'list_deployments': {
                        const result = await this.api.listDeployments(args.app_id, args);
                        const deployments = result.deployments || [];
                        if (deployments.length === 0) {
                            return {
                                content: [{ type: 'text', text: 'Aucun déploiement trouvé pour cette application.' }]
                            };
                        }
                        const deploymentsList = deployments.map((deployment) => `🚀 **Déploiement ${deployment.id}**\n` +
                            `   Statut: ${this.getDeploymentStatusEmoji(deployment.phase)} ${deployment.phase}\n` +
                            `   Créé: ${new Date(deployment.created_at).toLocaleString('fr-FR')}\n` +
                            `   Mis à jour: ${new Date(deployment.updated_at).toLocaleString('fr-FR')}\n`).join('\n');
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🚀 **Déploiements** (${deployments.length} trouvé(s))\n\n${deploymentsList}`
                                }]
                        };
                    }
                    case 'create_deployment': {
                        const result = await this.api.createDeployment(args.app_id, args.force_build);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🚀 **Nouveau déploiement lancé !**\n\n` +
                                        `🆔 ID: ${result.deployment.id}\n` +
                                        `📱 App ID: ${args.app_id}\n` +
                                        `⚡ Force build: ${args.force_build ? 'Oui' : 'Non'}\n` +
                                        `📅 Créé: ${new Date(result.deployment.created_at).toLocaleString('fr-FR')}`
                                }]
                        };
                    }
                    case 'get_deployment': {
                        const result = await this.api.getDeployment(args.app_id, args.deployment_id);
                        const deployment = result.deployment;
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🚀 **Détails du déploiement**\n\n` +
                                        `🆔 ID: ${deployment.id}\n` +
                                        `📱 App ID: ${args.app_id}\n` +
                                        `📊 Statut: ${this.getDeploymentStatusEmoji(deployment.phase)} ${deployment.phase}\n` +
                                        `📅 Créé: ${new Date(deployment.created_at).toLocaleString('fr-FR')}\n` +
                                        `📅 Mis à jour: ${new Date(deployment.updated_at).toLocaleString('fr-FR')}\n\n` +
                                        `**Détails:**\n${JSON.stringify(deployment, null, 2)}`
                                }]
                        };
                    }
                    case 'get_logs': {
                        const result = await this.api.getDeploymentLogs(args.app_id, args.type, args.deployment_id);
                        if (result.live_url) {
                            // Télécharger les logs depuis l'URL
                            const response = await fetch(result.live_url);
                            const logs = await response.text();
                            return {
                                content: [{
                                        type: 'text',
                                        text: `📋 **Logs ${args.type}** pour l'application ${args.app_id}\n\n\`\`\`\n${logs}\n\`\`\``
                                    }]
                            };
                        }
                        else {
                            return {
                                content: [{
                                        type: 'text',
                                        text: `📋 **URL des logs ${args.type}**\n\n${JSON.stringify(result, null, 2)}`
                                    }]
                            };
                        }
                    }
                    case 'list_regions': {
                        const result = await this.api.listRegions();
                        const regions = result.regions || [];
                        const regionsList = regions.map((region) => `🌍 **${region.label}** (${region.slug})\n` +
                            `   Continent: ${region.continent}\n` +
                            `   Par défaut: ${region.default ? 'Oui' : 'Non'}\n` +
                            `   Disponible: ${region.disabled ? 'Non' : 'Oui'}\n`).join('\n');
                        return {
                            content: [{
                                    type: 'text',
                                    text: `🌍 **Régions disponibles** (${regions.length})\n\n${regionsList}`
                                }]
                        };
                    }
                    case 'list_instance_sizes': {
                        const result = await this.api.listInstanceSizes();
                        const sizes = result.instance_sizes || [];
                        const sizesList = sizes.map((size) => `💻 **${size.slug}**\n` +
                            `   CPU: ${size.cpu_type} ${size.cpus}\n` +
                            `   RAM: ${size.memory_bytes / (1024 * 1024 * 1024)}GB\n` +
                            `   Prix: $${size.usd_per_month}/mois\n`).join('\n');
                        return {
                            content: [{
                                    type: 'text',
                                    text: `💻 **Tailles d'instances disponibles** (${sizes.length})\n\n${sizesList}`
                                }]
                        };
                    }
                    default:
                        return {
                            content: [{ type: 'text', text: `Outil inconnu: ${name}` }],
                            isError: true
                        };
                }
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ **Erreur lors de l'exécution de ${name}:**\n\n${error instanceof Error ? error.message : String(error)}`
                        }],
                    isError: true
                };
            }
        });
    }
    getDeploymentStatusEmoji(phase) {
        switch (phase?.toLowerCase()) {
            case 'active': return '🟢';
            case 'building': return '🔨';
            case 'deploying': return '🚀';
            case 'pending': return '⏳';
            case 'error': return '❌';
            case 'canceled': return '⏹️';
            default: return '⚪';
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 Serveur MCP DigitalOcean démarré avec succès !');
    }
}
async function main() {
    try {
        const server = new DigitalOceanMCPServer();
        await server.run();
    }
    catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map