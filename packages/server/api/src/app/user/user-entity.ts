import { Project, User, UserBadge, UserIdentity } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type UserSchema = User & {
    projects: Project[]
    identity: UserIdentity
    badges: UserBadge[]
}

export const UserEntity = new EntitySchema<UserSchema>({
    name: 'user',
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
            nullable: false,
        },
        firstName: {
            type: String,
            nullable: false,
        },
        lastName: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
        },
        platformRole: {
            type: String,
            nullable: false,
        },
        verified: {
            type: Boolean,
            default: true,
        },
        tokenVersion: {
            type: String,
            nullable: true,
        },
        identityId: {
            type: String,
            nullable: false,
        },
        externalId: {
            type: String,
            nullable: true,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        lastActiveDate: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_user_platform_id_identity_id',
            columns: ['platformId', 'identityId'],
            unique: true,
        },
        {
            name: 'idx_user_platform_id_email',
            columns: ['platformId', 'email'],
            unique: true,
        },
        {
            name: 'idx_user_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            unique: true,
        },
    ],
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'project',
            inverseSide: 'owner',
        },
        identity: {
            type: 'many-to-one',
            target: 'user_identity',
            joinColumn: {
                name: 'identityId',
                referencedColumnName: 'id',
            },
        },
        badges: {
            type: 'one-to-many',
            target: 'user_badge',
            inverseSide: 'user',
        },
    },
})
