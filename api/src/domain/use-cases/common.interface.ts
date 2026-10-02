import PosDashboard from '@/use-cases/common/pos-dashboard';
import GeneratePresignUrl from '@/use-cases/common/upload-presign-url';

export interface CommonUseCase {
  posDashboard: PosDashboard;
  generatePresignUrl: GeneratePresignUrl;
}
