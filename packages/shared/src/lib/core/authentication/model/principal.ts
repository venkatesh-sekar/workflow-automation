import type { PlatformId } from '../../../management/platform'
import type { ProjectId } from '../../../management/project'
import type { FlowId } from '../../common/id-generator'
import { PrincipalType } from './principal-type'

export type WorkerPrincipal = {
    id: FlowId
    type: PrincipalType.WORKER
}

export type AnnonymousPrincipal = {
    id: FlowId
    type: PrincipalType.UNKNOWN
}

export type ServicePrincipal = {
    id: FlowId
    type: PrincipalType.SERVICE
    platform: {
        id: FlowId
    }
}

export type UserPrincipal = {
    id: FlowId
    type: PrincipalType.USER
    platform: {
        id: FlowId
    }
    tokenVersion?: string
}

export type EnginePrincipal = {
    id: FlowId
    type: PrincipalType.ENGINE
    projectId: ProjectId
    platform: {
        id: PlatformId
    }
}


export type PrincipalForType<T extends PrincipalType> = Extract<Principal, { type: T }>

export type PrincipalForTypes<R extends readonly PrincipalType[]> = PrincipalForType<R[number]>

export type Principal =
    | WorkerPrincipal
    | AnnonymousPrincipal
    | ServicePrincipal
    | UserPrincipal
    | EnginePrincipal
