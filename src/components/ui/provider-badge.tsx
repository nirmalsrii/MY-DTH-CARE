import { Badge } from "@/components/ui/badge";

export function ProviderBadge({ provider }: { provider: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    tata_play: { label: "Tata Play", bg: "bg-pink-100", text: "text-pink-800" },
    airtel: { label: "Airtel", bg: "bg-red-100", text: "text-red-800" },
    dish_tv: { label: "Dish TV", bg: "bg-orange-100", text: "text-orange-800" },
    sun_direct: { label: "Sun Direct", bg: "bg-yellow-100", text: "text-yellow-800" },
    d2h: { label: "d2h", bg: "bg-blue-100", text: "text-blue-800" },
    zing: { label: "Zing", bg: "bg-purple-100", text: "text-purple-800" },
    dd_freedish: { label: "DD Free Dish", bg: "bg-green-100", text: "text-green-800" },
  };

  const info = map[provider] || { label: provider, bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <Badge variant="outline" className={`${info.bg} ${info.text} border-none font-medium`}>
      {info.label}
    </Badge>
  );
}
