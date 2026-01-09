import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "席替えアプリ - Seat Arranger" },
    { name: "description", content: "クラスやチーム向けの席替えWebアプリ" },
  ];
}

export default function Home() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem" }}>
      <h1>席替えアプリ</h1>
      <p>クラスやチーム向けの、席替えを行うWebアプリ</p>
      
      <div style={{ marginTop: "2rem" }}>
        <h2>主催者の方</h2>
        <p>
          <Link to="/login" style={{ color: "blue", textDecoration: "underline" }}>
            ログインして開始
          </Link>
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>参加者の方</h2>
        <p>主催者から共有されたURLにアクセスしてください</p>
      </div>
    </div>
  );
}
