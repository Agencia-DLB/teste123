import stripe from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const secret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!secret || !signature) {
      throw new Error("Missing secret or signature");
    }

    const event = stripe.webhooks.constructEvent(body, signature, secret);

    switch (event.type) {
      case "checkout.session.completed":
        if (event.data.object.payment_status === "paid") {
          const testeId = event.data.object.metadata?.testeId;
          console.log('Assinatura iniciada com sucesso', testeId);
          console.log(`Data da Assinatura: ${Date.now}`)
          console.log('Usuário Adicionado no Supabase')
          // Aqui você pode adicionar lógica para ativar a assinatura no seu sistema
        }
        break;

      case "invoice.paid":
        // Pagamento recorrente bem-sucedido
        console.log("Pagamento recorrente bem-sucedido", event.data.object.subscription);
        break;

      case "invoice.payment_failed":
        // Falha no pagamento recorrente
        console.log("Falha no pagamento recorrente", event.data.object.subscription);
        // Aqui você pode adicionar lógica para notificar o cliente ou tentar novamente
        break;

      case "customer.subscription.deleted":
        // Assinatura cancelada
        console.log("Assinatura cancelada", event.data.object.id);
        // Aqui você pode adicionar lógica para desativar a assinatura no seu sistema
        break;
    }

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: `Webhook error: ${error}`,
        ok: false,
      },
      { status: 500 }
    );
  }
}