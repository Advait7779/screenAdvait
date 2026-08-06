import React from 'react';

interface ProfilePageProps {
  session: any;
  onLogout: () => void;
}

function maskedLicenseKey(value?: string) {
  if (!value) return 'Protected';
  const parts = value.split('-');
  return parts.length >= 2
    ? `${parts[0]}-****-****-****-${parts.at(-1)?.slice(-4) || '****'}`
    : `****${value.slice(-4)}`;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ session, onLogout }) => {
  const user = session?.user || { fullName: 'Employee', username: '', email: '', role: 'EMPLOYEE' };
  const company = session?.company || { name: 'Unavailable', code: '—' };
  const license = session?.licenseStatus || { key: 'Unavailable', status: 'UNKNOWN' };

  return (
    <div className="space-y-5 max-w-2xl page-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">User & License Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">Authenticated device & organization details</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5 space-y-5 shadow-sm">
        <div className="flex items-center space-x-4 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-md bg-gradient-to-br from-green-800 to-green-950 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user.fullName}</h3>
            <div className="text-xs text-gray-500">@{user.username} &bull; {user.email}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
              {user.role}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-md">
            <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Company</div>
            <div className="text-sm font-bold text-gray-900">{company.name}</div>
            <div className="text-xs text-gray-500">Code: {company.code}</div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-md">
            <div className="text-xs text-gray-500 font-semibold uppercase mb-1">License Key</div>
            <div className="text-sm font-mono font-bold text-green-800">
              {maskedLicenseKey(license.key)}
            </div>
            <div className="text-xs text-green-700 font-semibold">Status: {license.status}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 rounded-md font-semibold text-xs transition-all"
        >
          Sign Out of Desktop Client
        </button>
      </div>
    </div>
  );
};
