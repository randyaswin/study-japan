import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'quiz', 'quizzes_N1.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const quizData = JSON.parse(fileContents);
    
    return NextResponse.json(quizData, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load quiz data' },
      { status: 500 }
    );
  }
}
