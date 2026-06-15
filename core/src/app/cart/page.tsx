import { getSettings } from "../../lib/settings";
import CartView from "../../components/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();
  return <CartView commerceEnabled={settings.commerceEnabled} />;
}
