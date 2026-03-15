import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_LENGTH = 21

export const FlowId = z.string().regex(new RegExp(`^[0-9a-zA-Z]{${ID_LENGTH}}$`))

export type FlowId = z.infer<typeof FlowId>

export const flowId = customAlphabet(ALPHABET, ID_LENGTH)

export const secureFlowId = (length: number) => customAlphabet(ALPHABET, length)()
