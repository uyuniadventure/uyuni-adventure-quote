import { Link } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/db";

export function TemplateQuoteLink({
  template,
  className,
}: {
  template: Pick<Tables<"itinerary_templates">, "id" | "status">;
  className?: string;
}) {
  if (template.status !== "activo" && template.status !== "pendiente") return null;
  return (
    <Button asChild size="sm" variant="outline" className={className}>
      <Link
        to="/nueva-cotizacion"
        search={{ template: template.id }}
        onClick={(event) => event.stopPropagation()}
      >
        <FilePlus2 className="mr-1 h-4 w-4" />
        Crear cotización
      </Link>
    </Button>
  );
}
