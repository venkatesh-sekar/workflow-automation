import { createPiece, PieceAuth } from "@flow/pieces-framework";
import { createRecords } from "./lib/actions/create-records";
import { PieceCategory } from "@flow/shared";
import { deleteRecord } from "./lib/actions/delete-record";
import { updateRecord } from "./lib/actions/update-record";
import { getRecord } from "./lib/actions/get-record";
import { findRecords } from "./lib/actions/find-records";
import { clearTable } from "./lib/actions/clear-table";
import { newRecordTrigger } from "./lib/triggers/new-record";
import { deletedRecordTrigger } from "./lib/triggers/deleted-record";
import { updatedRecordTrigger } from "./lib/triggers/updated-record";

export const tables = createPiece({
  name: '@flow/piece-tables',
  version: '0.2.17',
  displayName: 'Tables',
  logoUrl: '/pieces/tables.svg',
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.80.0',
  authors: ['amrdb'],
  auth: PieceAuth.None(),
  actions: [createRecords, deleteRecord, updateRecord, getRecord, findRecords, clearTable],
  triggers: [newRecordTrigger, updatedRecordTrigger, deletedRecordTrigger],
});
