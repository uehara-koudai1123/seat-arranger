import type { Route } from "./+types/s.$publicId";
import { redirect, Form } from "react-router";
import { prisma } from "~/lib/db.server";
import { getSession, commitSession } from "~/lib/session.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await prisma.session.findUnique({
    where: { publicId: params.publicId },
    include: {
      seats: {
        orderBy: [{ y: "asc" }, { x: "asc" }],
      },
    },
  });

  if (!session) {
    throw new Response("セッションが見つかりません", { status: 404 });
  }

  if (!session.isShareEnabled) {
    return { session, preparing: true };
  }

  // Check if participant already joined
  const cookieSession = await getSession(request.headers.get("Cookie"));
  const participantId = cookieSession.get(`participant_${params.publicId}`);

  let participant = null;
  if (participantId) {
    participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        sessionId: session.id,
      },
    });
  }

  return { session, preparing: false, participant };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await prisma.session.findUnique({
    where: { publicId: params.publicId },
  });

  if (!session || !session.isShareEnabled) {
    return redirect(`/s/${params.publicId}`);
  }

  const formData = await request.formData();
  const action = formData.get("_action") as string;

  if (action === "join") {
    const name = formData.get("name") as string;

    if (!name || name.trim().length === 0) {
      return { error: "名前を入力してください" };
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        name: name.trim(),
      },
    });

    // Store in session
    const cookieSession = await getSession(request.headers.get("Cookie"));
    cookieSession.set(`participant_${params.publicId}`, participant.id);

    return redirect(`/s/${params.publicId}`, {
      headers: {
        "Set-Cookie": await commitSession(cookieSession),
      },
    });
  }

  if (action === "submitProposal") {
    const cookieSession = await getSession(request.headers.get("Cookie"));
    const participantId = cookieSession.get(`participant_${params.publicId}`);

    if (!participantId) {
      return { error: "参加者として登録されていません" };
    }

    const layoutJson = formData.get("layoutJson") as string;

    if (!layoutJson) {
      return { error: "レイアウトデータが必要です" };
    }

    // Check if participant exists
    const participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        sessionId: session.id,
      },
    });

    if (!participant) {
      return { error: "参加者が見つかりません" };
    }

    // Create or update proposal
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        sessionId: session.id,
        participantId: participant.id,
      },
    });

    if (existingProposal) {
      await prisma.proposal.update({
        where: { id: existingProposal.id },
        data: { layoutJson },
      });
    } else {
      await prisma.proposal.create({
        data: {
          sessionId: session.id,
          participantId: participant.id,
          layoutJson,
        },
      });
    }

    return { success: true, message: "提案を保存しました" };
  }

  return { error: "不明なアクションです" };
}

export default function PublicSession({ loaderData, actionData }: Route.ComponentProps) {
  const { session, preparing, participant } = loaderData;

  if (preparing) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", textAlign: "center" }}>
        <h1>{session.title}</h1>
        {session.description && <p>{session.description}</p>}
        
        <div style={{ marginTop: "3rem", padding: "2rem", backgroundColor: "#fff3e0", borderRadius: "8px", maxWidth: "500px", margin: "3rem auto" }}>
          <h2>準備中</h2>
          <p>主催者がこのセッションの準備中です。</p>
          <p>しばらくお待ちください。</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
        <h1>{session.title}</h1>
        {session.description && <p>{session.description}</p>}

        <div style={{ marginTop: "2rem", padding: "2rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
          <h2>参加する</h2>
          <p>席替えに参加するために、あなたの名前を入力してください。</p>

          <Form method="post" style={{ marginTop: "1rem" }}>
            <input type="hidden" name="_action" value="join" />
            
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="name" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                名前
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px",
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

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: "#4285f4",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              参加する
            </button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>{session.title}</h1>
        {session.description && <p>{session.description}</p>}
        <p style={{ color: "#666" }}>参加者: <strong>{participant.name}</strong></p>
      </div>

      {actionData?.success && (
        <div style={{ padding: "1rem", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "4px", marginBottom: "1rem" }}>
          {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div style={{ padding: "1rem", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", marginBottom: "1rem" }}>
          {actionData.error}
        </div>
      )}

      <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
        <h2>座席配置</h2>
        {session.seats.length === 0 ? (
          <p>座席がまだ設定されていません。</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <SeatGrid seats={session.seats} />
          </div>
        )}
      </div>

      {session.seats.length > 0 && (
        <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
          <h2>配置案を提出</h2>
          <p>あなたの考える座席配置案を提出してください。</p>
          
          <Form method="post" style={{ marginTop: "1rem" }}>
            <input type="hidden" name="_action" value="submitProposal" />
            
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="layoutJson" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                配置案（JSON形式）
              </label>
              <textarea
                id="layoutJson"
                name="layoutJson"
                rows={10}
                placeholder='例: [{"x": 0, "y": 0, "assignedTo": "田中"}, {"x": 1, "y": 0, "assignedTo": "佐藤"}]'
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

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
              提案を保存
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}

function SeatGrid({ seats }: { seats: Array<{ x: number; y: number; label: string | null }> }) {
  const maxX = Math.max(...seats.map(s => s.x), 0);
  const maxY = Math.max(...seats.map(s => s.y), 0);

  const grid: (typeof seats[0] | null)[][] = [];
  for (let y = 0; y <= maxY; y++) {
    grid[y] = [];
    for (let x = 0; x <= maxX; x++) {
      grid[y][x] = seats.find(s => s.x === x && s.y === y) || null;
    }
  }

  return (
    <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
      <tbody>
        {grid.map((row, y) => (
          <tr key={y}>
            {row.map((seat, x) => (
              <td
                key={x}
                style={{
                  width: "80px",
                  height: "80px",
                  border: "1px solid #ddd",
                  textAlign: "center",
                  verticalAlign: "middle",
                  backgroundColor: seat ? "#4285f4" : "#f5f5f5",
                  color: seat ? "white" : "#999",
                  fontWeight: seat ? "bold" : "normal",
                }}
              >
                {seat ? seat.label || `(${seat.x},${seat.y})` : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
