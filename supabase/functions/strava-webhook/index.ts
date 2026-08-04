// strava-webhook — receives Strava activity events and writes new Runs into marathon.runs.
// Deploy with verify_jwt = false (Strava calls this server-to-server; we authenticate the
// GET subscription check via STRAVA_VERIFY_TOKEN, and POST events by matching owner_id).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET")!;
const VERIFY = Deno.env.get("STRAVA_VERIFY_TOKEN")!;
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GENERIC = ["Morning Run","Afternoon Run","Evening Run","Lunch Run","Night Run"];
const pad = (n:number)=> (""+n).padStart(2,"0");
const fmtPace = (sec:number)=> { sec=Math.round(sec); return Math.floor(sec/60)+":"+pad(sec%60); };
const paceSec = (p:string)=> { const m=/^(\d+):(\d+)/.exec(p||""); return m ? (+m[1])*60+(+m[2]) : 0; };

async function ensureToken(admin:any, tok:any){
  const exp = tok.expires_at ? new Date(tok.expires_at).getTime() : 0;
  if (exp - Date.now() > 120000) return tok.access_token;
  const res = await fetch("https://www.strava.com/oauth/token", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ client_id:CLIENT_ID, client_secret:CLIENT_SECRET, grant_type:"refresh_token", refresh_token:tok.refresh_token })
  });
  if (!res.ok) return tok.access_token;
  const t = await res.json();
  await admin.from("strava_tokens").update({
    access_token:t.access_token, refresh_token:t.refresh_token, expires_at:new Date(t.expires_at*1000).toISOString()
  }).eq("user_id", tok.user_id);
  return t.access_token;
}

function mergeRow(userId:string, date:string, existing:any, comp:any){
  const parts:any[] = [];
  if (existing && existing.km != null) parts.push({ km:existing.km, sec:(existing.km||0)*paceSec(existing.pace), hr:existing.hr||null });
  parts.push({ km:comp.km, sec:comp.sec, hr:comp.hr });
  let tkm=0, tsec=0, hn=0, hd=0;
  for (const p of parts){ tkm+=p.km; tsec+=p.sec; if (p.hr && p.sec){ hn+=p.hr*p.sec; hd+=p.sec; } }
  const isMulti = parts.length>1;
  const note = isMulti ? "Double day" : (comp.name && !GENERIC.includes(comp.name) ? comp.name : "");
  return {
    user_id:userId, date,
    km: Math.round(tkm*100)/100,
    pace: (tkm>0 && tsec>0) ? fmtPace(tsec/tkm) : "",
    hr: hd>0 ? Math.round(hn/hd) : null,
    note, source:"strava"
  };
}

async function processEvent(ev:any){
  try {
    if (ev.object_type !== "activity" || ev.aspect_type !== "create") return; // creates only, avoids double-counting on edits
    const admin = createClient(SB_URL, SB_SERVICE, { db:{schema:"marathon"}, auth:{persistSession:false} });
    const { data: tok } = await admin.from("strava_tokens").select("*").eq("athlete_id", ev.owner_id).maybeSingle();
    if (!tok) return;
    const access = await ensureToken(admin, tok);
    const r = await fetch("https://www.strava.com/api/v3/activities/"+ev.object_id, { headers:{ Authorization:"Bearer "+access } });
    if (!r.ok) return;
    const a = await r.json();
    if (a.type!=="Run" && a.sport_type!=="Run") return;
    const date = (a.start_date_local || a.start_date || "").slice(0,10); if (!date) return;
    const comp = { km:(a.distance||0)/1000, sec:a.moving_time||0, hr:a.average_heartrate||null, name:(a.name||"").trim() };
    const { data: existing } = await admin.from("runs").select("*").eq("user_id", tok.user_id).eq("date", date).maybeSingle();
    await admin.from("runs").upsert(mergeRow(tok.user_id, date, existing, comp), { onConflict:"user_id,date" });
  } catch (_e) { /* swallow; Strava retries on non-200, but we already 200'd */ }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (url.searchParams.get("hub.mode")==="subscribe" && url.searchParams.get("hub.verify_token")===VERIFY) {
      return new Response(JSON.stringify({ "hub.challenge": url.searchParams.get("hub.challenge") }), { headers:{ "Content-Type":"application/json" } });
    }
    return new Response("forbidden", { status:403 });
  }
  if (req.method === "POST") {
    let ev:any = null;
    try { ev = await req.json(); } catch (_e) { /* ignore */ }
    if (ev) {
      const p = processEvent(ev);
      const er:any = (globalThis as any).EdgeRuntime;
      if (er?.waitUntil) er.waitUntil(p); else await p;
    }
    return new Response("ok");
  }
  return new Response("method not allowed", { status:405 });
});
