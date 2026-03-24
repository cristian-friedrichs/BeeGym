import { NextResponse } from 'next/server';
import { EFI_PAYEE_CODE, EFI_AMBIENTE } from '@/lib/env-config';

/**
 * GET /api/efi-config
 * Returns non-sensitive EFI configuration needed by the browser SDK.
 * Only exposes payeeCode and environment — no secrets.
 */
export async function GET() {
  if (!EFI_PAYEE_CODE) {
    return NextResponse.json(
      { error: 'EFI_PAYEE_CODE not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    payeeCode: EFI_PAYEE_CODE,
    environment: EFI_AMBIENTE === 'producao' ? 'production' : 'sandbox',
  });
}
