export declare class DigitalOceanAPI {
    private baseUrl;
    private token;
    constructor(token: string);
    private request;
    listApps(query?: any): Promise<unknown>;
    createApp(spec: any): Promise<unknown>;
    getApp(id: string): Promise<unknown>;
    deleteApp(id: string): Promise<unknown>;
    listDeployments(appId: string, query?: any): Promise<unknown>;
    createDeployment(appId: string, forceBuild?: boolean): Promise<unknown>;
    getDeployment(appId: string, deploymentId: string): Promise<unknown>;
    getDeploymentLogs(appId: string, type: string, deploymentId?: string): Promise<unknown>;
    listRegions(): Promise<unknown>;
    listInstanceSizes(): Promise<unknown>;
}
//# sourceMappingURL=api.d.ts.map