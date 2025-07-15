import { UnoCard, UnoColor, Player, GameState, GameAction } from '../types/uno';

// Create a standard UNO deck
export function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue'];
  
  // Number cards (0-9)
  colors.forEach(color => {
    // One 0 card per color
    deck.push({
      id: `${color}-0-${Math.random()}`,
      type: 'number',
      color,
      value: 0
    });
    
    // Two of each number 1-9 per color
    for (let num = 1; num <= 9; num++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${num}-${copy}-${Math.random()}`,
          type: 'number',
          color,
          value: num
        });
      }
    }
    
    // Action cards (2 of each per color)
    const actions = ['skip', 'reverse', 'draw_two'];
    actions.forEach(action => {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${action}-${copy}-${Math.random()}`,
          type: 'action',
          color,
          value: action as any
        });
      }
    });
  });
  
  // Wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild-${i}-${Math.random()}`,
      type: 'wild',
      color: null,
      value: 'wild'
    });
    
    deck.push({
      id: `wild-draw-four-${i}-${Math.random()}`,
      type: 'wild',
      color: null,
      value: 'wild_draw_four'
    });
  }
  
  return shuffleDeck(deck);
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize game with given number of players
export function initializeGame(playerCount: number): GameState {
  const deck = createDeck();
  const players: Player[] = [];
  
  // Create players
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`,
      hand: []
    });
  }
  
  // Deal 7 cards to each player
  let cardIndex = 0;
  for (let round = 0; round < 7; round++) {
    for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
      players[playerIndex].hand.push(deck[cardIndex++]);
    }
  }
  
  // Find first valid starting card (not Wild Draw Four)
  let startCardIndex = cardIndex;
  while (deck[startCardIndex].value === 'wild_draw_four') {
    startCardIndex++;
  }
  
  // Move start card to end and use it
  const startCard = deck[startCardIndex];
  deck.splice(startCardIndex, 1);
  
  // Remaining cards form draw pile
  const drawPile = deck.slice(cardIndex);
  const discardPile = [startCard];
  
  return {
    players,
    currentPlayerIndex: 0,
    direction: 1,
    drawPile,
    discardPile,
    gameStatus: 'playing',
    winner: null,
    pendingColorChoice: false,
    lastAction: `Game started with ${startCard.color} ${startCard.value}`,
    skipNext: false,
    drawNext: 0
  };
}

// Check if a card can be played on the current top card
export function canPlayCard(card: UnoCard, topCard: UnoCard, gameState: GameState): boolean {
  // Wild cards can always be played
  if (card.type === 'wild') {
    // Wild Draw Four can only be played if no other card is playable
    if (card.value === 'wild_draw_four') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const otherPlayableCards = currentPlayer.hand.filter(c => 
        c.id !== card.id && canPlayNonWildCard(c, topCard)
      );
      return otherPlayableCards.length === 0;
    }
    return true;
  }
  
  return canPlayNonWildCard(card, topCard);
}

function canPlayNonWildCard(card: UnoCard, topCard: UnoCard): boolean {
  // Match color
  if (card.color === topCard.color) return true;
  
  // Match value (number or action)
  if (card.value === topCard.value) return true;
  
  return false;
}

// AI decision logic - chooses best card to play
export function chooseCardToPlay(player: Player, topCard: UnoCard, gameState: GameState): UnoCard | null {
  const playableCards = player.hand.filter(card => canPlayCard(card, topCard, gameState));
  
  if (playableCards.length === 0) return null;
  
  // Priority 1: Pest cards (strongest actions)
  const pestCards = playableCards.filter(card => 
    card.value === 'wild_draw_four' || 
    card.value === 'draw_two' || 
    card.value === 'skip' || 
    card.value === 'reverse' ||
    card.value === 'wild'
  );
  
  if (pestCards.length > 0) {
    // Sort by priority: wild_draw_four > draw_two > skip > reverse > wild
    const priority = { wild_draw_four: 5, draw_two: 4, skip: 3, reverse: 2, wild: 1 };
    pestCards.sort((a, b) => (priority[b.value as keyof typeof priority] || 0) - (priority[a.value as keyof typeof priority] || 0));
    return pestCards[0];
  }
  
  // Priority 2: Highest numbered cards
  const numberCards = playableCards.filter(card => card.type === 'number');
  if (numberCards.length > 0) {
    numberCards.sort((a, b) => (b.value as number) - (a.value as number));
    return numberCards[0];
  }
  
  // Priority 3: Cards of the color the player has most of
  const colorCounts: Record<UnoColor, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  player.hand.forEach(card => {
    if (card.color) colorCounts[card.color]++;
  });
  
  const mostCommonColor = Object.entries(colorCounts)
    .sort(([,a], [,b]) => b - a)[0][0] as UnoColor;
  
  const colorCards = playableCards.filter(card => card.color === mostCommonColor);
  if (colorCards.length > 0) return colorCards[0];
  
  // Fallback: any playable card
  return playableCards[0];
}

// AI chooses color for wild cards
export function chooseWildColor(player: Player): UnoColor {
  const colorCounts: Record<UnoColor, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  
  player.hand.forEach(card => {
    if (card.color) colorCounts[card.color]++;
  });
  
  // Choose the color the player has most of
  return Object.entries(colorCounts)
    .sort(([,a], [,b]) => b - a)[0][0] as UnoColor;
}

// Execute a game action
export function executeAction(gameState: GameState, action: GameAction): GameState {
  const newState = { ...gameState };
  const currentPlayer = newState.players[newState.currentPlayerIndex];
  
  if (action.type === 'play_card' && action.card) {
    // Remove card from player's hand
    currentPlayer.hand = currentPlayer.hand.filter(c => c.id !== action.card!.id);
    
    // Add card to discard pile
    newState.discardPile.push(action.card);
    
    // Handle special effects
    if (action.card.type === 'action') {
      switch (action.card.value) {
        case 'skip':
          newState.skipNext = true;
          newState.lastAction = `${currentPlayer.name} played Skip`;
          break;
        case 'reverse':
          newState.direction *= -1;
          newState.lastAction = `${currentPlayer.name} played Reverse`;
          break;
        case 'draw_two':
          newState.drawNext = 2;
          newState.lastAction = `${currentPlayer.name} played Draw Two`;
          break;
      }
    } else if (action.card.type === 'wild') {
      if (action.card.value === 'wild_draw_four') {
        newState.drawNext = 4;
        newState.lastAction = `${currentPlayer.name} played Wild Draw Four`;
      } else {
        newState.lastAction = `${currentPlayer.name} played Wild`;
      }
      newState.pendingColorChoice = true;
      return newState; // Don't advance turn yet
    } else {
      newState.lastAction = `${currentPlayer.name} played ${action.card.color} ${action.card.value}`;
    }
    
    // Check for winner
    if (currentPlayer.hand.length === 0) {
      newState.gameStatus = 'finished';
      newState.winner = currentPlayer.name;
      newState.lastAction += ` - ${currentPlayer.name} wins!`;
      return newState;
    }
  } else if (action.type === 'draw_card') {
    // Draw card from pile
    if (newState.drawPile.length > 0) {
      const drawnCard = newState.drawPile.pop()!;
      currentPlayer.hand.push(drawnCard);
      newState.lastAction = `${currentPlayer.name} drew a card`;
      
      // Check if drawn card can be played
      const topCard = newState.discardPile[newState.discardPile.length - 1];
      if (canPlayCard(drawnCard, topCard, newState)) {
        // AI immediately plays if possible
        const playAction: GameAction = {
          type: 'play_card',
          playerId: currentPlayer.id,
          card: drawnCard
        };
        return executeAction(newState, playAction);
      }
    }
  } else if (action.type === 'choose_color' && action.chosenColor) {
    // Set the color of the top wild card
    const topCard = newState.discardPile[newState.discardPile.length - 1];
    topCard.color = action.chosenColor;
    newState.pendingColorChoice = false;
    newState.lastAction += ` and chose ${action.chosenColor}`;
  }
  
  // Advance to next player
  advanceToNextPlayer(newState);
  
  return newState;
}

function advanceToNextPlayer(gameState: GameState): void {
  const playerCount = gameState.players.length;
  
  // Handle draw effects
  if (gameState.drawNext > 0) {
    const nextPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
    const nextPlayer = gameState.players[nextPlayerIndex];
    
    // Draw cards
    for (let i = 0; i < gameState.drawNext; i++) {
      if (gameState.drawPile.length > 0) {
        nextPlayer.hand.push(gameState.drawPile.pop()!);
      }
    }
    
    gameState.lastAction += ` - ${nextPlayer.name} draws ${gameState.drawNext} cards and is skipped`;
    gameState.drawNext = 0;
    
    // Skip the next player
    gameState.currentPlayerIndex = (nextPlayerIndex + gameState.direction + playerCount) % playerCount;
    return;
  }
  
  // Handle skip
  if (gameState.skipNext) {
    const skippedPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
    const skippedPlayer = gameState.players[skippedPlayerIndex];
    gameState.lastAction += ` - ${skippedPlayer.name} is skipped`;
    gameState.skipNext = false;
    
    // Move to player after skipped player
    gameState.currentPlayerIndex = (skippedPlayerIndex + gameState.direction + playerCount) % playerCount;
    return;
  }
  
  // Normal advance
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
}

// Process one turn for the current AI player
export function processAITurn(gameState: GameState): GameState {
  if (gameState.gameStatus !== 'playing') return gameState;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  // Handle pending color choice
  if (gameState.pendingColorChoice) {
    const chosenColor = chooseWildColor(currentPlayer);
    return executeAction(gameState, {
      type: 'choose_color',
      playerId: currentPlayer.id,
      chosenColor
    });
  }
  
  // Try to play a card
  const cardToPlay = chooseCardToPlay(currentPlayer, topCard, gameState);
  
  if (cardToPlay) {
    return executeAction(gameState, {
      type: 'play_card',
      playerId: currentPlayer.id,
      card: cardToPlay
    });
  } else {
    // Draw a card
    return executeAction(gameState, {
      type: 'draw_card',
      playerId: currentPlayer.id
    });
  }
}