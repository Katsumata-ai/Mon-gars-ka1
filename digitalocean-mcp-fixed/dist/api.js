import fetch from 'node-fetch';
export class DigitalOceanAPI {
    baseUrl = 'https://api.digitalocean.com/v2';
    token;
    constructor(token) {
        this.token = token;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        const response = await fetch(url, {
            ...options,
            headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        return response.json();
    }
    async listApps(query = {}) {
        const params = new URLSearchParams();
        if (query.page)
            params.append('page', query.page.toString());
        if (query.per_page)
            params.append('per_page', query.per_page.toString());
        if (query.with_projects)
            params.append('with_projects', query.with_projects.toString());
        const queryString = params.toString();
        const endpoint = queryString ? `/apps?${queryString}` : '/apps';
        return this.request(endpoint);
    }
    async createApp(spec) {
        return this.request('/apps', {
            method: 'POST',
            body: JSON.stringify({ spec })
        });
    }
    async getApp(id) {
        return this.request(`/apps/${id}`);
    }
    async deleteApp(id) {
        return this.request(`/apps/${id}`, {
            method: 'DELETE'
        });
    }
    async listDeployments(appId, query = {}) {
        const params = new URLSearchParams();
        if (query.page)
            params.append('page', query.page.toString());
        if (query.per_page)
            params.append('per_page', query.per_page.toString());
        const queryString = params.toString();
        const endpoint = queryString ? `/apps/${appId}/deployments?${queryString}` : `/apps/${appId}/deployments`;
        return this.request(endpoint);
    }
    async createDeployment(appId, forceBuild = false) {
        return this.request(`/apps/${appId}/deployments`, {
            method: 'POST',
            body: JSON.stringify({ force_build: forceBuild })
        });
    }
    async getDeployment(appId, deploymentId) {
        return this.request(`/apps/${appId}/deployments/${deploymentId}`);
    }
    async getDeploymentLogs(appId, type, deploymentId) {
        const params = new URLSearchParams({ type });
        const endpoint = deploymentId
            ? `/apps/${appId}/deployments/${deploymentId}/logs?${params}`
            : `/apps/${appId}/logs?${params}`;
        return this.request(endpoint);
    }
    async listRegions() {
        return this.request('/apps/regions');
    }
    async listInstanceSizes() {
        return this.request('/apps/tiers/instance_sizes');
    }
}
//# sourceMappingURL=api.js.map