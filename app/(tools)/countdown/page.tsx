'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import Confetti from 'react-confetti';
import Button from '@/app/components/Button';
import { BsChevronCompactDown, BsChevronCompactUp } from 'react-icons/bs';

export default function CountDown() {
  const [newMinute, setNewMinute] = useState(0);

  const expiryTimestamp = new Date();
  expiryTimestamp.setHours(expiryTimestamp.getSeconds() + 0);

  const [confetti, setConfetti] = useState(false);

  const { seconds, minutes, hours, isRunning, start, pause, restart } = useTimer({
    autoStart: false,
    expiryTimestamp,
    onExpire: () => {
      setConfetti(true);
      setTimeout(() => {
        setConfetti(false);
      }, 5000);
    },
  });

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="layout">
      <div>{confetti && <Confetti recycle={false} />}</div>
      <h1>Countdown Timer</h1>
      <div>
        {/* <p>{`${formatTime(hours)} : ${formatTime(minutes)} : ${formatTime(seconds)}`}</p>
         */}
        <div className="flex gap-10 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <button className="increment"></button>
            <h1 className="text-8xl">{hours}</h1>
            <button className="decrement">
              <BsChevronCompactDown />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <button
              className="increment text-2xl bg-black text-center py-1 px-8 rounded-md text-white"
              onClick={() => {
                setNewMinute(newMinute + 1);
                const minute = new Date();
                minute.setMinutes(minute.getMinutes() + newMinute);
                restart(minute, false);
              }}
            >
              <BsChevronCompactUp />
            </button>
            <h1 className="text-8xl">{minutes}</h1>
            <button
              className="decrement text-2xl bg-black text-center py-1 px-8 rounded-md text-white"
              onClick={() => {
                setNewMinute(newMinute - 1);
                const minute = new Date();
                minute.setMinutes(minute.getMinutes() + newMinute);
                restart(minute, false);
              }}
            >
              <BsChevronCompactDown />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <button className="increment"></button>
            <h1 className="text-8xl">{seconds}</h1>
            <button className="decrement">
              <BsChevronCompactDown />
            </button>
          </div>
        </div>
        <div className="flex gap-5 flex-row">
          {!isRunning ? <Button onClick={start} label="Start" /> : <Button onClick={pause} label="Pause" />}
          <Button
            onClick={() => {
              const time = new Date();
              time.setSeconds(time.getSeconds() + 300);
              restart(time, false);
            }}
            label="Restart"
          />
        </div>
      </div>
    </div>
  );
}
