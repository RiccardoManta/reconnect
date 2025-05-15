import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { PowerSupply } from '@/types/database';

export async function GET() {
  try {
    const powerSupplies = await query<PowerSupply[]>(
      `SELECT 
         supply_id AS supplyId,
         power_supply AS powerSupply,
         fiu
       FROM power_supplies
       ORDER BY supply_id`
    );
    
    return NextResponse.json({ powerSupplies: powerSupplies || [] });
  } catch (error) {
    console.error('Failed to fetch power supplies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch power supplies', details: errorMessage }, { status: 500 });
  }
} 