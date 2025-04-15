import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const jobUrl = formData.get('jobUrl') as string;

    if (!file || !jobUrl) {
      return NextResponse.json(
        { error: 'Resume file and job URL are required' },
        { status: 400 }
      );
    }

    // Forward the request to Django backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('job_posting_url', jobUrl);

    // Use the Django backend URL directly
    const response = await fetch('http://localhost:8000/api/analysis/', {
      method: 'POST',
      body: backendFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.detail || 'Failed to analyze');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
