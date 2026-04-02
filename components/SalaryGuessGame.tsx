"use client";

import { useState, useCallback } from "react";

interface Job {
  title: string;
  slug: string;
  median: number;
}

interface Props {
  jobs: Job[];
}

export function SalaryGuessGame({ jobs }: Props) {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(75000);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [order, setOrder] = useState(() =>
    [...Array(jobs.length).keys()].sort(() => Math.random() - 0.5).slice(0, 5)
  );

  const total = 5;
  const current = order[round];
  const job = jobs[current];
  const done = round >= total || !job;

  const accuracy = job
    ? Math.max(0, 100 - Math.abs(guess - job.median) / job.median * 100)
    : 0;

  const getColor = (acc: number) => {
    if (acc >= 90) return "text-emerald-600";
    if (acc >= 70) return "text-yellow-600";
    if (acc >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const handleReveal = useCallback(() => {
    setRevealed(true);
    if (accuracy >= 70) setScore((s) => s + 1);
  }, [accuracy]);

  const handleNext = useCallback(() => {
    setRound((r) => r + 1);
    setGuess(75000);
    setRevealed(false);
  }, []);

  const handleRestart = useCallback(() => {
    setOrder([...Array(jobs.length).keys()].sort(() => Math.random() - 0.5).slice(0, 5));
    setRound(0);
    setGuess(75000);
    setRevealed(false);
    setScore(0);
  }, [jobs.length]);

  if (jobs.length < 5) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 rounded-xl p-6 my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-900">Salary Guessing Game</h3>
        <span className="text-sm text-indigo-600 font-medium">
          {done ? "Final Score" : `Round ${round + 1}/${total}`}
        </span>
      </div>

      {done ? (
        <div className="text-center py-6">
          <div className="text-5xl font-black text-indigo-700 mb-2">{score}/{total}</div>
          <p className="text-slate-600 mb-4">
            {score >= 4 ? "Excellent! You really know your salaries!" :
             score >= 2 ? "Not bad! Keep exploring to learn more." :
             "Tricky, right? Check out more salary data below."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {order.map((idx) => {
              const j = jobs[idx];
              return j ? (
                <a key={j.slug} href={`/jobs/${j.slug}/`}
                  className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-indigo-600 hover:bg-indigo-50">
                  {j.title}
                </a>
              ) : null;
            })}
          </div>
          <button onClick={handleRestart}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Play Again
          </button>
        </div>
      ) : (
        <>
          <p className="text-slate-700 mb-1 font-medium">
            What is the median annual salary for:
          </p>
          <p className="text-2xl font-bold text-indigo-800 mb-5">{job.title}</p>

          <div className="mb-4">
            <input
              type="range"
              min={20000}
              max={200000}
              step={5000}
              value={guess}
              onChange={(e) => !revealed && setGuess(Number(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              disabled={revealed}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>$20K</span>
              <span className="text-lg font-bold text-indigo-700">{fmt(guess)}</span>
              <span>$200K</span>
            </div>
          </div>

          {!revealed ? (
            <button onClick={handleReveal}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Reveal Answer
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xs text-slate-500 uppercase mb-1">Your Guess</div>
                  <div className="text-lg font-bold text-slate-700">{fmt(guess)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xs text-slate-500 uppercase mb-1">Actual</div>
                  <div className="text-lg font-bold text-indigo-700">{fmt(job.median)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xs text-slate-500 uppercase mb-1">Accuracy</div>
                  <div className={`text-lg font-bold ${getColor(accuracy)}`}>
                    {accuracy.toFixed(0)}%
                  </div>
                </div>
              </div>
              <button onClick={handleNext}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                {round + 1 < total ? "Next Question →" : "See Results"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
