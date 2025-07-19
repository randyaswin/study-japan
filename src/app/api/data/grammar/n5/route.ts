import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'grammar', 'n5.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const grammarData = JSON.parse(fileContents);
    
    return NextResponse.json(grammarData, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load grammar data' },
      { status: 500 }
    );
  }
}
