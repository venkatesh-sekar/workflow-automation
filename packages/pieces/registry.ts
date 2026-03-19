import { Piece } from '@flow/pieces-framework'

// Core pieces
import { approval } from './core/approval/src'
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
import { manualTriggerPiece } from './core/manual-trigger/src'
import { math } from './core/math-helper/src'
import { PDF } from './core/pdf/src'
import { schedule } from './core/schedule/src'
import { ftpSftp } from './core/sftp/src'
import { smtp } from './core/smtp/src'
import { storage } from './core/store/src'
import { flows } from './core/subflows/src'
import { tables } from './core/tables/src'
import { textHelper } from './core/text-helper/src'
import { webhook } from './core/webhook/src'

// Community pieces
import { ai } from './community/ai/src'
import { confluence } from './community/confluence/src'
import { jiraCloud } from './community/jira-cloud/src'
import { mcp } from './community/mcp/src'
import { openai } from './community/openai/src'
import { postgres } from './community/postgres/src'
import { opentelemetry } from './community/opentelemetry/src'
import { slack } from './community/slack/src'

const allPieces: Piece[] = [
    // Core
    approval,
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
    manualTriggerPiece,
    math,
    PDF,
    schedule,
    ftpSftp,
    smtp,
    storage,
    flows,
    tables,
    textHelper,
    webhook,
    // Community
    ai,
    confluence,
    jiraCloud,
    mcp,
    openai,
    opentelemetry,
    postgres,
    slack,
]

export const pieceRegistry = new Map<string, Piece>(
    allPieces.map(p => [p.name, p])
)
