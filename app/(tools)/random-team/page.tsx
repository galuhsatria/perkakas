'use client';

import Button from '@/app/components/Button';
import { useState } from 'react';

export default function Page() {
  const [name, setName] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);

  const handleNameChange = (event: any) => {
    setName(event.target.value);
  };

  const handleNumberOfTeamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfTeams(parseInt(event.target.value, 10));
  };

  const generateTeams = () => {
    const nameList = name
      .split('\n')
      .map((player) => player.trim())
      .filter(Boolean);

    const shuffledNames = nameList.sort(() => Math.random() - 0.5);
    const generatedTeams = Array.from({ length: numberOfTeams }, (_, index) => shuffledNames.filter((_, idx) => idx % numberOfTeams === index));

    setTeams(generatedTeams);
  };

  console.log(teams);

  const handleReset = () => {
    setName('');
    setTeams([]);
    setNumberOfTeams(2);
  };
  return (
    <main className="mt-28 layout">
      <h1 className="text-2xl font-bold">Random Team Generator</h1>
      <div className="flex flex-col gap-3 mt-6">
        <label className="font-medium">Names:</label>
        <textarea cols={30} rows={10} value={name} onChange={handleNameChange} className="border-large p-2 rounded-md focus:outline-none" placeholder="enter the list of names here, separate them with enter"></textarea>
      </div>
      <div className="flex flex-col gap-3 mt-6">
        <label className="font-medium">Number of Teams: </label>
        <input type="number" value={numberOfTeams} onChange={handleNumberOfTeamsChange} min={2} className="border-large rounded-md p-2 focus:outline-none" />
      </div>
      <div className="flex gap-4 mt-6">
        <Button label="Generate Teams" onClick={generateTeams} />
        <Button label="Reset" onClick={handleReset} className="bg-red-600" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-14">
        {teams.map((team, index) => (
          <div key={index} className="bg-white border-small p-4 rounded-md">
            <h2 className="font-semibold border-b border-dashed mb-3">Team {index + 1}</h2>
            <p className="text-zinc-500">Members: {team.length} people</p>
            <ul className="mt-2 list-disc px-4">
              {team.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
