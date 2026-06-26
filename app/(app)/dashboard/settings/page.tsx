import AccountSettings from '@/components/settings/AccountSettings'

export const metadata = { title: 'الإعدادات' }

export default function DashboardSettingsPage() {
  return (
    <div className="px-6 py-8">
      <AccountSettings />
    </div>
  )
}
