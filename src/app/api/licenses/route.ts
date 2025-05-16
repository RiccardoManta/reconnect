import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { License, LicenseRequestBody } from '@/types/database'; // Added LicenseRequestBody
import { checkApiPermission } from '@/utils/server/permissionUtils'; // Corrected import path

// GET method to fetch all licenses
export async function GET(): Promise<NextResponse> {
  try {
    const query = `
      SELECT 
        l.*, 
        s.software_name,
        pc.pc_name AS assigned_pc_name, -- For direct use or constructing assigned_to_name
        vm.vm_name AS assigned_vm_name  -- For direct use or constructing assigned_to_name
      FROM licenses l
      JOIN software s ON l.software_id = s.software_id
      LEFT JOIN license_assignments la ON l.license_id = la.license_id
      LEFT JOIN pc_overview pc ON la.pc_id = pc.pc_id
      LEFT JOIN vm_instances vm ON la.vm_id = vm.vm_id
      ORDER BY l.license_id;
    `;
    const licensesData = await dbUtils.query<License[]>(query);

    const licenses = licensesData.map(lic => ({
      ...lic,
      assigned_to_name: lic.assigned_pc_name || lic.assigned_vm_name || null,
      assigned_to_type: lic.assigned_pc_name ? 'pc' : (lic.assigned_vm_name ? 'vm' : null),
    }));
    
    return NextResponse.json({ licenses });

  } catch (error: unknown) {
    console.error('Error fetching licenses:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch licenses', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new license
export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
  try {
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    const body: LicenseRequestBody = await request.json();
    
    // Validate required fields
    if (!body.software_id) {
      return NextResponse.json(
        { error: 'Software ID (software_id) is required' }, 
        { status: 400 }
      );
    }

    // Insert the new license record using dbUtils.insert
    const insertQuery = `
      INSERT INTO licenses (
          software_id, license_name, license_description, license_number, 
          dongle_number, activation_key, system_id, license_user, 
          maintenance_end, owner, license_type, remarks
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      body.software_id,
      body.license_name || null,
      body.license_description || null,
      body.license_number || null,
      body.dongle_number || null,
      body.activation_key || null,
      body.system_id || null,
      body.license_user || null,
      body.maintenance_end || null, 
      body.owner || null,
      body.license_type || null,
      body.remarks || null
    ];

    const licenseId = await dbUtils.insert(insertQuery, insertValues);

    if (!licenseId) {
        throw new Error("Failed to get license_id after insert.");
    }

    // Get the newly inserted record
    const newLicenseData = await dbUtils.queryOne<License>(
      `SELECT 
        l.*, 
        s.software_name,
        pc.pc_name AS assigned_pc_name,
        vm.vm_name AS assigned_vm_name
      FROM licenses l
      JOIN software s ON l.software_id = s.software_id
      LEFT JOIN license_assignments la ON l.license_id = la.license_id
      LEFT JOIN pc_overview pc ON la.pc_id = pc.pc_id
      LEFT JOIN vm_instances vm ON la.vm_id = vm.vm_id
      WHERE l.license_id = ?`,
      [licenseId]
    );
    const newLicense = newLicenseData ? {
      ...newLicenseData,
      assigned_to_name: newLicenseData.assigned_pc_name || newLicenseData.assigned_vm_name || null,
      assigned_to_type: newLicenseData.assigned_pc_name ? 'pc' : (newLicenseData.assigned_vm_name ? 'vm' : null),
    } : null;
        
    return NextResponse.json({ 
      success: true, 
      message: 'License added successfully',
      license: newLicense
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding license:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to add license: Invalid software_id. The software does not exist.', details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add license', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing license
/*
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LicenseRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.license_id) {
      return NextResponse.json(
        { error: 'License ID (license_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.software_id) {
      return NextResponse.json(
        { error: 'Software ID (software_id) is required' }, 
        { status: 400 }
      );
    }

    // Update the license record using dbUtils.update
    const updateQuery = `
      UPDATE licenses SET
         software_id = ?, 
         license_name = ?, 
         license_description = ?, 
         license_number = ?, 
         dongle_number = ?, 
         activation_key = ?, 
         system_id = ?, 
         license_user = ?, 
         maintenance_end = ?, 
         owner = ?, 
         license_type = ?, 
         remarks = ?
       WHERE license_id = ?
    `; 
    const updateValues = [
        body.software_id,
        body.license_name || null,
        body.license_description || null,
        body.license_number || null,
        body.dongle_number || null,
        body.activation_key || null,
        body.system_id || null,
        body.license_user || null,
        body.maintenance_end || null, 
        body.owner || null,
        body.license_type || null,
        body.remarks || null,
        body.license_id
    ];

    const affectedRows = await dbUtils.update(updateQuery, updateValues);
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'License record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedLicenseData = await dbUtils.queryOne<License>(
        `SELECT 
          l.*, 
          s.software_name,
          pc.pc_name AS assigned_pc_name,
          vm.vm_name AS assigned_vm_name
        FROM licenses l
        JOIN software s ON l.software_id = s.software_id
        LEFT JOIN license_assignments la ON l.license_id = la.license_id
        LEFT JOIN pc_overview pc ON la.pc_id = pc.pc_id
        LEFT JOIN vm_instances vm ON la.vm_id = vm.vm_id
        WHERE l.license_id = ?`,
        [body.license_id]
    );
    const updatedLicense = updatedLicenseData ? {
      ...updatedLicenseData,
      assigned_to_name: updatedLicenseData.assigned_pc_name || updatedLicenseData.assigned_vm_name || null,
      assigned_to_type: updatedLicenseData.assigned_pc_name ? 'pc' : (updatedLicenseData.assigned_vm_name ? 'vm' : null),
    } : null;
        
    return NextResponse.json({ 
      success: true, 
      message: 'License updated successfully',
      license: updatedLicense
    });
    
  } catch (error: unknown) {
    console.error('Error updating license:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to update license: Invalid software_id. The software does not exist.', details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update license', details: message },
      { status: 500 }
    );
  }
} 
*/ 