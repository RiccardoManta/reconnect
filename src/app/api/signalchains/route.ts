import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { SignalChain } from '@/types/database';

export async function GET() {
  try {
    const signalChains = await query<SignalChain[]>(
      `SELECT 
         chain_id AS chainId,
         io_models AS ioModels,
         peripheral_hw AS peripheralHw,
         wetbench, 
         hcu_emulation AS hcuEmulation,
         epb,
         buttons,
         rdz_sensor AS rdzSensor,
         test_modules AS testModules,
         diagnostic_modules AS diagnosticModules
       FROM signal_chains
       ORDER BY chain_id`
    );
    
    return NextResponse.json({ signalChains: signalChains || [] });
  } catch (error) {
    console.error('Failed to fetch signal chains:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch signal chains', details: errorMessage }, { status: 500 });
  }
} 