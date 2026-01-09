import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { destroySession, getSession } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function loader() {
  return redirect("/");
}
