// app/api/user/organization/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { organization } from '@/db-schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'


export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({
        status: false,
        message: "Unauthorized",
      }, { status: 401 });
    }

    // Find organization for this user
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, session.user.id)
    });

    return NextResponse.json({
      status: true,
      organization: org || null
    });
  } catch (error) {
    return NextResponse.json({
      status: false,
      message: error instanceof Error ? error.message : "Failed to fetch organization",
    }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
        const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationName, organizationLogo } = await request.json()

    // Check if organization exists for this user
    const existingOrg = await db.query.organization.findFirst({
      where: eq(organization.id, session.user.id) // Assuming user.id is used as organization.id
    })

    if (existingOrg) {
      // Update existing organization
      await db.update(organization)
        .set({
          name: organizationName,
          logo: organizationLogo // Use logo instead of logoUrl
        })
        .where(eq(organization.id, session.user.id))
    } else {
      // Create new organization
      await db.insert(organization).values({
        id: session.user.id, // Assuming user.id is used as organization.id
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/\s+/g, '-'), // Generate a slug
        logo: organizationLogo, // Use logo instead of logoUrl
        metadata: JSON.stringify({}) // Empty metadata object
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving organization:', error)
    return NextResponse.json(
      { error: 'Failed to save organization' },
      { status: 500 }
    )
  }
}