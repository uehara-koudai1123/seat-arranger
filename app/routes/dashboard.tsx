import type { Route } from "./+types/dashboard";
import { redirect, Link, Form } from "react-router";
import { getAuthenticatedUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }

  const sessions = await prisma.session.findMany({
    where: { hostId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          seats: true,
          participants: true,
          proposals: true,
        },
      },
    },
  });

  return { user, sessions };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, sessions } = loaderData;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1>ダッシュボード</h1>
          <p>ようこそ、{user.name || user.email}さん</p>
        </div>
        <Form method="post" action="/logout">
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ログアウト
          </button>
        </Form>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Link
          to="/dashboard/sessions/new"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#4285f4",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          新しいセッションを作成
        </Link>
      </div>

      <h2>セッション一覧</h2>
      {sessions.length === 0 ? (
        <p>セッションがまだありません。</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>{session.title}</h3>
                  {session.description && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>
                      {session.description}
                    </p>
                  )}
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    <span>座席: {session._count.seats}</span>
                    <span style={{ margin: "0 1rem" }}>参加者: {session._count.participants}</span>
                    <span>提案: {session._count.proposals}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: session.isShareEnabled ? "#4caf50" : "#ff9800",
                        color: "white",
                      }}
                    >
                      {session.isShareEnabled ? "共有中" : "準備中"}
                    </span>
                    {session.isShareEnabled && (
                      <span style={{ marginLeft: "1rem", color: "#666" }}>
                        URL: {typeof window !== 'undefined' ? window.location.origin : ''}/s/{session.publicId}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                  <Link
                    to={`/dashboard/sessions/${session.id}`}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#4285f4",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  >
                    編集
                  </Link>
                  <Link
                    to={`/dashboard/sessions/${session.id}/duplicate`}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#666",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  >
                    複製
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
