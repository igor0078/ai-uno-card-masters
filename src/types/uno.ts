export type UnoColor = 'red' | 'yellow' | 'green' | 'blue';
export type UnoAction = 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';

export interface UnoCard {
  id: string;
  type: 'number' | 'action' | 'wild';
  color: UnoColor | null; // null for wild cards
  value: number | UnoAction | null; // number for number cards, action for action cards
}

export interface Player {
  id: string;
  name: string;
  hand: UnoCard[];
}

export interface GameAction {
  type: 'play_card' | 'draw_card' | 'choose_color';
  playerId: string;
  card?: UnoCard;
  chosenColor?: UnoColor;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 for clockwise, -1 for counter-clockwise
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  gameStatus: 'setup' | 'playing' | 'finished';
  winner: string | null;
  pendingColorChoice: boolean;
  lastAction: string;
  skipNext: boolean;
  drawNext: number; // 0, 2, or 4
}