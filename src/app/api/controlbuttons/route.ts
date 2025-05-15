import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { ControlButton } from '@/types/database';

export async function GET() {
  try {
    const controlButtons = await query<ControlButton[]>(
      `SELECT 
         button_id AS buttonId,
         esc_button AS escButton,
         auto_hold_button AS autoHoldButton,
         epb_button AS epbButton
       FROM control_buttons
       ORDER BY button_id`
    );
    
    return NextResponse.json({ controlButtons: controlButtons || [] });
  } catch (error) {
    console.error('Failed to fetch control buttons:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch control buttons', details: errorMessage }, { status: 500 });
  }
} 