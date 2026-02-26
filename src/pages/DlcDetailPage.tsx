import { Link, useNavigate, useParams } from 'react-router-dom';
import { DlcForm } from '../components/DlcForm';
import { repository } from '../db/repository';
import type { DLC, Tag } from '../models/types';
import { useToast } from '../context/ToastContext';

interface Props { dlc: DLC[]; tags: Tag[]; reload: () => Promise<void>; }

export const DlcDetailPage: React.FC<Props> = ({ dlc, tags, reload }) => {
  const { id, dlcId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const item = dlc.find((entry) => entry.id === dlcId && entry.gameId === id);

  if (!item) return <p>DLC not found.</p>;

  const save = async (payload: Pick<DLC, 'title' | 'tagIds' | 'customFields'>) => {
    await repository.saveDlc({ ...item, ...payload, updatedAt: Date.now() });
    await reload();
    pushToast('DLC saved', 'success');
  };

  const remove = async () => {
    if (!window.confirm('Delete this DLC?')) return;
    await repository.deleteDlc(item.id);
    await reload();
    pushToast('DLC deleted', 'success');
    navigate(`/game/${item.gameId}`);
  };

  return (
    <div className="stack">
      <Link to={`/game/${item.gameId}`}>← Back to game</Link>
      <h2>Edit DLC</h2>
      <DlcForm initial={item} tags={tags} onSubmit={save} />
      <button className="danger" onClick={remove}>Delete DLC</button>
    </div>
  );
};
