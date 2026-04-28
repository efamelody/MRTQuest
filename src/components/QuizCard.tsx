'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface Quiz {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  points: number | null;
  sortOrder?: number;
}

interface QuizCardProps {
  attractionId: string;
  attractionName: string;
  quizzes: Quiz[];
  hasQuizChallenge: boolean;
}

interface QuizResult {
  quizId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface SubmitResponse {
  success: boolean;
  totalQuestions: number;
  correctCount: number;
  totalPoints: number;
  results: QuizResult[];
}

export default function QuizCard({
  attractionId,
  attractionName,
  quizzes,
  hasQuizChallenge,
}: QuizCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResults, setSubmissionResults] = useState<SubmitResponse | null>(null);

  // Don't render if quiz challenge is not enabled or no quizzes
  if (!hasQuizChallenge || quizzes.length === 0) {
    return null;
  }

  // Sort quizzes by sortOrder
  const sortedQuizzes = [...quizzes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const handleAnswerChange = (quizId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [quizId]: answer,
    }));
  };

  const isAllAnswered = sortedQuizzes.every((quiz) => selectedAnswers[quiz.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attractionId,
          answers: selectedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

      const data: SubmitResponse = await response.json();
      setSubmissionResults(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswers({});
    setSubmissionResults(null);
    setSubmitError(null);
  };

  // If results are shown, display the results view
  if (submissionResults) {
    return (
      <div className="rounded-3xl bg-white/70 backdrop-blur-sm p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">
            {submissionResults.correctCount === submissionResults.totalQuestions ? '🎉' : '📊'}
          </div>
          <h3 className="text-2xl font-bold text-fuchsia-300 mb-2">Quiz Complete!</h3>
          <p className="text-lg font-semibold text-slate-700">
            {submissionResults.correctCount} / {submissionResults.totalQuestions} Correct
          </p>
          <p className="text-xl font-bold text-[#00A959] mt-2">
            +{submissionResults.totalPoints} Points Earned
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {submissionResults.results.map((result) => (
            <div
              key={result.quizId}
              className={`rounded-lg p-4 ${
                result.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex gap-3 mb-2">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{result.question}</p>
                  <p className="text-sm text-slate-700 mt-1">
                    Your answer: <span className="font-medium">{result.userAnswer}</span>
                  </p>
                  {!result.isCorrect && (
                    <p className="text-sm text-slate-700 mt-1">
                      Correct answer: <span className="font-medium text-green-700">{result.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleTryAgain}
          className="mb-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Display quiz input form
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-sm p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-fuchsia-300 mb-2">Quiz Challenge</h3>
        <p className="text-sm text-slate-600">
          Answer all questions to earn points and complete this challenge.
        </p>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-red-700 text-sm">{submitError}</p>
        </div>
      )}

      <div className="space-y-6 mb-6">
        {sortedQuizzes.map((quiz, index) => (
          <div key={quiz.id} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
            <p className="font-semibold text-slate-900 mb-4">
              <span className="text-slate-500 text-sm">Q{index + 1}. </span>
              {quiz.question}
            </p>
            <div className="space-y-3">
              {quiz.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-[#00A959] hover:bg-slate-50 transition"
                >
                  <input
                    type="radio"
                    name={`quiz-${quiz.id}`}
                    value={option}
                    checked={selectedAnswers[quiz.id] === option}
                    onChange={(e) => handleAnswerChange(quiz.id, e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">{option}</span>
                </label>
              ))}
            </div>
            {quiz.points && (
              <p className="text-xs text-slate-500 mt-3">+{quiz.points} points if correct</p>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleSubmit}
        disabled={!isAllAnswered}
        loading={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
      </Button>
    </div>
  );
}
