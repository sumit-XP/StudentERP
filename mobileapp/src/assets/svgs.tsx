import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { StyleProp, ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// 1. Top Bar Icons
export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    />
  </Svg>
);

// 2. Side Bar / Profile Icons
export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#434654', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z"
    />
  </Svg>
);

export const AccountDetailsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#434654',
  style,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.5c0-1.99 4-3 6-3s6 1.01 6 3V18z"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#434654', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18-1.45-.23-.41-.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.05-.24-.24-.41-.48-.41h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22.08-.47 0-.59.22l-1.92 3.32c-.12.22-.07.47.12.61l2.01 1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
    />
  </Svg>
);

export const SecurityIcon: React.FC<IconProps> = ({ size = 24, color = '#434654', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
    />
  </Svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 20, color = '#ba1a1a', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
    />
  </Svg>
);

// 3. Quick Actions Icons
export const AddUserIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </Svg>
);

export const MegaphoneIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 12c0-1.1.9-2 2-2V8c-1.1 0-2-.9-2-2h-2c0 1.1-.9 2-2 2v2c1.1 0 2 .9 2 2s-.9 2-2 2v2c1.1 0 2 .9 2 2h2c0-1.1.9-2 2-2v-2c-1.1 0-2-.9-2-2zm-10 4.5l-4-4h-2v-5h2l4-4v13zm9-6.5V6.5c-.83 0-1.5-.67-1.5-1.5h-1c0 1.38 1.12 2.5 2.5 2.5zm0 6V14c.83 0 1.5.67 1.5 1.5h-1c0-1.38-1.12-2.5-2.5-2.5z"
    />
  </Svg>
);

export const ReportIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
    />
  </Svg>
);

export const ConfigIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
    />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 14, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </Svg>
);

// 4. Navigator Bottom Tab Icons
export const DashboardIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
    />
  </Svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
    />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
    />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
    />
  </Svg>
);

export const TuneIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M3 17v2h6v-2H3zm10 0v2h8v-2h-8zM3 11v2h10v-2H3zm14 0v2h4v-2h-4zM3 5v2h18V5H3z"
    />
  </Svg>
);

export const LanguageIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.9 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.33-.14 2 0 .67.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.34-.16-2 0-.66.07-1.34.16-2h4.68c.09.66.16 1.34.16 2 0 .66-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.66-2.49-2.93-4.33 3.56zM16.36 14c.08-.66.14-1.33.14-2 0-.67-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"
    />
  </Svg>
);

export const DarkModeIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"
    />
  </Svg>
);

export const NotificationsActiveIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#737686',
  style,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M7.58 4.08L6.15 2.65C3.75 4.54 2.22 7.43 2.03 10.7h2c.19-2.73 1.48-5.17 3.55-6.62zm12.39-1.43l-1.43 1.43c2.07 1.45 3.36 3.89 3.55 6.62h2c-.19-3.27-1.72-6.16-4.12-8.05zM12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </Svg>
);

export const LockResetIcon: React.FC<IconProps> = ({ size = 18, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"
    />
  </Svg>
);

export const DevicesIcon: React.FC<IconProps> = ({ size = 18, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"
    />
  </Svg>
);

export const VerifiedUserIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 15l-4-4 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z"
    />
  </Svg>
);

export const DatabaseIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 4 2 6.5v11C2 20 6.48 22 12 22s10-2 10-4.5v-11C22 4 17.52 2 12 2zm0 2c4.42 0 8 1.34 8 2.5s-3.58 2.5-8 2.5-8-1.34-8-2.5S7.58 4 12 4zm8 13.5c0 1.16-3.58 2.5-8 2.5s-8-1.34-8-2.5v-2.12c1.86 1.28 4.7 2.12 8 2.12s6.14-.84 8-2.12v2.12zm0-4.5c0 1.16-3.58 2.5-8 2.5s-8-1.34-8-2.5V10.9c1.86 1.28 4.7 2.12 8 2.12s6.14-.84 8-2.12v2.08z"
    />
  </Svg>
);

export const PaymentsIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
    />
  </Svg>
);

