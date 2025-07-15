import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Gamepad2, Users, Settings } from 'lucide-react';
import UnoGame from '../components/UnoGame';

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleBackToSetup = () => {
    setGameStarted(false);
  };

  if (gameStarted) {
    return <UnoGame playerCount={playerCount} onBack={handleBackToSetup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Gamepad2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">Autonomous UNO</CardTitle>
          <p className="text-muted-foreground">
            Watch AI players battle it out in a full UNO game with official rules!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Player Count Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <label className="font-semibold">Number of Players</label>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((count) => (
                <Button
                  key={count}
                  variant={playerCount === count ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[6, 7, 8].map((count) => (
                <Button
                  key={count}
                  variant={playerCount === count ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {/* Game Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <label className="font-semibold">Game Features</label>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">AI Strategy</span>
                <Badge variant="secondary">Smart Card Selection</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Game Rules</span>
                <Badge variant="secondary">Official UNO Rules</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">All Players</span>
                <Badge variant="secondary">AI Controlled</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cards Visible</span>
                <Badge variant="secondary">Face-up Display</Badge>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <Button 
            onClick={handleStartGame}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            Start Autonomous Game
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            All {playerCount} players will be controlled by AI. Watch them play and enjoy the strategic decisions!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
