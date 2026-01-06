import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface TimerProps {
  initialTime: number; // en secondes
  onTimeUp?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  className?: string;
}

export default function Timer({ 
  initialTime, 
  onTimeUp, 
  onPause, 
  onResume, 
  onStop,
  className = '' 
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsRunning(true);
    setIsPaused(false);
    onResume?.();
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    onStop?.();
  };

  const isCritical = timeLeft < 300; // 5 minutes
  const isVeryCritical = timeLeft < 60; // 1 minute

  return (
    <Card className={`text-center ${className}`}>
      <div className="flex items-center justify-center mb-4">
        <Clock className={`w-6 h-6 mr-2 ${isCritical ? 'text-red-500' : 'text-blue-500'}`} />
        <h3 className="text-lg font-semibold text-gray-900">Temps restant</h3>
      </div>
      
      <div className={`text-4xl font-mono font-bold mb-4 ${
        isVeryCritical ? 'text-red-600 animate-pulse' : 
        isCritical ? 'text-red-500' : 'text-gray-900'
      }`}>
        {formatTime(timeLeft)}
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        {isRunning ? 'En cours' : isPaused ? 'En pause' : timeLeft === 0 ? 'Terminé' : 'Arrêté'}
      </div>
      
      <div className="flex justify-center gap-2">
        {!isRunning && !isPaused && (
          <Button onClick={handleStart} size="sm">
            <Play className="w-4 h-4 mr-1" />
            Démarrer
          </Button>
        )}
        
        {isRunning && (
          <Button onClick={handlePause} variant="warning" size="sm">
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
        )}
        
        {isPaused && (
          <Button onClick={handleResume} variant="success" size="sm">
            <Play className="w-4 h-4 mr-1" />
            Reprendre
          </Button>
        )}
        
        {(isRunning || isPaused) && (
          <Button onClick={handleStop} variant="danger" size="sm">
            <Square className="w-4 h-4 mr-1" />
            Arrêter
          </Button>
        )}
      </div>
    </Card>
  );
}
