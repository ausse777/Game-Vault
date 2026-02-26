import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DlcForm } from '../components/DlcForm';
import { GameForm } from '../components/GameForm';
import { repository } from '../db/repository';
import type { DLC, Game, Tag } from '../models/types';
import { useToast } from '../context/ToastContext';

interface Props { games: Game[]; dlc: DLC[]; tags: Tag[]; reload: () => Promise<void>; }

export const GameDetailPage: React.FC<Props> = ({ games, dlc, tags, reload }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [showDlcForm, setShowDlcForm] = useState(false);
  const game = useMemo(() => games.find((g) => g.id === id), [games, id]);

  if (!id) return <p>Missing game id.</p>;

  const saveGame = async (payload: Pick<Game, 'title' | 'platforms' | 'tagIds' | 'customFields'>) => {
    const now = Date.now();
    const record: Game = game
      ? { ...game, ...payload, updatedAt: now }
      : { id: uuidv4(), ...payload, dateAdded: now, updatedAt: now };
    await repository.saveGame(record);
    await reload();
    pushToast('Game saved', 'success');
    if (!game) navigate(`/game/${record.id}`);
  };

  const deleteGame = async () => {
    if (!game || !window.confirm('Delete this game and all DLC?')) return;
    await repository.deleteGame(game.id);
    await reload();
    pushToast('Game deleted', 'success');
    navigate('/');
  };

  const saveDlc = async (payload: Pick<DLC, 'title' | 'tagIds' | 'customFields'>) => {
    if (!game) return;
    const now = Date.now();
    const entry: DLC = { id: uuidv4(), gameId: game.id, ...payload, dateAdded: now, updatedAt: now };
    await repository.saveDlc(entry);
    await reload();
    setShowDlcForm(false);
    pushToast('DLC added', 'success');
  };

  const gameDlc = dlc.filter((item) => item.gameId === game?.id);

  return (
    <div className="stack">
      <Link to="/">← Back to library</Link>
      <h2>{game ? `Edit ${game.title}` : 'Create game'}</h2>
      <GameForm initial={game} tags={tags} onSubmit={saveGame} />
      {game && <button className="danger" onClick={deleteGame}>Delete game</button>}

      {game && (
        <section className="stack">
          <h3>DLC</h3>
          <button onClick={() => setShowDlcForm((v) => !v)}>{showDlcForm ? 'Cancel' : 'Add DLC'}</button>
          {showDlcForm && <DlcForm tags={tags} onSubmit={saveDlc} />}
          {gameDlc.map((item) => <Link key={item.id} to={`/game/${game.id}/dlc/${item.id}`} className="card-link"><article className="card"><h4>{item.title}</h4></article></Link>)}
        </section>
      )}
    </div>
  );
};
