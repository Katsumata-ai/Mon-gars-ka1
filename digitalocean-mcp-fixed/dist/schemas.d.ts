import { z } from 'zod';
export declare const AppSpecSchema: z.ZodObject<{
    name: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    services: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        source_dir: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodObject<{
            repo: z.ZodString;
            branch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            repo: string;
            branch: string;
        }, {
            repo: string;
            branch?: string | undefined;
        }>>;
        dockerfile_path: z.ZodOptional<z.ZodString>;
        build_command: z.ZodOptional<z.ZodString>;
        run_command: z.ZodOptional<z.ZodString>;
        environment_slug: z.ZodOptional<z.ZodString>;
        instance_count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        instance_size_slug: z.ZodOptional<z.ZodString>;
        routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            path: string;
        }, {
            path?: string | undefined;
        }>, "many">>;
        envs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            value: z.ZodString;
            scope: z.ZodOptional<z.ZodEnum<["RUN_TIME", "BUILD_TIME", "RUN_AND_BUILD_TIME"]>>;
        }, "strip", z.ZodTypeAny, {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }, {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        instance_count: number;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch: string;
        } | undefined;
        dockerfile_path?: string | undefined;
        build_command?: string | undefined;
        run_command?: string | undefined;
        environment_slug?: string | undefined;
        instance_size_slug?: string | undefined;
        routes?: {
            path: string;
        }[] | undefined;
        envs?: {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }[] | undefined;
    }, {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch?: string | undefined;
        } | undefined;
        dockerfile_path?: string | undefined;
        build_command?: string | undefined;
        run_command?: string | undefined;
        environment_slug?: string | undefined;
        instance_count?: number | undefined;
        instance_size_slug?: string | undefined;
        routes?: {
            path?: string | undefined;
        }[] | undefined;
        envs?: {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }[] | undefined;
    }>, "many">>;
    static_sites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        source_dir: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodObject<{
            repo: z.ZodString;
            branch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            repo: string;
            branch: string;
        }, {
            repo: string;
            branch?: string | undefined;
        }>>;
        build_command: z.ZodOptional<z.ZodString>;
        output_dir: z.ZodOptional<z.ZodString>;
        routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            path: string;
        }, {
            path?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch: string;
        } | undefined;
        build_command?: string | undefined;
        routes?: {
            path: string;
        }[] | undefined;
        output_dir?: string | undefined;
    }, {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch?: string | undefined;
        } | undefined;
        build_command?: string | undefined;
        routes?: {
            path?: string | undefined;
        }[] | undefined;
        output_dir?: string | undefined;
    }>, "many">>;
    databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        engine: z.ZodEnum<["PG", "MYSQL", "REDIS"]>;
        version: z.ZodOptional<z.ZodString>;
        production: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        engine: "PG" | "MYSQL" | "REDIS";
        production: boolean;
        version?: string | undefined;
    }, {
        name: string;
        engine: "PG" | "MYSQL" | "REDIS";
        version?: string | undefined;
        production?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    region?: string | undefined;
    services?: {
        name: string;
        instance_count: number;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch: string;
        } | undefined;
        dockerfile_path?: string | undefined;
        build_command?: string | undefined;
        run_command?: string | undefined;
        environment_slug?: string | undefined;
        instance_size_slug?: string | undefined;
        routes?: {
            path: string;
        }[] | undefined;
        envs?: {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }[] | undefined;
    }[] | undefined;
    static_sites?: {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch: string;
        } | undefined;
        build_command?: string | undefined;
        routes?: {
            path: string;
        }[] | undefined;
        output_dir?: string | undefined;
    }[] | undefined;
    databases?: {
        name: string;
        engine: "PG" | "MYSQL" | "REDIS";
        production: boolean;
        version?: string | undefined;
    }[] | undefined;
}, {
    name: string;
    region?: string | undefined;
    services?: {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch?: string | undefined;
        } | undefined;
        dockerfile_path?: string | undefined;
        build_command?: string | undefined;
        run_command?: string | undefined;
        environment_slug?: string | undefined;
        instance_count?: number | undefined;
        instance_size_slug?: string | undefined;
        routes?: {
            path?: string | undefined;
        }[] | undefined;
        envs?: {
            value: string;
            key: string;
            scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
        }[] | undefined;
    }[] | undefined;
    static_sites?: {
        name: string;
        source_dir?: string | undefined;
        github?: {
            repo: string;
            branch?: string | undefined;
        } | undefined;
        build_command?: string | undefined;
        routes?: {
            path?: string | undefined;
        }[] | undefined;
        output_dir?: string | undefined;
    }[] | undefined;
    databases?: {
        name: string;
        engine: "PG" | "MYSQL" | "REDIS";
        version?: string | undefined;
        production?: boolean | undefined;
    }[] | undefined;
}>;
export declare const CreateAppSchema: z.ZodObject<{
    spec: z.ZodObject<{
        name: z.ZodString;
        region: z.ZodOptional<z.ZodString>;
        services: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            source_dir: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodObject<{
                repo: z.ZodString;
                branch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                repo: string;
                branch: string;
            }, {
                repo: string;
                branch?: string | undefined;
            }>>;
            dockerfile_path: z.ZodOptional<z.ZodString>;
            build_command: z.ZodOptional<z.ZodString>;
            run_command: z.ZodOptional<z.ZodString>;
            environment_slug: z.ZodOptional<z.ZodString>;
            instance_count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            instance_size_slug: z.ZodOptional<z.ZodString>;
            routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                path: string;
            }, {
                path?: string | undefined;
            }>, "many">>;
            envs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                key: z.ZodString;
                value: z.ZodString;
                scope: z.ZodOptional<z.ZodEnum<["RUN_TIME", "BUILD_TIME", "RUN_AND_BUILD_TIME"]>>;
            }, "strip", z.ZodTypeAny, {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }, {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            instance_count: number;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }, {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_count?: number | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }>, "many">>;
        static_sites: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            source_dir: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodObject<{
                repo: z.ZodString;
                branch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                repo: string;
                branch: string;
            }, {
                repo: string;
                branch?: string | undefined;
            }>>;
            build_command: z.ZodOptional<z.ZodString>;
            output_dir: z.ZodOptional<z.ZodString>;
            routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                path: string;
            }, {
                path?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            output_dir?: string | undefined;
        }, {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            output_dir?: string | undefined;
        }>, "many">>;
        databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            engine: z.ZodEnum<["PG", "MYSQL", "REDIS"]>;
            version: z.ZodOptional<z.ZodString>;
            production: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            production: boolean;
            version?: string | undefined;
        }, {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            version?: string | undefined;
            production?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        region?: string | undefined;
        services?: {
            name: string;
            instance_count: number;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }[] | undefined;
        static_sites?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            output_dir?: string | undefined;
        }[] | undefined;
        databases?: {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            production: boolean;
            version?: string | undefined;
        }[] | undefined;
    }, {
        name: string;
        region?: string | undefined;
        services?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_count?: number | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }[] | undefined;
        static_sites?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            output_dir?: string | undefined;
        }[] | undefined;
        databases?: {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            version?: string | undefined;
            production?: boolean | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    spec: {
        name: string;
        region?: string | undefined;
        services?: {
            name: string;
            instance_count: number;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }[] | undefined;
        static_sites?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch: string;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path: string;
            }[] | undefined;
            output_dir?: string | undefined;
        }[] | undefined;
        databases?: {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            production: boolean;
            version?: string | undefined;
        }[] | undefined;
    };
}, {
    spec: {
        name: string;
        region?: string | undefined;
        services?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            dockerfile_path?: string | undefined;
            build_command?: string | undefined;
            run_command?: string | undefined;
            environment_slug?: string | undefined;
            instance_count?: number | undefined;
            instance_size_slug?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            envs?: {
                value: string;
                key: string;
                scope?: "RUN_TIME" | "BUILD_TIME" | "RUN_AND_BUILD_TIME" | undefined;
            }[] | undefined;
        }[] | undefined;
        static_sites?: {
            name: string;
            source_dir?: string | undefined;
            github?: {
                repo: string;
                branch?: string | undefined;
            } | undefined;
            build_command?: string | undefined;
            routes?: {
                path?: string | undefined;
            }[] | undefined;
            output_dir?: string | undefined;
        }[] | undefined;
        databases?: {
            name: string;
            engine: "PG" | "MYSQL" | "REDIS";
            version?: string | undefined;
            production?: boolean | undefined;
        }[] | undefined;
    };
}>;
export declare const ListAppsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    with_projects: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    per_page?: number | undefined;
    with_projects?: boolean | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    with_projects?: boolean | undefined;
}>;
export declare const GetAppSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const DeleteAppSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const ListDeploymentsSchema: z.ZodObject<{
    app_id: z.ZodString;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    app_id: string;
    page?: number | undefined;
    per_page?: number | undefined;
}, {
    app_id: string;
    page?: number | undefined;
    per_page?: number | undefined;
}>;
export declare const CreateDeploymentSchema: z.ZodObject<{
    app_id: z.ZodString;
    force_build: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    app_id: string;
    force_build: boolean;
}, {
    app_id: string;
    force_build?: boolean | undefined;
}>;
export declare const GetDeploymentSchema: z.ZodObject<{
    app_id: z.ZodString;
    deployment_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    app_id: string;
    deployment_id: string;
}, {
    app_id: string;
    deployment_id: string;
}>;
export declare const GetLogsSchema: z.ZodObject<{
    app_id: z.ZodString;
    deployment_id: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["BUILD", "DEPLOY", "RUN", "RUN_RESTARTED"]>;
}, "strip", z.ZodTypeAny, {
    type: "BUILD" | "DEPLOY" | "RUN" | "RUN_RESTARTED";
    app_id: string;
    deployment_id?: string | undefined;
}, {
    type: "BUILD" | "DEPLOY" | "RUN" | "RUN_RESTARTED";
    app_id: string;
    deployment_id?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map