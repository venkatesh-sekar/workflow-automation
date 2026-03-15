import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { FlowId } from '../../core/common/id-generator'

export enum KeyAlgorithm {
    RSA = 'RSA',
}

export type SigningKeyId = FlowId

export const SigningKey = z.object({
    ...BaseModelSchema,
    platformId: FlowId,
    publicKey: z.string(),
    displayName: z.string(),
    /* algorithm used to generate this key pair */
    algorithm: z.nativeEnum(KeyAlgorithm),
})

export type SigningKey = z.infer<typeof SigningKey>
