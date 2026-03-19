import { Piece } from '@flow/pieces-framework'

import { ai } from './core/ai/src'
import { approval } from './core/approval/src'
import { confluence } from './core/confluence/src'
import { connections } from './core/connections/src'
import { csv } from './core/csv/src'
import { dataMapper } from './core/data-mapper/src'
import { dataSummarizer } from './core/data-summarizer/src'
import { utilityDate } from './core/date-helper/src'
import { delay } from './core/delay/src'
import { filesHelper } from './core/file-helper/src'
import { forms } from './core/forms/src'
import { graphql } from './core/graphql/src'
import { http } from './core/http/src'
import { imageHelper } from './core/image-helper/src'
import { jiraCloud } from './core/jira-cloud/src'
import { manualTriggerPiece } from './core/manual-trigger/src'
import { math } from './core/math-helper/src'
import { mcp } from './core/mcp/src'
import { openai } from './core/openai/src'
import { opentelemetry } from './core/opentelemetry/src'
import { PDF } from './core/pdf/src'
import { postgres } from './core/postgres/src'
import { schedule } from './core/schedule/src'
import { ftpSftp } from './core/sftp/src'
import { slack } from './core/slack/src'
import { smtp } from './core/smtp/src'
import { storage } from './core/store/src'
import { flows } from './core/subflows/src'
import { tables } from './core/tables/src'
import { textHelper } from './core/text-helper/src'
import { userAuth } from './core/user-auth/src'
import { webhook } from './core/webhook/src'

const allPieces: Piece[] = [
    ai,
    approval,
    confluence,
    connections,
    csv,
    dataMapper,
    dataSummarizer,
    utilityDate,
    delay,
    filesHelper,
    forms,
    graphql,
    http,
    imageHelper,
    jiraCloud,
    manualTriggerPiece,
    math,
    mcp,
    openai,
    opentelemetry,
    PDF,
    postgres,
    schedule,
    ftpSftp,
    slack,
    smtp,
    storage,
    flows,
    tables,
    textHelper,
    userAuth,
    webhook,
]

export const pieceRegistry = new Map<string, Piece>(
    allPieces.map(p => [p.name, p])
)