export const AnalyticsIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
    />
  </Svg>
);

export const HubIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"
    />
  </Svg>
);

export const FactCheckIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-4-4 1.41-1.41L10 14.17l5.59-5.59L17 10l-7 7z"
    />
  </Svg>
);

export const AssignmentIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
    />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
    />
  </Svg>
);

export const GradeIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </Svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
    />
  </Svg>
);

export const EditNoteIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M3 10h11v2H3zm0-2h11v2H3zm0 6h7v2H3zm16-8.77l1.77 1.77L14.77 12H13v-1.77zM20.85 3.5a.48.48 0 00-.7 0l-.85.85 1.77 1.77.85-.85a.48.48 0 000-.7l-1.07-1.07z"
    />
  </Svg>
);

export const FilterListIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
  </Svg>
);

export const SortIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
  </Svg>
);

export const CloudUploadIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 6L9 17l-5-5"
    />
  </Svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
    />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </Svg>
);

export const BadgeIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"
    />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
    />
  </Svg>
);

export const CallIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
    />
  </Svg>
);

export const LocationIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    />
  </Svg>
);

export const SchoolIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"
    />
  </Svg>
);

export const HistoryEduIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M9 4v3h5v2H9v3h7v2H9v4H7V4h2zm8 10h2v4h-2v-4zm2-10a2 2 0 012 2v2H17V6a2 2 0 012-2zM4 9h2v11H4V9z"
    />
  </Svg>
);

export const MenuBookIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M21 5c-1.11-.9-2.85-1.1-4.32-.4L12 7.18 7.32 4.6C5.85 3.9 4.11 4.1 3 5v14c0 .55.45 1 1 1 .28 0 .56-.12.76-.32L9.5 16.5c1.47-.7 3.2-.5 4.67.2l4.67 2.5c.2.1.48.12.76.12.55 0 1-.45 1-1V5zm-2 12.2l-2.67-1.43c-1.47-.7-3.2-.5-4.67.2L9.5 17.18V7.5c1.47-.7 3.2-.5 4.67.2L16.84 9H19v8.2z"
    />
  </Svg>
);

export const PrivacyTipIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
    />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </Svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
    />
  </Svg>
);

export const FlaskIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M7 2v2h1v10.5c0 2.21 1.79 4 4 4a4 4 0 004-4V4h1V2H7zm5 14.5c-1.38 0-2.5-1.12-2.5-2.5V4h5v10.5c0 1.38-1.12 2.5-2.5 2.5z"
    />
  </Svg>
);

export const BookOpenPageIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M21 5c-1.11-.9-2.85-1.1-4.32-.4L12 7.18 7.32 4.6C5.85 3.9 4.11 4.1 3 5v14c0 .55.45 1 1 1 .28 0 .56-.12.76-.32L9.5 16.5c1.47-.7 3.2-.5 4.67.2l4.67 2.5c.2.1.48.12.76.12.55 0 1-.45 1-1V5zm-2 12.2l-2.67-1.43A7.09 7.09 0 0012 15.5c-.87 0-1.72.14-2.5.43L7 17.2V7.5c1.47-.7 3.2-.5 4.67.2L14.5 9H19v8.2z"
    />
  </Svg>
);

export const ContactlessPayIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
    />
  </Svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#ba1a1a', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
    />
  </Svg>
);

export const ClockOutlineIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
    />
  </Svg>
);

export const CalculatorIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zM7 17v-2h4v2H7zm0-4v-2h4v2H7zm0-4V7h4v2H7z"
    />
  </Svg>
);

export const InformationOutlineIcon: React.FC<IconProps> = ({ size = 24, color = '#723b00', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
    />
  </Svg>
);

export const ParentCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#003fb1', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
    />
  </Svg>
);

export const CreditCardOutlineIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
    />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#006c4a', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"
    />
  </Svg>
);

export const MessageIcon: React.FC<IconProps> = ({ size = 24, color = '#737686', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm0-3h12v2H6V6zm0 6h9v2H6v-2z"
    />
  </Svg>
);


