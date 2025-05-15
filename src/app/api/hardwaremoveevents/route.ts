import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { HardwareMoveEvent } from '@/types/database';

export async function GET() {
  try {
    const hardware_move_events = await query<HardwareMoveEvent[]>(
      `SELECT 
         hme.move_id AS move_id,
         hme.install_id AS install_id,
         hi.description AS hardware_description,
         hi.hardware_number AS hardware_number,
         hgt.group_name AS group_name,
         hme.from_bench_id AS from_bench_id,
         from_tb.hil_name AS from_bench_name,
         hme.to_bench_id AS to_bench_id,
         to_tb.hil_name AS to_bench_name,
         DATE_FORMAT(hme.event_timestamp, '%Y-%m-%d %H:%i:%s') AS event_timestamp,
         hme.changed_by AS changed_by
       FROM hardware_move_events hme
       JOIN hardware_installations hi ON hme.install_id = hi.install_id
       JOIN hardware_group_types hgt ON hi.hardware_group_id = hgt.hardware_group_id
       LEFT JOIN test_benches from_tb ON hme.from_bench_id = from_tb.bench_id
       LEFT JOIN test_benches to_tb ON hme.to_bench_id = to_tb.bench_id
       ORDER BY hme.event_timestamp DESC, hme.move_id DESC`
    );
    
    return NextResponse.json({ hardware_move_events: hardware_move_events || [] });
  } catch (error) {
    console.error('Failed to fetch hardware move events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch hardware move events', details: errorMessage }, { status: 500 });
  }
} 