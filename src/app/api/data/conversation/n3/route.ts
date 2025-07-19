import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'conversation', 'n3.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const conversationData = JSON.parse(fileContents);
    
    return NextResponse.json(conversationData, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load conversation data' },
      { status: 500 }
    );
  }
}
