import type { Route } from "./+types/auth.google.callback";
import { redirect } from "react-router";
import { authenticator } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await authenticator.authenticate("google", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}
