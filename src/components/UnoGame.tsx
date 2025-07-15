import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { GameState, UnoCard } from '../types/uno';
import { initializeGame, processAITurn } from '../lib/unoGameLogic';

interface UnoGameProps {
  playerCount: number;
  onBack: () => void;
}

const UnoGame: React.FC<UnoGameProps> = ({ playerCount, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame(playerCount));
  const [isPlaying, setIsPlaying] = useState(false);
  const [turnSpeed, setTurnSpeed] = useState(2000); // 2 seconds between turns

  // Auto-advance turns when playing
  useEffect(() => {
    if (!isPlaying || gameState.gameStatus !== 'playing') return;

    const timer = setTimeout(() => {
      setGameState(currentState => processAITurn(currentState));
    }, turnSpeed);

    return () => clearTimeout(timer);
  }, [gameState, isPlaying, turnSpeed]);

  const handleManualNextTurn = () => {
    if (gameState.gameStatus === 'playing') {
      setGameState(processAITurn(gameState));
    }
  };

  const handleRestart = () => {
    setGameState(initializeGame(playerCount));
    setIsPlaying(false);
  };

  const getCardDisplay = (card: UnoCard): string => {
    if (card.type === 'wild') {
      return card.value === 'wild_draw_four' ? 'W+4' : 'Wild';
    }
    if (card.type === 'action') {
      const actionMap = { skip: 'Skip', reverse: 'Rev', draw_two: '+2' };
      return actionMap[card.value as keyof typeof actionMap] || card.value as string;
    }
    return card.value?.toString() || '';
  };

  const getCardColor = (card: UnoCard): string => {
    if (card.color === 'red') return 'bg-red-500 text-white';
    if (card.color === 'yellow') return 'bg-yellow-500 text-black';
    if (card.color === 'green') return 'bg-green-500 text-white';
    if (card.color === 'blue') return 'bg-blue-500 text-white';
    return 'bg-gray-800 text-white'; // wild cards
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onBack}>
            ← Back to Setup
          </Button>
          
          <div className="flex gap-4 items-center">
            <Button
              variant={isPlaying ? "secondary" : "default"}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={gameState.gameStatus !== 'playing'}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Auto Play'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleManualNextTurn}
              disabled={gameState.gameStatus !== 'playing' || isPlaying}
            >
              Next Turn
            </Button>
            
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>

        {/* Game Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Game Status</span>
              {gameState.gameStatus === 'playing' && (
                <Badge variant="default">
                  Turn: {currentPlayer.name}
                </Badge>
              )}
              {gameState.gameStatus === 'finished' && (
                <Badge variant="secondary">
                  Winner: {gameState.winner}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Discard Card */}
              <div className="text-center">
                <h3 className="font-semibold mb-2">Current Card</h3>
                <div className={`w-20 h-32 mx-auto rounded-lg flex items-center justify-center font-bold text-lg border-2 ${getCardColor(topCard)}`}>
                  {getCardDisplay(topCard)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {topCard.color} {getCardDisplay(topCard)}
                </p>
              </div>

              {/* Draw Pile */}
              <div className="text-center">
                <h3 className="font-semibold mb-2">Draw Pile</h3>
                <div className="w-20 h-32 mx-auto rounded-lg flex items-center justify-center font-bold text-lg border-2 bg-gray-700 text-white">
                  UNO
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {gameState.drawPile.length} cards
                </p>
              </div>

              {/* Direction */}
              <div className="text-center">
                <h3 className="font-semibold mb-2">Direction</h3>
                <div className="text-4xl">
                  {gameState.direction === 1 ? '🔄' : '🔃'}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {gameState.direction === 1 ? 'Clockwise' : 'Counter-clockwise'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Action */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Last Action</h3>
              <p className="text-lg">{gameState.lastAction}</p>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {gameState.players.map((player, index) => (
            <Card key={player.id} className={`${index === gameState.currentPlayerIndex && gameState.gameStatus === 'playing' ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{player.name}</span>
                  <Badge variant={index === gameState.currentPlayerIndex ? "default" : "secondary"}>
                    {player.hand.length} cards
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-1">
                  {player.hand.map((card, cardIndex) => (
                    <div
                      key={card.id}
                      className={`w-8 h-12 rounded text-xs flex items-center justify-center font-semibold border ${getCardColor(card)}`}
                      title={`${card.color || 'wild'} ${getCardDisplay(card)}`}
                    >
                      {getCardDisplay(card)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Speed Control */}
        {gameState.gameStatus === 'playing' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4">
                <label className="font-semibold">Turn Speed:</label>
                <div className="flex gap-2">
                  <Button
                    variant={turnSpeed === 500 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTurnSpeed(500)}
                  >
                    Fast (0.5s)
                  </Button>
                  <Button
                    variant={turnSpeed === 1000 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTurnSpeed(1000)}
                  >
                    Normal (1s)
                  </Button>
                  <Button
                    variant={turnSpeed === 2000 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTurnSpeed(2000)}
                  >
                    Slow (2s)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnoGame;