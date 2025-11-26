import { Button } from "./button"

const ShieldIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.5 23.7222C10.2477 23.1551 8.38832 21.8629 6.92188 19.8455C5.45545 17.8281 4.72223 15.588 4.72223 13.125V7.19445L12.5 4.27778L20.2778 7.19445V13.125C20.2778 15.588 19.5446 17.8281 18.0781 19.8455C16.6117 21.8629 14.7523 23.1551 12.5 23.7222ZM12.5 21.6806C14.1852 21.1458 15.5787 20.0764 16.6806 18.4722C17.7824 16.8681 18.3333 15.0857 18.3333 13.125V8.53126L12.5 6.34376L6.66667 8.53126V13.125C6.66667 15.0857 7.2176 16.8681 8.31945 18.4722C9.4213 20.0764 10.8148 21.1458 12.5 21.6806Z"
      fill="#859ABB"
    />
  </svg>
)

const LogoutIcon = () => (
  <svg
    width="25"
    height="28"
    viewBox="0 0 25 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.72222 23.2C4.11111 23.2 3.58796 22.9824 3.15278 22.5472C2.71759 22.112 2.5 21.5889 2.5 20.9778V5.42223C2.5 4.81112 2.71759 4.28798 3.15278 3.85279C3.58796 3.4176 4.11111 3.20001 4.72222 3.20001H12.5V5.42223H4.72222V20.9778H12.5V23.2H4.72222ZM16.9444 18.7556L15.4167 17.1445L18.25 14.3111H9.16667V12.0889H18.25L15.4167 9.25557L16.9444 7.64446L22.5 13.2L16.9444 18.7556Z"
      fill="#97A2B5"
    />
  </svg>
)

interface HeaderProps {
  onLogout?: () => void
}

const Header = ({ onLogout }: HeaderProps) => {
  return (
    <header className="border-b-[1.25px] border-[#384454] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <ShieldIcon />
          <span className="text-xl font-bold leading-[25px] tracking-[-0.3px] text-[#859ABB]">
            LicenseGuard
          </span>
        </div>
        <Button variant="link" rightIcon={<LogoutIcon />} onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}

Header.displayName = "Header";

export { Header };
