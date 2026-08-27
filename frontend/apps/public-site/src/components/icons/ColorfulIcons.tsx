import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/** 1. Camera / Automated Multi-Screen Capture Icon (Emerald & Mint) */
export function SvgCaptureCamera({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="2" y="6" width="20" height="15" rx="3.5" fill="url(#camGrad1)" />
      <path d="M7 6L8.5 3.5H15.5L17 6H7Z" fill="url(#camGrad2)" />
      <circle cx="12" cy="13.5" r="4.5" fill="#ffffff" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="12" cy="13.5" r="2.2" fill="#ffffff" />
      <circle cx="18" cy="9" r="1" fill="#86efac" />
      <defs>
        <linearGradient id="camGrad1" x1="2" y1="6" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803d" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
        <linearGradient id="camGrad2" x1="7" y1="3.5" x2="17" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 2. Lock / Hardware-Locked Anti-Piracy Key Icon (Indigo & Cyan) */
export function SvgHardwareLock({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="4" y="10" width="16" height="12" rx="3" fill="url(#lockGrad1)" />
      <path
        d="M7 10V6.5C7 3.73858 9.23858 1.5 12 1.5C14.7614 1.5 17 3.73858 17 6.5V10"
        stroke="url(#lockShackle)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.8" fill="#ffffff" />
      <path d="M12 16.8V19" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17.5" cy="12.5" r="0.8" fill="#67e8f9" />
      <defs>
        <linearGradient id="lockGrad1" x1="4" y1="10" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="lockShackle" x1="7" y1="1.5" x2="17" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 3. Users / Employee Directory & Key Distribution Icon (Emerald & Teal) */
export function SvgEmployeeUsers({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <circle cx="9" cy="7" r="4" fill="url(#usrGrad1)" />
      <path d="M2 20C2 16.134 5.13401 13 9 13C12.866 13 16 16.134 16 20H2Z" fill="url(#usrGrad1)" />
      <circle cx="17" cy="8" r="3" fill="url(#usrGrad2)" />
      <path d="M16 14.5C18.2 15.2 21 16.8 21 20H17.5C17.5 17.5 16.8 15.5 16 14.5Z" fill="url(#usrGrad2)" />
      <circle cx="13" cy="5" r="1" fill="#86efac" />
      <defs>
        <linearGradient id="usrGrad1" x1="2" y1="3" x2="16" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="usrGrad2" x1="14" y1="5" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 4. FolderTree / Hierarchical Timeline Archive Icon (Purple & Violet) */
export function SvgTimelineFolders({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <path
        d="M3 6.5C3 5.11929 4.11929 4 5.5 4H9.2L11 6.5H18.5C19.8807 6.5 21 7.61929 21 9V17.5C21 18.8807 19.8807 20 18.5 20H5.5C4.11929 20 3 18.8807 3 17.5V6.5Z"
        fill="url(#folderGrad1)"
      />
      <rect x="6" y="9" width="12" height="7" rx="1.5" fill="#ffffff" fillOpacity="0.2" />
      <circle cx="9" cy="12.5" r="1.2" fill="#ffffff" />
      <path d="M12 12.5H15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 18.5H18" stroke="#d8b4fe" strokeWidth="1.2" strokeLinecap="round" />
      <defs>
        <linearGradient id="folderGrad1" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 5. Building / SuperAdmin Multi-Tenant Provisioning Icon (Amber & Orange) */
export function SvgMultiTenantBuilding({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="3" y="4" width="12" height="18" rx="2" fill="url(#bldgGrad1)" />
      <rect x="13" y="9" width="8" height="13" rx="2" fill="url(#bldgGrad2)" />
      <rect x="5.5" y="7" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="9.5" y="7" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="5.5" y="11" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="9.5" y="11" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="5.5" y="15" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="9.5" y="15" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="15.5" y="12" width="2" height="2" rx="0.5" fill="#ffffff" />
      <rect x="15.5" y="16" width="2" height="2" rx="0.5" fill="#ffffff" />
      <defs>
        <linearGradient id="bldgGrad1" x1="3" y1="4" x2="15" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ea580c" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="bldgGrad2" x1="13" y1="9" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 6. Cpu / Desktop Daemon & Low Resource Footprint Icon (Cyan & Sky) */
export function SvgDesktopDaemon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="5" y="5" width="14" height="14" rx="3" fill="url(#cpuGrad1)" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#ffffff" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1.2" />
      {/* Pins */}
      <path d="M8 2V5M12 2V5M16 2V5" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 19V22M12 19V22M16 19V22" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 8H5M2 12H5M2 16H5" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 8H22M19 12H22M19 16H22" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#67e8f9" />
      <defs>
        <linearGradient id="cpuGrad1" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0891b2" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 7. Search & Pagination Archive Icon (Teal & Emerald) */
export function SvgSearchArchive({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <circle cx="10.5" cy="10.5" r="6.5" fill="url(#srchGrad1)" />
      <circle cx="10.5" cy="10.5" r="4" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.4" />
      <path d="M15.5 15.5L21 21" stroke="url(#srchHandle)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="#86efac" />
      <defs>
        <linearGradient id="srchGrad1" x1="4" y1="4" x2="17" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="srchHandle" x1="15.5" y1="15.5" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 8. Monitor / Multi-Screen Dual Display Icon (Cobalt Blue & Azure) */
export function SvgMultiScreen({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="2" y="4" width="13" height="10" rx="2" fill="url(#monGrad1)" />
      <rect x="9" y="8" width="13" height="10" rx="2" fill="url(#monGrad2)" />
      <path d="M15.5 18V21M13 21H18" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19.5" cy="10.5" r="0.8" fill="#93c5fd" />
      <defs>
        <linearGradient id="monGrad1" x1="2" y1="4" x2="15" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="monGrad2" x1="9" y1="8" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 9. KeyRound / Cryptographic Hardware Key Icon (Emerald & Gold) */
export function SvgCryptoKey({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <circle cx="8" cy="14" r="5" fill="url(#keyGrad1)" />
      <circle cx="8" cy="14" r="2.2" fill="#ffffff" />
      <path d="M12.5 11L21 2.5M17.5 6L20 8.5M15 8.5L17 10.5" stroke="url(#keyGrad1)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21" cy="2.5" r="1" fill="#facc15" />
      <defs>
        <linearGradient id="keyGrad1" x1="3" y1="2.5" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 10. Sliders / Interval Engine Controls Icon (Mint & Forest Green) */
export function SvgIntervalSliders({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="12" r="3" fill="url(#sliderGrad1)" />
      <circle cx="12" cy="10" r="3" fill="url(#sliderGrad1)" />
      <circle cx="20" cy="14" r="3" fill="url(#sliderGrad1)" />
      <circle cx="12" cy="10" r="1" fill="#ffffff" />
      <defs>
        <linearGradient id="sliderGrad1" x1="1" y1="7" x2="23" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803d" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 11. Shield / Security & Anti-Tamper Icon (Emerald & Gold) */
export function SvgSecurityShield({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <path
        d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 22.8C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
        fill="url(#shdGrad1)"
      />
      <path d="M9 12L11 14L15.5 9.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="5" r="0.8" fill="#facc15" />
      <defs>
        <linearGradient id="shdGrad1" x1="4" y1="2" x2="20" y2="22.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803d" />
          <stop offset="1" stopColor="#14532d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 12. Zap / Lightning Speed & Zero Lag Icon (Amber & Electric Yellow) */
export function SvgZeroLagZap({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="url(#zapGrad1)"
        stroke="#ca8a04"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M12 5L6 13H11L10 18L17 11H12L12 5Z" fill="#ffffff" fillOpacity="0.4" />
      <defs>
        <linearGradient id="zapGrad1" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eab308" />
          <stop offset="1" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 13. Download / Desktop Installer Icon (Royal Blue & Mint) */
export function SvgDownloadInstaller({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="3" y="16" width="18" height="5" rx="2" fill="url(#dlBase)" />
      <path d="M12 3V13M12 13L8 9M12 13L16 9" stroke="url(#dlArrow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18.5" r="0.8" fill="#86efac" />
      <defs>
        <linearGradient id="dlBase" x1="3" y1="16" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e40af" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="dlArrow" x1="8" y1="3" x2="16" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
