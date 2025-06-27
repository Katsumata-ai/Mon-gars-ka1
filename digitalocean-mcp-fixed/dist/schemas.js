import { z } from 'zod';
// Schémas simplifiés pour éviter les références cassées
export const AppSpecSchema = z.object({
    name: z.string().describe("Nom de l'application"),
    region: z.string().optional().describe("Région de déploiement (ex: nyc3, fra1)"),
    services: z.array(z.object({
        name: z.string(),
        source_dir: z.string().optional(),
        github: z.object({
            repo: z.string(),
            branch: z.string().optional().default("main")
        }).optional(),
        dockerfile_path: z.string().optional(),
        build_command: z.string().optional(),
        run_command: z.string().optional(),
        environment_slug: z.string().optional().describe("Taille de l'instance (ex: apps-s-1vcpu-1gb)"),
        instance_count: z.number().optional().default(1),
        instance_size_slug: z.string().optional(),
        routes: z.array(z.object({
            path: z.string().optional().default("/")
        })).optional(),
        envs: z.array(z.object({
            key: z.string(),
            value: z.string(),
            scope: z.enum(["RUN_TIME", "BUILD_TIME", "RUN_AND_BUILD_TIME"]).optional()
        })).optional()
    })).optional(),
    static_sites: z.array(z.object({
        name: z.string(),
        source_dir: z.string().optional(),
        github: z.object({
            repo: z.string(),
            branch: z.string().optional().default("main")
        }).optional(),
        build_command: z.string().optional(),
        output_dir: z.string().optional(),
        routes: z.array(z.object({
            path: z.string().optional().default("/")
        })).optional()
    })).optional(),
    databases: z.array(z.object({
        name: z.string(),
        engine: z.enum(["PG", "MYSQL", "REDIS"]),
        version: z.string().optional(),
        production: z.boolean().optional().default(false)
    })).optional()
});
export const CreateAppSchema = z.object({
    spec: AppSpecSchema
});
export const ListAppsQuerySchema = z.object({
    page: z.number().optional(),
    per_page: z.number().optional(),
    with_projects: z.boolean().optional()
});
export const GetAppSchema = z.object({
    id: z.string().describe("ID de l'application")
});
export const DeleteAppSchema = z.object({
    id: z.string().describe("ID de l'application à supprimer")
});
export const ListDeploymentsSchema = z.object({
    app_id: z.string().describe("ID de l'application"),
    page: z.number().optional(),
    per_page: z.number().optional()
});
export const CreateDeploymentSchema = z.object({
    app_id: z.string().describe("ID de l'application"),
    force_build: z.boolean().optional().default(false)
});
export const GetDeploymentSchema = z.object({
    app_id: z.string().describe("ID de l'application"),
    deployment_id: z.string().describe("ID du déploiement")
});
export const GetLogsSchema = z.object({
    app_id: z.string().describe("ID de l'application"),
    deployment_id: z.string().optional().describe("ID du déploiement (optionnel)"),
    type: z.enum(["BUILD", "DEPLOY", "RUN", "RUN_RESTARTED"]).describe("Type de logs")
});
//# sourceMappingURL=schemas.js.map