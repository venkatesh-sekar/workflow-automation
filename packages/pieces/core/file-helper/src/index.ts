import { createPiece, PieceAuth } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { readFileAction } from './lib/actions/read-file';
import { createFile } from './lib/actions/create-file';
import { changeFileEncoding } from './lib/actions/change-file-encoding';
import { checkFileType } from './lib/actions/check-file-type';
import { zipFiles } from './lib/actions/zip-files';
import { unzipFile } from './lib/actions/unzip-file';
import { getFileName } from './lib/actions/get-file-name';

export const filesHelper = createPiece({
  name: '@flow/piece-file-helper',
  version: '0.1.23',
  displayName: 'Files Helper',
  description: 'Read file content and return it in different formats.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: '/pieces/file-helper.svg',
  categories: [PieceCategory.CORE],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud', 'Seb-C', 'danielpoonwj'],
  actions: [
    readFileAction,
    createFile,
    changeFileEncoding,
    checkFileType,
    zipFiles,
    unzipFile,
    getFileName,
  ],
  triggers: [],
});
