import type { Route } from "./+types/login";
import { Form } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "ログイン - 席替えアプリ" }];
}

export default function Login() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem" }}>
      <h1>主催者ログイン</h1>
      <p>Google アカウントでログインしてください</p>
      
      <Form method="post" action="/auth/google">
        <button
          type="submit"
          style={{
            backgroundColor: "#4285f4",
            color: "white",
            padding: "12px 24px",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          Google でログイン
        </button>
      </Form>
    </div>
  );
}
