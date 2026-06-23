import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/app/lib/supabase';

/**
 * Helper to verify network hash signatures from the MoMo gateways.
 * Uses HMAC-SHA256 signature verification if MOMO_WEBHOOK_SECRET is configured.
 */
function verifySignature(signature: string | null, rawBody: string): boolean {
  const webhookSecret = process.env.MOMO_WEBHOOK_SECRET;
  
  // In development/sandbox environments without a secret, skip validation but warn
  if (!webhookSecret) {
    console.warn('[MoMo Webhook] MOMO_WEBHOOK_SECRET is not configured. Bypassing signature verification.');
    return true;
  }

  if (!signature) {
    console.error('[MoMo Webhook] Signature header is missing.');
    return false;
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(computedSignature, 'utf8')
    );
  } catch (error) {
    console.error('[MoMo Webhook] Signature comparison failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('[MoMo Webhook] Received webhook notification');

  try {
    // 1. Read Raw Body for Signature Verification
    const rawBody = await request.text();
    const signatureHeader = 
      request.headers.get('x-signature') || 
      request.headers.get('x-hub-signature') || 
      request.headers.get('signature') || 
      request.headers.get('x-api-signature');

    // 2. Validate Signature
    if (!verifySignature(signatureHeader, rawBody)) {
      return NextResponse.json(
        { error: 'Invalid or missing signature' },
        { status: 401 }
      );
    }

    // 3. Parse Payload
    if (!rawBody) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[MoMo Webhook] JSON Parse Error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('[MoMo Webhook] Payload received:', JSON.stringify(payload, null, 2));

    // 4. Resolve Transaction Reference and Status (Supporting both MTN and Airtel Formats)
    // - MTN MoMo uses externalId for transaction reference, financialTransactionId for provider ID, and status
    // - Airtel Money uses transaction.reference, transaction.id, and transaction.status
    const externalTxnId = 
      payload.externalId || 
      payload.reference || 
      payload.transaction?.reference || 
      payload.referenceId;

    const providerRefId = 
      payload.financialTransactionId || 
      payload.transaction?.id || 
      payload.providerTxId || 
      payload.id;

    const rawStatus = 
      payload.status || 
      payload.transaction?.status || 
      payload.result;

    if (!externalTxnId) {
      console.error('[MoMo Webhook] Could not resolve transaction reference ID from payload.');
      return NextResponse.json(
        { error: 'Missing transaction reference ID' },
        { status: 400 }
      );
    }

    // 5. Map Raw Gateway Status to Database Transaction Status
    let dbStatus: 'completed' | 'failed' | 'pending' = 'pending';
    const statusClean = String(rawStatus).toUpperCase();

    if (
      statusClean === 'SUCCESSFUL' || 
      statusClean === 'SUCCESS' || 
      statusClean === 'TS' || 
      statusClean === 'COMPLETED' ||
      statusClean === '00' // Airtel success code sometimes
    ) {
      dbStatus = 'completed';
    } else if (
      statusClean === 'FAILED' || 
      statusClean === 'FAILURE' || 
      statusClean === 'TF' || 
      statusClean === 'REJECTED' ||
      statusClean === 'CANCELLED'
    ) {
      dbStatus = 'failed';
    }

    console.log(
      `[MoMo Webhook] Transaction Reference: ${externalTxnId}, Provider Ref: ${providerRefId}, Raw Status: ${rawStatus} -> Mapped Status: ${dbStatus}`
    );

    // 6. Connect to Supabase using Admin Client (Bypass RLS for Webhook updates)
    const supabaseAdmin = getSupabaseAdminClient();

    // 7. Check if transaction exists first
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('id, status, amount, member_id')
      .eq('id', externalTxnId)
      .single();

    if (fetchError || !transaction) {
      console.error(`[MoMo Webhook] Transaction not found in database: ${externalTxnId}`, fetchError);
      return NextResponse.json(
        { error: `Transaction ${externalTxnId} not found` },
        { status: 404 }
      );
    }

    // 8. Update transaction record
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: dbStatus,
        provider_reference_id: providerRefId || null,
      })
      .eq('id', externalTxnId);

    if (updateError) {
      console.error(`[MoMo Webhook] Failed to update transaction ${externalTxnId}:`, updateError);
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }

    console.log(`[MoMo Webhook] Successfully updated transaction ${externalTxnId} to status '${dbStatus}'`);
    return NextResponse.json({
      success: true,
      transactionId: externalTxnId,
      status: dbStatus,
    });

  } catch (error: any) {
    console.error('[MoMo Webhook] Internal server error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || error },
      { status: 500 }
    );
  }
}
