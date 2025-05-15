import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { License, Software } from '@/types/database'; // LicenseAssignment removed

interface AssignedLicenseDetails extends License {
    // Inherits all fields from License
    software_name: string;
    major_version: string | null;
    assigned_on: string | null; // from license_assignments table
}

export async function GET(
    request: NextRequest,
    context: any // Changed to any as per project guidelines
): Promise<NextResponse> {
    const vm_id_str = (context?.params?.vm_id as string) || ''; // Adjusted for context:any
    if (!vm_id_str) {
        return NextResponse.json({ error: 'VM ID is required' }, { status: 400 });
    }
    const vm_id = parseInt(vm_id_str, 10);
    if (isNaN(vm_id)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }

    try {
        const query = `
            SELECT 
                l.*,                         -- All columns from licenses table
                s.software_name,
                s.major_version,
                DATE_FORMAT(la.assigned_on, '%Y-%m-%d') as assigned_on
            FROM license_assignments la
            JOIN licenses l ON la.license_id = l.license_id
            JOIN software s ON l.software_id = s.software_id
            WHERE la.vm_id = ?
            ORDER BY l.license_name;
        `;
        const assignedLicenses = await dbUtils.query<AssignedLicenseDetails[]>(query, [vm_id]);

        return NextResponse.json({ assignedLicenses: assignedLicenses || [] });

    } catch (error: unknown) {
        console.error(`Error fetching licenses for VM ID ${vm_id}:`, error); // Corrected backtick
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch assigned licenses', details: message },
            { status: 500 }
        );
    }
} 