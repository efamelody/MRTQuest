import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubmitQuizRequest {
  attractionId: string;
  answers: Record<string, string>; // quizId -> userAnswer
}

interface QuizResult {
  quizId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get session from request
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit a quiz.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body: SubmitQuizRequest = await request.json();
    const { attractionId, answers } = body;

    // Validation
    if (!attractionId || typeof attractionId !== 'string') {
      return NextResponse.json(
        { error: 'Attraction ID is required' },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'At least one answer is required' },
        { status: 400 }
      );
    }

    // Fetch quiz data for this attraction
    const quizzes = await prisma.quiz.findMany({
      where: { siteId: attractionId },
      select: {
        id: true,
        question: true,
        correctAnswer: true,
        points: true,
      },
    });

    if (quizzes.length === 0) {
      return NextResponse.json(
        { error: 'No quizzes found for this attraction' },
        { status: 404 }
      );
    }

    // Process answers and create records
    const results: QuizResult[] = [];
    let totalCorrect = 0;
    let totalPoints = 0;

    const attemptPromises = quizzes.map(async (quiz) => {
      const userAnswer = answers[quiz.id];

      // If user didn't answer this question, skip it
      if (userAnswer === undefined || userAnswer === null) {
        return;
      }

      const isCorrect = userAnswer.toLowerCase().trim() === quiz.correctAnswer.toLowerCase().trim();
      const pointsEarned = isCorrect ? (quiz.points || 50) : 0;

      if (isCorrect) {
        totalCorrect++;
        totalPoints += pointsEarned;
      }

      // Create attempt record
      await prisma.userQuizAttempt.create({
        data: {
          userId,
          quizId: quiz.id,
          isCorrect,
          answer_provided: userAnswer,
          points_earned: pointsEarned,
        },
      });

      results.push({
        quizId: quiz.id,
        question: quiz.question,
        correctAnswer: quiz.correctAnswer,
        userAnswer,
        isCorrect,
        pointsEarned,
      });
    });

    await Promise.all(attemptPromises);

    return NextResponse.json(
      {
        success: true,
        totalQuestions: results.length,
        correctCount: totalCorrect,
        totalPoints,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz. Please try again.' },
      { status: 500 }
    );
  }
}
