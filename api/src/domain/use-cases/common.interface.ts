import Dashboard from '@/use-cases/common/dashboard';
import PosDashboard from '@/use-cases/common/pos-dashboard';

export interface CommonUseCase {
  dashboard: Dashboard;
  posDashboard: PosDashboard;
}
