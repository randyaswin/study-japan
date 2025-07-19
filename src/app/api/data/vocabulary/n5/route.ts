import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'vocabulary', 'n5.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const vocabularyData = JSON.parse(fileContents);
    
    return NextResponse.json(vocabularyData, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load vocabulary data' },
      { status: 500 }
    );
  }
}
