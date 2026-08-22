'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Cell } from './minesweeper-assets';
import {
  boardAtom,
  minesweeperStatsAtom,
  resetBoardAtom,
  revealCellAtom,
  toggleFlagAtom,
  type Cell as BoardCell,
  type GameStatus,
} from './minesweeper-utils';

const ICONS = {
  flag: '🚩',
  mine: '💣',
} as const;

const STATUS_LABEL: Record<GameStatus, string> = {
  idle: 'Ready',
  playing: 'Playing',
  won: 'You won',
  lost: 'Game over',
};

export default function Minesweeper(){
  const board = useAtomValue(boardAtom);
  const stats = useAtomValue(minesweeperStatsAtom);
  const resetBoard = useSetAtom(resetBoardAtom);

  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <div className="grid place-items-center h-full w-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 px-1 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Flags {stats.flagsRemaining}</span>
            <span>{STATUS_LABEL[stats.status]}</span>
          </div>
          <div className="flex flex-col gap-1">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((cell, colIndex) => (
                  <MinesweeperCell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    cell={cell}
                    isLocked={stats.status === 'won' || stats.status === 'lost'}
                  />
                ))}
              </div>
            ))}
          </div>
          <Button onClick={() => resetBoard()}>{stats.hasWon || stats.hasLost ? 'Play Again' : 'Reset'}</Button>
        </div>
      </div>
    </section>
  );
};

const MinesweeperCell = ({
  row,
  col,
  cell,
  isLocked,
}: {
  row: number;
  col: number;
  cell: BoardCell;
  isLocked: boolean;
}) => {
  const revealCell = useSetAtom(revealCellAtom);
  const flagCell = useSetAtom(toggleFlagAtom);

  const handleClick = () => {
    if (isLocked) {
      return;
    }
    revealCell({ row, col });
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLocked) {
      return;
    }
    flagCell({ row, col });
  };

  return (
    <Cell isSelected={cell.revealed} onClick={handleClick} onContextMenu={handleContextMenu}>
      <CellContent cell={cell} />
    </Cell>
  );
};

const CellContent = ({ cell }: { cell: BoardCell }) => {
  if (cell.flagged && !cell.revealed) {
    return ICONS.flag;
  }

  if (!cell.revealed) {
    return null;
  }

  if (cell.value === 'mine') {
    return ICONS.mine;
  }

  if (cell.value === 0) {
    return null;
  }

  return cell.value;
};
