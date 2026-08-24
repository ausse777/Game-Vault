import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DlcForm } from '../components/DlcForm';
import { GameForm } from '../components/GameForm';
import { repository } from '../db/repository';
import type { DLC, Game, Platform, Tag } from '../models/types';
import { useToast } from '../context/ToastContext';

interface Props { games: Game[]; dlc: DLC[]; tags: Tag[]; platforms: Platform[]; reload: () => Promise<void>; }

export const GameDetailPage: React.FC<Props> = ({ games, dlc, tags, platforms, reload }) => {
  const { id } = useParams();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [showDlcForm, setShowDlcForm] = useState(false);
  const game = useMemo(() => {
    if (isCreate) return undefined;
    return games.find((g) => g.id === id);
  }, [games, id, isCreate]);


  const saveGame = async (payload: Pick<Game, 'title' | 'platforms' | 'tagIds' | 'customFields' | 'dateAdded'>) => {
    const now = Date.now();
    const record: Game = game
      ? { ...game, ...payload, updatedAt: now }
      : { id: uuidv4(), ...payload, updatedAt: now };
    await repository.saveGame(record);
    await reload();
    pushToast('Game saved', 'success');
    if (isCreate) navigate(`/game/${record.id}`);
  };

  const deleteGame = async () => {
    if (!game || !window.confirm('Delete this game and all DLC?')) return;
    await repository.deleteGame(game.id);
    await reload();
    pushToast('Game deleted', 'success');
    navigate('/');
  };

  const saveDlc = async (payload: Pick<DLC, 'title' | 'platforms' | 'tagIds' | 'customFields' | 'dateAdded'>) => {
    if (!game) return;
    const now = Date.now();
    const entry: DLC = { id: uuidv4(), gameId: game.id, ...payload, updatedAt: now };
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
      <GameForm initial={game} tags={tags} platforms={platforms} onSubmit={saveGame} />
      {game && <button className="danger" onClick={deleteGame}>Delete game</button>}

      {game && (
        <section className="stack">
          <h3>DLC</h3>
          <button onClick={() => setShowDlcForm((v) => !v)}>{showDlcForm ? 'Cancel' : 'Add DLC'}</button>
          {showDlcForm && <DlcForm tags={tags} platforms={platforms} onSubmit={saveDlc} />}
          {gameDlc.map((item) => <Link key={item.id} to={`/game/${game.id}/dlc/${item.id}`} className="card-link"><article className="card"><h4>{item.title}</h4><p>{item.platforms.join(', ') || 'No platforms selected'}</p><small>Added: {new Date(item.dateAdded).toLocaleDateString()}</small></article></Link>)}
        </section>
      )}
    </div>
  );
};
