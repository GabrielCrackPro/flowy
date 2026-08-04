import { Icon, type IconProps } from "@/components/shared";
import { PAYMENT_METHOD_ICON } from "@/utils/constants";

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
