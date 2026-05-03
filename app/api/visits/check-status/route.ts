import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attractionId } = await request.json();

    if (!attractionId) {
      return Response.json({ error: 'Missing attractionId' }, { status: 400 });
    }

    // Check geofence and photo visits separately
    const [geofenceVisit, photoVisit] = await Promise.all([
      prisma.visit.findFirst({
        where: { userId: session.user.id, siteId: attractionId, verificationType: 'geofence' },
        select: { id: true },
      }),
      prisma.visit.findFirst({
        where: { userId: session.user.id, siteId: attractionId, verificationType: 'photo' },
        select: { id: true },
      }),
    ]);

    return Response.json({
      isCheckedIn: !!geofenceVisit,
      isPhotoVerified: !!photoVisit,
    });
  } catch (error) {
    console.error('[check-status] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
