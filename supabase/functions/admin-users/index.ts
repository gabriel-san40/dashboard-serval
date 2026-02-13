// Supabase Edge Function: admin-users
// Cria/atualiza usuários fixos e atribui roles via tabela public.user_roles.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "gerente" | "usuario";

type PayloadUser = {
  username: string;
  password: string;
  role: AppRole;
};

type Payload = {
  users: PayloadUser[];
  domain?: string; // default @dashboard.local
};

function toEmail(username: string, domain: string) {
  const u = username.trim();
  if (!u) return "";
  return u.includes("@") ? u : `${u}${domain}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Identify caller
    const { data: callerData, error: callerErr } = await admin.auth.getUser(jwt);
    if (callerErr || !callerData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: must be admin
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerData.user.id,
      _role: "admin",
    });
    if (roleErr) throw roleErr;
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    const domain = payload.domain ?? "@dashboard.local";

    if (!payload.users?.length) {
      return new Response(JSON.stringify({ error: "Missing users" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ username: string; email: string; status: "created" | "updated"; user_id: string }> = [];

    // Helper to find an existing user by email
    const findUserByEmail = async (email: string) => {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      return (data.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;
    };

    for (const u of payload.users) {
      const email = toEmail(u.username, domain);
      if (!email || !u.password || !u.role) {
        return new Response(JSON.stringify({ error: `Invalid user payload for '${u.username}'` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try create, otherwise update
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: u.password,
        email_confirm: true,
      });

      let userId: string;
      let status: "created" | "updated";

      if (createErr) {
        // If already exists, update password
        const existing = await findUserByEmail(email);
        if (!existing) throw createErr;

        const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
        });
        if (updErr) throw updErr;

        userId = existing.id;
        status = "updated";
      } else {
        userId = created.user!.id;
        status = "created";
      }

      // Upsert role (single role per user)
      const { error: roleUpsertErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: u.role }, { onConflict: "user_id" });
      if (roleUpsertErr) throw roleUpsertErr;

      results.push({ username: u.username, email, status, user_id: userId });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any)?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
