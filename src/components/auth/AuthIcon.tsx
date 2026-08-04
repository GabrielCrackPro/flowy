import { cn } from "@lib/utils";

export interface AuthIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function AuthIcon({
  size = 20,
  className,
  children,
  ...props
}: AuthIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
