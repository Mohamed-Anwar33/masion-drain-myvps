import { Outlet } from "react-router-dom";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";

interface RootLayoutProps {
  currentLang: 'en' | 'ar';
}

export const RootLayout = ({ currentLang }: RootLayoutProps) => {
  return (
    <>
      <Outlet />
      <CartDrawer currentLang={currentLang} />
      <WhatsAppFloat currentLang={currentLang} />
    </>
  );
};

export default RootLayout;
