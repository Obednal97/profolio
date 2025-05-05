import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { method, ...data } = await req.json();
  const user = await getUserFromRequest(req);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  switch (method) {
    case "CREATE":
      const asset = await db.asset.create({ data: { ...data, userId: user.id } });
      return NextResponse.json({ asset });
    case "READ":
      const assets = await db.asset.findMany({ where: { userId: user.id } });
      return NextResponse.json({ assets });
    case "UPDATE":
      return await handleUpdate(data, user.id);
    case "DELETE":
      return await handleDelete(data.id, user.id);
    default:
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }
}