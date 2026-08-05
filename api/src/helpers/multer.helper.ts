import e from 'express';
import multer from 'multer';
import config from '../config/config';
import { ALL_FILE_TYPES, FileType } from '../domain/entities/types/storage.types';
import { ErrorBadRequest } from './error.helper';

const ACCEPTED_IMAGE_TYPES = config.storage.acceptedImageTypes;
const ACCEPTED_VIDEO_TYPES = config.storage.acceptedVideoTypes;
const ACCEPTED_PDF_TYPES = config.storage.acceptedPdfTypes;
const ACCEPTED_PPT_TYPES = config.storage.acceptedPptTypes;

export default function uploadFile(
  maxSize: number | undefined,
  fileType: FileType[] = ALL_FILE_TYPES,
) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter(_req: e.Request, file: Express.Multer.File, callback: Function) {
      if (fileType.includes(FileType.PDF) && file.mimetype.includes('/pdf'))
        handlePdfRequest(file, callback);
      else if (fileType.includes(FileType.VIDEO) && file.mimetype.includes('video/'))
        handleVideoRequest(file, callback);
      else if (fileType.includes(FileType.IMAGE) && file.mimetype.includes('image/'))
        handleImageRequest(file, callback);
      else if (fileType.includes(FileType.PPT) && file.mimetype.includes('.presentation'))
        handlePptRequest(file, callback);
      else callback(new ErrorBadRequest(`Hanya menerima file ${fileType.join(', ')}.`), false);
    },
  });
}

function handlePptRequest(file: Express.Multer.File, callback: Function) {
  if (ACCEPTED_PPT_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ErrorBadRequest('Hanya menerima format ppt.'), false);
  }
}

function handlePdfRequest(file: Express.Multer.File, callback: Function) {
  if (ACCEPTED_PDF_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ErrorBadRequest('Hanya menerima format pdf.'), false);
  }
}

function handleVideoRequest(file: Express.Multer.File, callback: Function) {
  if (ACCEPTED_VIDEO_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ErrorBadRequest('Hanya menerima format video mp4.'), false);
  }
}

function handleImageRequest(file: Express.Multer.File, callback: Function) {
  if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ErrorBadRequest('Hanya menerima format gambar jpg, jpeg, atau png.'), false);
  }
}

export function getFileExtension(filename: string) {
  const ext = filename.split('.').pop();
  return ext && ext !== filename ? ext.toLowerCase() : '';
}
