import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-aba-signature") ?? "";

    // Verify HMAC signature
    const secret = process.env.ABA_WEBHOOK_SECRET ?? "";
    if (secret) {
      const computed = crypto
        .createHmac("sha512", secret)
        .update(body)
        .digest("hex");

      if (computed !== signature) {
        console.error("[ABA Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body) as {
      tran_id?: string;
      status?: string;
      amount?: string;
      currency?: string;
    };

    console.log("[ABA Webhook] Received payment:", payload);

    // TODO: When status = "00" (success), look up invoice by tran_id
    // and record the payment in the payments table.
    //
    // const { status, tran_id, amount } = payload;
    // if (status === "00") {
    //   // 1. Find invoice where metadata.aba_tran_id === tran_id
    //   // 2. Insert into payments table
    //   // 3. Update invoice paidAmount and status
    // }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[ABA Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
