import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    
    // Insert a test notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        type: 'transaction',
        data: {
          eventId: 'test-event',
          eventType: 'Test Transaction',
          txHash: '0x1234567890abcdef1234567890abcdef',
          status: 'included'
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error creating test notification:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}