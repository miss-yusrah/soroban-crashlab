import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/github/callback
 * GitHub OAuth 2.0 callback route.
 *
 * This route handles the redirection from GitHub after a user has authorized the application.
 * It expects 'code' and 'state' as query parameters.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // 1. Validate the presence of required parameters
  if (!code) {
    return NextResponse.json(
      { error: 'Missing "code" parameter from GitHub callback.' },
      { status: 400 }
    );
  }

  if (!state) {
    // State is strongly recommended for CSRF protection, though in a stub we might just log it.
    console.warn('GitHub callback received without "state" parameter.');
  }

  try {
    // 2. Simulate exchange of 'code' for an access token
    // In a real implementation, this would be a POST request to https://github.com/login/oauth/access_token
    console.log(`Exchanging code ${code} for access token...`);

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. Simulate fetching user profile with the access token
    // Real: GET https://api.github.com/user
    const mockUser = {
      id: 123456,
      login: 'octocat',
      email: 'octocat@github.com',
      name: 'The Octocat',
    };

    console.log(`Successfully authenticated user: ${mockUser.login}`);

    // 4. Redirect user back to the dashboard with a success indicator
    // In a real app, we would set a session cookie or JWT here.
    return NextResponse.redirect(new URL('/', request.url), {
      status: 302,
    });
  } catch (error) {
    console.error('Error during GitHub OAuth callback processing:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while processing the GitHub authentication.' },
      { status: 500 }
    );
  }
}
