// // app/api/health/route.ts
// import { NextResponse } from 'next/server';
// import { createHealthCheckResponse } from '@/lib/error-monitoring';

// export async function GET() {
//   try {
//     const health = createHealthCheckResponse();
//     return NextResponse.json(health);
//   } catch (error) {
//     return NextResponse.json(
//       {
//         status: 'unhealthy',
//         timestamp: new Date().toISOString(),
//         error: 'Health check failed'
//       },
//       { status: 500 }
//     );
//   }
// }

// // Simple ping endpoint for uptime monitoring
// export async function HEAD() {
//   return new NextResponse(null, { status: 200 });
// }