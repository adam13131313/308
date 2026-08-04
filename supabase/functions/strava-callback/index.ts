// strava-callback — completes Strava OAuth and backfills recent Run activities.
// Deploy with verify_jwt = false (Strava's browser redirect carries no Supabase JWT;
// we authenticate the user via the `state` param, which is their Supabase access token).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://adam13131313.github.io/308/";
const CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET")!;
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GENERIC = new Set(["Morning Run","Afternoon Run","Evening Run","Lunch Run","Night Run"]);
const pad = (n:number)=> (""+n).padStart(2,"0");
const fmtPace = (sec:number)=> { sec=Math.round(sec); return Math.floor(sec/60)+":"+pad(sec%60); };
const localDate = (a:any)=> (a.start_date_local || a.start_date || "").slice(0,10);

function redirect(status:string){
  return new Response(null, { status:302, headers:{ Location: APP_URL + "?strava=" + status } });
}

function dayRow(userId:string, date:string, list:any[]){
  let tkm=0, tsec=0, hn=0, hd=0; const names:string[]=[];
  for (const a of list){
    tkm+=a.km; tsec+=a.sec;
    if (a.hr && a.sec){ hn+=a.hr*a.sec; hd+=a.sec; }
    if (a.name && !GENERIC.has(a.name)) names.push(a.name);
  }
  const bits:string[]=[];
  if (list.length===2) bits.push("Double day");
  else if (list.length>2) bits.push(list.length+" runs");
  bits.push(...names);
  return {
    user_id:userId, date,
    km: Math.round(tkm*100)/100,
    pace: (tkm>0 && tsec>0) ? fmtPace(tsec/tkm) : "",
    hr: hd>0 ? Math.round(hn/hd) : null,
    note: bits.join(" - "),
    source: "strava"
  };
}

async function backfill(admin:any, userId:string, accessToken:string){
  const after = Math.floor(new Date("2026-04-26T00:00:00Z").getTime()/1000);
  const acts:any[] = [];
  for (let page=1; page<=6; page++){
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200&page=${page}`,
      { headers:{ Authorization:"Bearer "+accessToken } });
    if (!r.ok) break;
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length===0) break;
    acts.push(...batch);
    if (batch.length < 200) break;
  }
  const byDate:Record<string,any[]> = {};
  for (const a of acts){
    if (a.type!=="Run" && a.sport_type!=="Run") continue;
    const d = localDate(a); if (!d) continue;
    (byDate[d] ||= []).push({ km:(a.distance||0)/1000, sec:a.moving_time||0, hr:a.average_heartrate||null, name:(a.name||"").trim() });
  }
  const rows = Object.keys(byDate).map(d => dayRow(userId, d, byDate[d]));
  if (rows.length) await admin.from("runs").upsert(rows, { onConflict:"user_id,date" });
  return rows.length;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // Supabase access token (JWT)
    if (!code || !state) return redirect("error");

    const admin = createClient(SB_URL, SB_SERVICE, { db:{schema:"marathon"}, auth:{persistSession:false} });
    const { data: u, error: uErr } = await admin.auth.getUser(state);
    if (uErr || !u?.user) return redirect("error");
    const userId = u.user.id;

    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ client_id:CLIENT_ID, client_secret:CLIENT_SECRET, code, grant_type:"authorization_code" })
    });
    if (!tokenRes.ok) return redirect("error");
    const tok = await tokenRes.json();

    await admin.from("strava_tokens").upsert({
      user_id: userId,
      athlete_id: tok.athlete?.id ?? null,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(tok.expires_at*1000).toISOString()
    });

    await backfill(admin, userId, tok.access_token);
    return redirect("connected");
  } catch (_e) {
    return redirect("error");
  }
});
