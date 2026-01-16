export function getCorsHeaders(origin?: string | null): HeadersInit {
  const allowedOrigins = (
    process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [
      'https://preppad.xyz',
      'https://www.preppad.xyz',
      'http://localhost:3000'
    ]
  );

  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
