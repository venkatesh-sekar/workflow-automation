export interface SecretStore {
    save(platformId: string, connectionId: string, value: object): Promise<void>
    get(platformId: string, connectionId: string): Promise<object>
    delete(platformId: string, connectionId: string): Promise<void>
}
