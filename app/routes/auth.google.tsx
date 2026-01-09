import type { Route } from "./+types/auth.google";
import { redirect } from "react-router";
import { authenticator } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return authenticator.authenticate("google", request);
}

export async function loader() {
  return redirect("/login");
}
