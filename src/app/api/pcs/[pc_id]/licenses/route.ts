import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils'; // Assuming dbUtils is in src/db
import { RowDataPacket } from 'mysql2/promise';

// Define the structure of the data returned for each assigned license
interface AssignedLicenseInfo extends RowDataPacket {
    licenseId: number;
    licenseName: string | null;
    licenseType: string | null;
    softwareName: string;
    majorVersion: string | null;
    assignedOn: string | null; // Assuming DATE is returned as string
}

// Interface for the combined data returned by the query
interface AssignedLicenseInfoRaw extends RowDataPacket {
    license_id: number;
    license_name: string | null;
    license_type: string | null;
    software_name: string;
    major_version: string | null;
    assigned_on: string | null; 
}

// Explicitly define the type for the route parameters
// interface RouteParams {
//   pc_id: string;
// }

// GET assigned licenses for a specific PC
export async function GET(
    request: NextRequest,
    // Apply workaround: Use context: any
    context: any 
): Promise<NextResponse> {
    try {
        // Access pc_id via context using optional chaining and casting
        const pcIdStr = (context?.params?.pc_id as string) || ''; 
        const pcId = parseInt(pcIdStr, 10);
        if (isNaN(pcId)) {
            return NextResponse.json({ error: 'Invalid PC ID' }, { status: 400 });
        }

        // Query to get licenses assigned to this PC, joining with license and software details
        const query = `
            SELECT 
                l.license_id AS licenseId, 
                l.license_name AS licenseName, 
                l.license_type AS licenseType, 
                s.software_name AS softwareName, 
                s.major_version AS majorVersion,
                la.assigned_on AS assignedOn 
            FROM license_assignments la
            JOIN licenses l ON la.license_id = l.license_id
            JOIN software s ON l.software_id = s.software_id
            WHERE la.pc_id = ?
            ORDER BY s.software_name, l.license_name; 
        `;

        // Execute the query using dbUtils
        // dbUtils.query returns the rows array directly
        const rows = await dbUtils.query<AssignedLicenseInfo[]>(query, [pcId]); 
        
        // Ensure the response contains an array, default to empty if rows is null/undefined/falsy
        // (This check might be redundant if dbUtils.query guarantees an array, but safe to keep)
        const assignedLicenses = Array.isArray(rows) ? rows : [];

        return NextResponse.json({ assignedLicenses });

    } catch (error: unknown) {
        console.error('Error fetching assigned licenses for PC:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch assigned licenses', details: message },
            { status: 500 }
        );
    }
} 