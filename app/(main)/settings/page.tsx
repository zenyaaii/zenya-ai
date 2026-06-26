import AccountSettings from '@/components/settings/AccountSettings'

export const metadata = { title: 'الإعدادات' }

export default function SettingsPage() {
  return (
    <main className="px-6 py-16">
      <AccountSettings />
    </main>
  )
}
