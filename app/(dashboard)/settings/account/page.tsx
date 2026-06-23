import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountSettings from "@/components/AccountSettings";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <AccountSettings user={user} profile={profile} />;
}
