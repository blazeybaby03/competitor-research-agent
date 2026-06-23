import { redirect } from "next/navigation";

interface BillingPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { plan } = await searchParams;
  const destination = plan ? `/settings/billing?plan=${plan}` : "/settings/billing";
  redirect(destination);
}
