import { auth } from "@/auth";
import { ProfileScreen } from "@/components/ProfileScreen";

export const metadata = {
  title: "Perfil — Nerds Battle",
};

export default async function PerfilPage() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return <ProfileScreen user={user} />;
}
