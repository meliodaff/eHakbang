import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { IdWalletScreen } from "@/components/wallet/IdWalletScreen";

export default function WalletPage() {
  return (
    <>
      <EhakbangHeader backHref="/" />
      <IdWalletScreen />
    </>
  );
}
