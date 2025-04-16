import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const formData=  await req.formData();

    console.log({ body , formData })

    return NextResponse.json({
        success : true
    })
}
