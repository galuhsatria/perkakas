'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TIMER_VALUES: Record<TabType, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

type TabType = 'pomodoro' | 'shortBreak' | 'longBreak';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function Page(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_VALUES[activeTab]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    setTimeLeft(TIMER_VALUES[activeTab]);
    setIsRunning(false);
  }, [activeTab]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  return (
    <div className="mt-28">
      <div className="border-large max-w-lg mx-auto p-4 rounded-md">
        <Tabs defaultValue="pomodoro" className="w-full mx-auto flex items-center flex-col" onValueChange={(value) => setActiveTab(value as TabType)}>
          <TabsList className="border-small">
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break</TabsTrigger>
          </TabsList>
          <TabsContent value="pomodoro">
            <div className="text-center">
              <h1 className="text-8xl font-bold my-5">{formatTime(timeLeft)}</h1>
              <button className="mt-4 px-7 font-medium  py-2 border-small rounded-md" onClick={() => setIsRunning((prev) => !prev)}>
                {isRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </TabsContent>
          <TabsContent value="shortBreak">
            <div className="text-center">
              <h1 className="text-8xl font-bold my-5">{formatTime(timeLeft)}</h1>
              <button className="mt-4 px-7 font-medium  py-2 border-small rounded-md" onClick={() => setIsRunning((prev) => !prev)}>
                {isRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </TabsContent>
          <TabsContent value="longBreak">
            <div className="text-center">
              <h1 className="text-8xl font-bold my-5">{formatTime(timeLeft)}</h1>
              <button className="mt-4 px-7 font-medium  py-2 border-small rounded-md" onClick={() => setIsRunning((prev) => !prev)}>
                {isRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
