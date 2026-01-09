import type { Route } from "./+types/dashboard.sessions.new";
import { redirect, Form } from "react-router";
import { getAuthenticatedUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title) {
    return { error: "タイトルは必須です" };
  }

  const session = await prisma.session.create({
    data: {
      title,
      description: description || null,
      hostId: user.id,
      isShareEnabled: false,
    },
  });

  return redirect(`/dashboard/sessions/${session.id}`);
}

export default function NewSession({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", maxWidth: "600px" }}>
      <h1>新しいセッションを作成</h1>

      <Form method="post" style={{ marginTop: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="description" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            説明
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        {actionData?.error && (
          <div style={{ padding: "1rem", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", marginBottom: "1rem" }}>
            {actionData.error}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              backgroundColor: "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            作成
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "12px 24px",
              backgroundColor: "#666",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "16px",
            }}
          >
            キャンセル
          </a>
        </div>
      </Form>
    </div>
  );
}
