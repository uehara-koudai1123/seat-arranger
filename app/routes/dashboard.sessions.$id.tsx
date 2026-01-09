import type { Route } from "./+types/dashboard.sessions.$id";
import { redirect, Form, useNavigate, useNavigation } from "react-router";
import { getAuthenticatedUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { useState, useEffect } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      seats: {
        orderBy: [{ y: "asc" }, { x: "asc" }],
      },
      participants: {
        orderBy: { name: "asc" },
      },
      proposals: {
        include: {
          participant: true,
        },
        orderBy: { createdAt: "desc" },
      },
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

  const formData = await request.formData();
  const action = formData.get("_action") as string;

  const session = await prisma.session.findUnique({
    where: { id: params.id },
  });

  if (!session || session.hostId !== user.id) {
    return redirect("/dashboard");
  }

  if (action === "update") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isShareEnabled = formData.get("isShareEnabled") === "on";

    await prisma.session.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        isShareEnabled,
      },
    });

    return { success: true, message: "セッション情報を更新しました" };
  }

  if (action === "addSeat") {
    const x = parseInt(formData.get("x") as string);
    const y = parseInt(formData.get("y") as string);
    const label = formData.get("label") as string;

    // Check if there are proposals - warn but don't block
    const proposalCount = await prisma.proposal.count({
      where: { sessionId: params.id },
    });

    await prisma.seat.create({
      data: {
        sessionId: params.id,
        x,
        y,
        label: label || null,
      },
    });

    return {
      success: true,
      message: "座席を追加しました",
      warning: proposalCount > 0 ? `注意: ${proposalCount}件の参加者提案が存在します` : null,
    };
  }

  if (action === "deleteSeat") {
    const seatId = formData.get("seatId") as string;

    // Check if there are proposals - warn but don't block
    const proposalCount = await prisma.proposal.count({
      where: { sessionId: params.id },
    });

    await prisma.seat.delete({
      where: { id: seatId },
    });

    return {
      success: true,
      message: "座席を削除しました",
      warning: proposalCount > 0 ? `注意: ${proposalCount}件の参加者提案が存在します` : null,
    };
  }

  return { error: "不明なアクションです" };
}

export default function SessionEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { user, session } = loaderData;
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [showAddSeat, setShowAddSeat] = useState(false);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ← ダッシュボードに戻る
        </button>
      </div>

      <h1>セッション編集</h1>

      {actionData?.success && (
        <div style={{ padding: "1rem", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "4px", marginBottom: "1rem" }}>
          {actionData.message}
        </div>
      )}

      {actionData?.warning && (
        <div style={{ padding: "1rem", backgroundColor: "#fff3e0", color: "#e65100", borderRadius: "4px", marginBottom: "1rem" }}>
          {actionData.warning}
        </div>
      )}

      {actionData?.error && (
        <div style={{ padding: "1rem", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", marginBottom: "1rem" }}>
          {actionData.error}
        </div>
      )}

      <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
        <h2>基本情報</h2>
        <Form method="post">
          <input type="hidden" name="_action" value="update" />
          
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              タイトル
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={session.title}
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
              defaultValue={session.description || ""}
              rows={3}
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
                name="isShareEnabled"
                defaultChecked={session.isShareEnabled}
                style={{ marginRight: "0.5rem" }}
              />
              <span>参加者に公開する（共有を有効にする）</span>
            </label>
          </div>

          {session.isShareEnabled && (
            <div style={{ padding: "1rem", backgroundColor: "#e3f2fd", borderRadius: "4px", marginBottom: "1rem" }}>
              <strong>公開URL:</strong> {typeof window !== 'undefined' ? window.location.origin : ''}/s/{session.publicId}
            </div>
          )}

          <button
            type="submit"
            disabled={navigation.state === "submitting"}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            更新
          </button>
        </Form>
      </div>

      <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>座席レイアウト</h2>
          <button
            onClick={() => setShowAddSeat(!showAddSeat)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showAddSeat ? "キャンセル" : "座席を追加"}
          </button>
        </div>

        {showAddSeat && (
          <Form method="post" style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
            <input type="hidden" name="_action" value="addSeat" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div>
                <label htmlFor="x" style={{ display: "block", marginBottom: "0.5rem" }}>X座標</label>
                <input
                  type="number"
                  id="x"
                  name="x"
                  required
                  min="0"
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label htmlFor="y" style={{ display: "block", marginBottom: "0.5rem" }}>Y座標</label>
                <input
                  type="number"
                  id="y"
                  name="y"
                  required
                  min="0"
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label htmlFor="label" style={{ display: "block", marginBottom: "0.5rem" }}>ラベル</label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  placeholder="例: A1"
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: "1rem",
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              追加
            </button>
          </Form>
        )}

        {session.seats.length === 0 ? (
          <p>座席が登録されていません。</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {session.seats.map((seat) => (
              <div
                key={seat.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                <span>
                  {seat.label || `(${seat.x}, ${seat.y})`} - 座標: ({seat.x}, {seat.y})
                </span>
                <Form method="post" style={{ margin: 0 }}>
                  <input type="hidden" name="_action" value="deleteSeat" />
                  <input type="hidden" name="seatId" value={seat.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    削除
                  </button>
                </Form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
        <h2>統計</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#e3f2fd", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}>{session.seats.length}</div>
            <div>座席</div>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "#e8f5e9", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#388e3c" }}>{session.participants.length}</div>
            <div>参加者</div>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "#fff3e0", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f57c00" }}>{session.proposals.length}</div>
            <div>提案</div>
          </div>
        </div>
      </div>

      {session.proposals.length > 0 && (
        <div style={{ marginBottom: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
          <h2>参加者提案</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {session.proposals.map((proposal) => (
              <div
                key={proposal.id}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                <strong>{proposal.participant.name}</strong> - {new Date(proposal.createdAt).toLocaleString("ja-JP")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
