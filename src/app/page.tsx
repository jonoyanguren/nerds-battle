import { auth } from "@/auth";
import App from "../App";

export default async function Page() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;
  return <App user={user} />;
}
