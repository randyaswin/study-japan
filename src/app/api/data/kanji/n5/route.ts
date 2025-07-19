import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'kanji', 'n5.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const kanjiData = JSON.parse(fileContents);
    
    return NextResponse.json(kanjiData, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load kanji data' },
      { status: 500 }
    );
  }
}
