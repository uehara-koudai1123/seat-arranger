import type { Route } from "./+types/dashboard.sessions.$id.duplicate";
import { redirect, Form } from "react-router";
import { getAuthenticatedUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      seats: true,
      participants: true,
    },
  });

  if (!session || session.hostId !== user.id) {
    return redirect("/dashboard");
  }

  return { user, session };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      seats: true,
      participants: true,
    },
  });

  if (!session || session.hostId !== user.id) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const copySeats = formData.get("copySeats") === "on";
  const copyParticipants = formData.get("copyParticipants") === "on";

  if (!title) {
    return { error: "タイトルは必須です" };
  }

  // Create new session with copied data
  const newSession = await prisma.session.create({
    data: {
      title,
      description: session.description,
      hostId: user.id,
      isShareEnabled: false, // Default to disabled
    },
  });

  // Copy seats if requested
  if (copySeats && session.seats.length > 0) {
    await prisma.seat.createMany({
      data: session.seats.map((seat) => ({
        sessionId: newSession.id,
        x: seat.x,
        y: seat.y,
        label: seat.label,
      })),
    });
  }

  // Copy participants if requested
  if (copyParticipants && session.participants.length > 0) {
    await prisma.participant.createMany({
      data: session.participants.map((participant) => ({
        sessionId: newSession.id,
        name: participant.name,
      })),
    });
  }

  return redirect(`/dashboard/sessions/${newSession.id}`);
}

export default function DuplicateSession({ loaderData, actionData }: Route.ComponentProps) {
  const { session } = loaderData;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", maxWidth: "600px" }}>
      <h1>セッションを複製</h1>
      <p>「{session.title}」を複製します</p>

      <Form method="post" style={{ marginTop: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            新しいタイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={`${session.title} (コピー)`}
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
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              name="copySeats"
              defaultChecked={true}
              style={{ marginRight: "0.5rem" }}
            />
            <span>座席レイアウトをコピー ({session.seats.length}件)</span>
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              name="copyParticipants"
              defaultChecked={true}
              style={{ marginRight: "0.5rem" }}
            />
            <span>参加者名をコピー ({session.participants.length}件)</span>
          </label>
        </div>

        <div style={{ padding: "1rem", backgroundColor: "#fff3e0", borderRadius: "4px", marginBottom: "1rem" }}>
          注意: 提案は複製されません。
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
            複製を作成
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
