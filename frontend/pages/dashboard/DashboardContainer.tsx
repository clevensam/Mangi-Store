import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';
import { DashboardPresenter } from './DashboardPresenter';

export function DashboardContainer() {
  const { lang, t } = useLanguage();
  const { data, loading } = useDashboard();
  const navigate = useNavigate();

  return (
    <DashboardPresenter
      lang={lang}
      t={t}
      data={data}
      loading={loading}
      onNavigate={(tab) => navigate(`/${tab}`)}
    />
  );
}
