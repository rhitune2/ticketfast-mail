import { NextResponse } from 'next/server';
import { db } from '@/db'; // Veritabanı bağlantınızı import edin
import { subscription, ticket } from '@/db'; // Şemalarınızı import edin
import { eq, and, gte, lt, count } from 'drizzle-orm';
import { addMonths, setDate } from 'date-fns'; // date-fns kütüphanesini kullanacağız

// --- KONFİGÜRASYON ---
const TEST_USER_ID = '2H8IhzFoAuZGCHKeefRibhzh8oQffoNL'; // GERÇEK VEYA TEST KULLANICI ID'Sİ GİRİN
const SIMULATED_QUOTA_HIT_DAY = 26; // Kotanın dolduğu simüle edilen gün (örn: ayın 26'sı)
// --- -------------- ---

// Helper function to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
  console.log('\n--- KOTA TEST ROTASI BAŞLATILDI ---');

  try {
    // 1. Mevcut Aboneliği Al
    console.log(`\n[ADIM 1] Kullanıcı ${TEST_USER_ID} için mevcut abonelik alınıyor...`);
    const initialSubscriptionArr = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, TEST_USER_ID))
      .limit(1);

    if (!initialSubscriptionArr || initialSubscriptionArr.length === 0) {
      console.error('Hata: Test kullanıcısı için abonelik bulunamadı.');
      return NextResponse.json({ error: 'Test kullanıcısı için abonelik bulunamadı.' }, { status: 404 });
    }
    const initialSubscription = initialSubscriptionArr[0];
    console.log('Mevcut Abonelik:', initialSubscription);

    // 2. İlk Periyot İçin Bilet Sayısını Hesapla (Yükseltme Öncesi)
    console.log('\n[ADIM 2] İlk abonelik periyodu için bilet sayısı hesaplanıyor...');
    const initialSubscriptionTimeLine = initialSubscription.createdAt;
    const initialNextMonth = addMonths(initialSubscriptionTimeLine, 1);
    console.log('İlk Başlangıç Zamanı (subscriptionTimeLine):', initialSubscriptionTimeLine);
    console.log('İlk Bitiş Zamanı (nextMonth):', initialNextMonth);

    const initialTicketsResult = await db
      .select({ value: count() })
      .from(ticket)
      .where(
        and(
          eq(ticket.creatorId, TEST_USER_ID),
          gte(ticket.createdAt, initialSubscriptionTimeLine),
          lt(ticket.createdAt, initialNextMonth)
        )
      );
    const initialTicketCount = initialTicketsResult[0]?.value ?? 0;
    console.log('İlk Periyottaki Bilet Sayısı:', initialTicketCount);
    console.log('İlk Periyot Kotası:', initialSubscription.ticketQuota);

    // 3. Abonelik Yükseltmesini Simüle Et (createdAt Güncelle)
    console.log(`\n[ADIM 3] Abonelik yükseltmesi simüle ediliyor (createdAt tarihi ayın ${SIMULATED_QUOTA_HIT_DAY}. gününe güncelleniyor)...`);

    // Simüle edilen yükseltme tarihi (mevcut aboneliğin başladığı ayın belirlenen günü)
    const simulatedUpgradeDate = setDate(initialSubscription.createdAt, SIMULATED_QUOTA_HIT_DAY);
    console.log('Simüle Edilen Yükseltme Tarihi:', simulatedUpgradeDate);

    // ÖNEMLİ: Gerçek senaryoda eski abonelik silinir, yenisi oluşturulur.
    // Burada test için sadece mevcut aboneliğin createdAt'ını güncelliyoruz.
    // Ayrıca ticketQuota'yı da örnek olarak artıralım (yükseltme simülasyonu)
    const updatedSub = await db
      .update(subscription)
      .set({
        createdAt: simulatedUpgradeDate, // Yeni başlangıç tarihi
        // ticketQuota: (initialSubscription.ticketQuota ?? 0) + 50, // Örnek kota artışı
        // Gerekirse planId vb. de güncelleyebilirsiniz.
      })
      .where(eq(subscription.userId, TEST_USER_ID))
      .returning(); // Güncellenmiş veriyi al

    if (!updatedSub || updatedSub.length === 0) {
        console.error('Hata: Abonelik güncellenemedi.');
        return NextResponse.json({ error: 'Abonelik güncellenemedi.' }, { status: 500 });
    }
    const newSubscription = updatedSub[0];
    console.log('Güncellenmiş Abonelik:', newSubscription);

    // Kısa bir bekleme ekleyelim ki veritabanı işlemi tamamlansın (opsiyonel)
    await delay(500);

    // 4. Yeni Periyot İçin Bilet Sayısını Hesapla (Yükseltme Sonrası)
    console.log('\n[ADIM 4] YENİ abonelik periyodu için bilet sayısı hesaplanıyor...');
    const newSubscriptionTimeLine = newSubscription.createdAt; // Güncellenmiş tarih
    const newNextMonth = addMonths(newSubscriptionTimeLine, 1);
    console.log('YENİ Başlangıç Zamanı (subscriptionTimeLine):', newSubscriptionTimeLine);
    console.log('YENİ Bitiş Zamanı (nextMonth):', newNextMonth);

    const newTicketsResult = await db
      .select({ value: count() })
      .from(ticket)
      .where(
        and(
          eq(ticket.creatorId, TEST_USER_ID),
          gte(ticket.createdAt, newSubscriptionTimeLine), // YENİ başlangıç tarihi
          lt(ticket.createdAt, newNextMonth)             // YENİ bitiş tarihi
        )
      );
    const newTicketCount = newTicketsResult[0]?.value ?? 0;
    console.log('YENİ Periyottaki Bilet Sayısı:', newTicketCount);
    console.log('YENİ Periyot Kotası:', newSubscription.ticketQuota);

    // 5. Aboneliği Eski Haline Döndür (Test sonrası temizlik - OPSİYONEL ama önerilir)
    console.log('\n[ADIM 5] Test sonrası abonelik eski haline getiriliyor...');
    await db
        .update(subscription)
        .set({
            createdAt: initialSubscription.createdAt, // Orijinal tarih
            ticketQuota: initialSubscription.ticketQuota, // Orijinal kota
        })
        .where(eq(subscription.userId, TEST_USER_ID));
    console.log('Abonelik eski haline getirildi.');


    console.log('\n--- KOTA TEST ROTASI TAMAMLANDI ---');

    return NextResponse.json({
      message: 'Test tamamlandı. Konsolu kontrol edin.',
      initialPeriod: {
        start: initialSubscriptionTimeLine,
        end: initialNextMonth,
        count: initialTicketCount,
        quota: initialSubscription.ticketQuota
      },
      simulatedUpgradeDate: simulatedUpgradeDate,
      newPeriod: {
        start: newSubscriptionTimeLine,
        end: newNextMonth,
        count: newTicketCount,
        quota: newSubscription.ticketQuota
      }
    });

  } catch (error) {
    console.error('\n--- TEST ROTASINDA HATA ---');
    console.error(error);
    return NextResponse.json({ error: 'Test sırasında bir hata oluştu.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}