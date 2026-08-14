import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://vbjfqetudhlgibnqrand.supabase.co";

function getSupabaseAdmin() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_KEY ||
    "";

  return createClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const isUUID = (str: any): boolean => {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin delete-user handler (supports both POST and DELETE)
  const handleDeleteUser = async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.body?.userId || req.body?.id || req.query?.userId || req.query?.id;
      const email = req.body?.email || req.query?.email;

      if (!userId && !email) {
        return res.status(400).json({
          success: false,
          error: "Either userId or email is required to delete an access user"
        });
      }

      // Forward to external VITE_API_URL if configured and distinct from localhost
      if (
        process.env.VITE_API_URL &&
        !process.env.VITE_API_URL.includes("localhost") &&
        !process.env.VITE_API_URL.includes("127.0.0.1") &&
        process.env.VITE_API_URL.startsWith("http")
      ) {
        try {
          const upstreamRes = await fetch(`${process.env.VITE_API_URL}/admin/delete-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, id: userId, email })
          });
          const data = await upstreamRes.json().catch(() => ({}));
          if (upstreamRes.ok) {
            return res.status(upstreamRes.status).json(data);
          }
        } catch (upstreamErr) {
          console.warn("Upstream delete-user failed, falling back to direct supabaseAdmin", upstreamErr);
        }
      }

      const supabaseAdmin = getSupabaseAdmin();
      let deletedFromAuth = false;
      let targetAuthId = isUUID(userId) ? String(userId) : null;

      // 1. Direct deletion from auth.users if valid auth UUID provided
      if (targetAuthId) {
        const { error: directErr } = await supabaseAdmin.auth.admin.deleteUser(targetAuthId);
        if (!directErr) {
          deletedFromAuth = true;
        } else {
          console.warn(`Direct auth.admin.deleteUser failed for ${targetAuthId}:`, directErr.message);
        }
      }

      // 2. If not yet deleted or if only email provided, find the auth user via admin.listUsers
      if (!deletedFromAuth && (email || targetAuthId)) {
        const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (!listErr && listData?.users) {
          const matchedUser = listData.users.find(
            u => (email && u.email?.toLowerCase() === String(email).trim().toLowerCase()) || (targetAuthId && u.id === targetAuthId)
          );

          if (matchedUser) {
            targetAuthId = matchedUser.id;
            const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(matchedUser.id);
            if (delErr) {
              console.error("Failed to delete user from Supabase Auth:", delErr);
              throw delErr;
            }
            deletedFromAuth = true;
          }
        }
      }

      // 3. Remove corresponding record from admin.client_users table
      if (targetAuthId) {
        await supabaseAdmin.schema("admin").from("client_users").delete().eq("id", targetAuthId);
      }
      if (userId && typeof userId === "string") {
        await supabaseAdmin.schema("admin").from("client_users").delete().eq("id", userId);
      }
      if (email && typeof email === "string") {
        await supabaseAdmin.schema("admin").from("client_users").delete().eq("email", String(email).trim());
      }

      return res.json({
        success: true,
        message: "User permanently deleted from auth.users and client_users",
        userId: targetAuthId || userId,
        deletedFromAuth
      });
    } catch (err: any) {
      console.error("Error in delete-user endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to delete user from Supabase Auth"
      });
    }
  };

  app.delete("/admin/delete-user", handleDeleteUser);
  app.post("/admin/delete-user", handleDeleteUser);
  app.delete("/api/admin/delete-user", handleDeleteUser);
  app.post("/api/admin/delete-user", handleDeleteUser);

  // Admin invite-user handler
  const handleInviteUser = async (req: express.Request, res: express.Response) => {
    try {
      const { email, clientId, firstName, lastName, designation } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const trimmedEmail = String(email).trim().toLowerCase();
      const supabaseAdmin = getSupabaseAdmin();

      // Query admin.client_users table for any existing row with this email across all clients
      const { data: existingClientUsers, error: queryErr } = await supabaseAdmin
        .schema("admin")
        .from("client_users")
        .select("*")
        .ilike("email", trimmedEmail);

      if (!queryErr && existingClientUsers && existingClientUsers.length > 0) {
        const otherClientMatch = existingClientUsers.find(
          (u: any) => u.client_id && String(u.client_id) !== String(clientId)
        );

        if (otherClientMatch) {
          return res.status(400).json({
            error: "email_registered_to_other_client",
            message: "This email is already registered to another client"
          });
        }

        const sameClientMatch = existingClientUsers.find(
          (u: any) => u.client_id && String(u.client_id) === String(clientId)
        );

        if (sameClientMatch) {
          return res.status(400).json({
            error: "email_already_registered",
            message: "This email is already registered"
          });
        }
      }

      // Check if auth user already exists and belongs to another client
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      if (listData?.users) {
        const existingAuthUser = listData.users.find(
          u => u.email && u.email.toLowerCase() === trimmedEmail
        );
        if (existingAuthUser) {
          const authClientId = existingAuthUser.user_metadata?.client_id;
          if (authClientId && String(authClientId) !== String(clientId)) {
            return res.status(400).json({
              error: "email_registered_to_other_client",
              message: "This email is already registered to another client"
            });
          }
        }
      }

      // Forward to external VITE_API_URL if configured and distinct from localhost
      if (
        process.env.VITE_API_URL &&
        !process.env.VITE_API_URL.includes("localhost") &&
        !process.env.VITE_API_URL.includes("127.0.0.1") &&
        process.env.VITE_API_URL.startsWith("http")
      ) {
        try {
          const upstreamRes = await fetch(`${process.env.VITE_API_URL}/admin/invite-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
          });
          const data = await upstreamRes.json().catch(() => ({}));
          return res.status(upstreamRes.status).json(data);
        } catch (upstreamErr) {
          console.warn("Upstream invite-user failed, falling back to direct supabaseAdmin", upstreamErr);
        }
      }

      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(String(email).trim(), {
        data: {
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          designation: designation
        }
      });

      if (error) {
        const isAlreadyRegistered =
          error.message?.toLowerCase().includes("already registered") ||
          error.code === "email_already_registered";
        return res.status(400).json({
          error: isAlreadyRegistered ? "email_already_registered" : error.message,
          message: error.message
        });
      }

      return res.json({ message: "Invite sent", user: data.user });
    } catch (err: any) {
      console.error("Error inviting user:", err);
      return res.status(500).json({ error: err.message || "Failed to invite user" });
    }
  };

  app.post("/admin/invite-user", handleInviteUser);
  app.post("/api/admin/invite-user", handleInviteUser);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
