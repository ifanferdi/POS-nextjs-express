import { FileType } from '../../../domain/entities/types/storage.types';

export function assetFile(fileType: FileType) {
  let file;

  switch (fileType) {
    case FileType.IMAGE:
      file =
        'https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U';
      break;
    case FileType.PDF:
      file = 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf';
      break;
    case FileType.PPT:
      file = 'https://www.dickinson.edu/download/downloads/id/1076/sample_powerpoint_slides.pptx';
      break;
    default:
      file = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }
  return file;
}
