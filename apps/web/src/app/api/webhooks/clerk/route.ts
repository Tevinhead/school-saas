import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@school-saas/db";
import { userProfiles } from "@school-saas/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserRole } from "@school-saas/db/schema";

interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

const ROLE_MAP: Record<string, UserRole> = {
  "org:admin": "school_admin",
  "org:teacher": "teacher",
  "org:student": "student",
  "org:parent": "parent",
};

function mapClerkRole(clerkRole: string): UserRole {
  return ROLE_MAP[clerkRole] ?? "student";
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  const wh = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.updated": {
      const data = event.data as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email_addresses: Array<{ email_address: string }>;
        image_url: string | null;
      };

      await db
        .update(userProfiles)
        .set({
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          email: data.email_addresses?.[0]?.email_address ?? "",
          avatarUrl: data.image_url,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.clerkUserId, data.id));
      break;
    }

    case "organizationMembership.created": {
      const data = event.data as {
        organization: { id: string };
        public_user_data: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          image_url: string | null;
          identifier: string;
        };
        role: string;
      };

      await db.insert(userProfiles).values({
        tenantId: data.organization.id,
        clerkUserId: data.public_user_data.user_id,
        role: mapClerkRole(data.role),
        firstName: data.public_user_data.first_name ?? "",
        lastName: data.public_user_data.last_name ?? "",
        email: data.public_user_data.identifier,
        avatarUrl: data.public_user_data.image_url,
      });
      break;
    }

    case "organizationMembership.updated": {
      const data = event.data as {
        organization: { id: string };
        public_user_data: { user_id: string };
        role: string;
      };

      await db
        .update(userProfiles)
        .set({
          role: mapClerkRole(data.role),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userProfiles.clerkUserId, data.public_user_data.user_id),
            eq(userProfiles.tenantId, data.organization.id)
          )
        );
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
