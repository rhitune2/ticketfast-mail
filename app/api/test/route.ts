import { NextResponse } from "next/server";
import { db } from "@/db"; // Veritabanı bağlantınızı import edin
import { subscription, ticket } from "@/db"; // Şemalarınızı import edin
import { eq, and, gte, lt, count } from "drizzle-orm";
import { addMonths, setDate } from "date-fns"; // date-fns kütüphanesini kullanacağız
import { createSubscription } from "@/lib/actions";

// --- KONFİGÜRASYON ---
const TEST_USER_ID = "llXRKjTzsPQxzyzswpddeNwxZl69vICB"; // GERÇEK VEYA TEST KULLANICI ID'Sİ GİRİN
// --- -------------- ---

export async function GET() {
  try {
    await createSubscription(TEST_USER_ID, "pro");

    return NextResponse.json({ succes: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err });
  }
}
