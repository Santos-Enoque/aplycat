// app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db, userHelpers, creditHelpers } from '@/lib/db';

// Clerk webhook event types
type ClerkEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
  };
};

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const body = JSON.parse(payload);

  // Verify the webhook
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: ClerkEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle different event types
  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${evt.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(data: ClerkEvent['data']) {
  console.log(`[WEBHOOK] Creating user: ${data.id}`);
  
  const email = data.email_addresses[0]?.email_address;
  if (!email) {
    console.error('No email found for user creation');
    return;
  }

  try {
    // Create user in database
    const user = await db.user.create({
      data: {
        clerkId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
        credits: 0, // Credits are added via transaction below
        isPremium: false,
        isActive: true,
      },
    });

    // Check if this is a trial signup
    const isTrialSignup = (data as any).unsafe_metadata?.trial === 'true' || 
                         (data as any).public_metadata?.trial === 'true';

    if (isTrialSignup) {
      // For trial users, do NOT give credits yet - they must pay first
      console.log(`[WEBHOOK] Trial user created: ${user.id} - no credits given yet (payment required)`);
    } else {
      // Give regular signup bonus to non-trial users
      await creditHelpers.addCredits(
        user.id,
        2,
        'BONUS_CREDIT',
        'Welcome bonus - 2 free credits for new users'
      );
      console.log(`[WEBHOOK] Regular user created: ${user.id} with 2 welcome credits`);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(data: ClerkEvent['data']) {
  console.log(`[WEBHOOK] Updating user: ${data.id}`);
  
  const email = data.email_addresses[0]?.email_address;
  if (!email) {
    console.error('No email found for user update');
    return;
  }

  try {
    const user = await db.user.update({
      where: { clerkId: data.id },
      data: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
        lastActiveAt: new Date(),
      },
    });

    console.log(`[WEBHOOK] User updated successfully: ${user.id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(data: ClerkEvent['data']) {
  console.log(`[WEBHOOK] Deleting user: ${data.id}`);
  
  try {
    // Soft delete - mark as inactive instead of hard delete
    const user = await db.user.update({
      where: { clerkId: data.id },
      data: {
        isActive: false,
        lastActiveAt: new Date(),
      },
    });

    console.log(`[WEBHOOK] User deleted (marked inactive): ${user.id}`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      // User not found - already deleted or never existed
      console.log(`[WEBHOOK] User ${data.id} not found in database`);
      return;
    }
    console.error('Error deleting user:', error);
    throw error;
  }
}