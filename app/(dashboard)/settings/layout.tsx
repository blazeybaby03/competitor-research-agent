import SettingsTabs from "@/components/SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and billing.</p>
      </div>
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
