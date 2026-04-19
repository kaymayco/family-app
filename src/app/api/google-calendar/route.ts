import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  return NextResponse.json({ connected: !!accessToken });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Google" }, { status: 401 });
  }

  try {
    const allEvents: Array<{ id: string; summary?: string; start: { date?: string; dateTime?: string } }> = [];
    let pageToken: string | undefined = undefined;

    do {
      const params: Record<string, string> = {
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
      };
      if (pageToken) params.pageToken = pageToken;

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
          new URLSearchParams(params),
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await res.json();
      if (data.items) allEvents.push(...data.items);
      pageToken = data.nextPageToken;
    } while (pageToken);

    const rows = allEvents
      .filter((ev) => ev.summary && (ev.start.date || ev.start.dateTime))
      .map((ev) => ({
        title: ev.summary!,
        date: ev.start.date ?? ev.start.dateTime!.split("T")[0],
        person: "Both",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        google_event_id: ev.id,
      }));

    const { error } = await supabase
      .from("calendar_events")
      .upsert(rows, { onConflict: "google_event_id", ignoreDuplicates: false });

    if (error) throw error;

    return NextResponse.json({ imported: rows.length });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
