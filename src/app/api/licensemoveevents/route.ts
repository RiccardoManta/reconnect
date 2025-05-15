import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { LicenseMoveEvent } from '@/types/database';

export async function GET(): Promise<NextResponse> {
  try {
    const query = `
      SELECT 
        lme.move_id AS move_id,
        lme.assignment_id AS assignment_id,
        lme.license_id AS license_id,
        lic.license_name AS license_name,
        lic.license_number AS license_key,
        lme.from_pc_id AS from_pc_id,
        from_pc.pc_name AS from_pc_name,
        lme.to_pc_id AS to_pc_id,
        to_pc.pc_name AS to_pc_name,
        lme.from_vm_id AS from_vm_id,
        from_vm.vm_name AS from_vm_name,
        lme.to_vm_id AS to_vm_id,
        to_vm.vm_name AS to_vm_name,
        DATE_FORMAT(lme.event_timestamp, '%Y-%m-%d %H:%i:%s') AS event_timestamp,
        lme.changed_by AS changed_by
      FROM license_move_events lme
      JOIN licenses lic ON lme.license_id = lic.license_id
      LEFT JOIN pc_overview from_pc ON lme.from_pc_id = from_pc.pc_id
      LEFT JOIN pc_overview to_pc ON lme.to_pc_id = to_pc.pc_id
      LEFT JOIN vm_instances from_vm ON lme.from_vm_id = from_vm.vm_id
      LEFT JOIN vm_instances to_vm ON lme.to_vm_id = to_vm.vm_id
      ORDER BY lme.event_timestamp DESC, lme.move_id DESC
    `;

    const license_move_events = await dbUtils.query<LicenseMoveEvent[]>(query);
    
    return NextResponse.json({ license_move_events });

  } catch (error: unknown) {
    console.error('Database query error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch license move events', details: message },
      { status: 500 }
    );
  }
} 