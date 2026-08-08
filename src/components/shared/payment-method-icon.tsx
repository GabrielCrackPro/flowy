import { PAYMENT_METHOD_ICON } from "@/utils/constants";
import { Icon, type IconProps } from "./icon";

interface PaymentMethodIconProps {
  method?: string | null;
  icon?: IconProps["icon"];
  className?: string;
}

export function PaymentMethodIcon({
  method,
  icon: FallbackIcon,
  className,
}: PaymentMethodIconProps) {
  const IconComponent =
    method && method in PAYMENT_METHOD_ICON
      ? PAYMENT_METHOD_ICON[method as keyof typeof PAYMENT_METHOD_ICON]
      : FallbackIcon;

  if (!IconComponent) return null;

  return <Icon icon={IconComponent} className={className} />;
}
