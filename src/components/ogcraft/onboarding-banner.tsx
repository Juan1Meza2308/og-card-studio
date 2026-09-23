import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tv, Layout, Sparkles, AlertCircle, Key } from "lucide-react";

const ONBOARDING_KEY = "ogcraft-dashboard-onboarding-done";

export function OnboardingBanner() {
  const [show, setShow] = useState(true);

  // Verificar si ya fue visto
  useEffect(() => {
    const prev = localStorage.getItem(ONBOARDING_KEY);
    if (prev) {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-dashboard/80 backdrop-blur-xl border-b border-border/60 p-4 sm:p-6 animate-fade-up">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Tv className="size-5 mr-3" aria-hidden="true" />
            <h3 className="text-lg font-semibold tracking-tight">Bienvenido al panel de OGCraft</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Esta guía desaparecerá después de la primera visita. Puedes volverla a ver borrando la clave "{ONBOARDING_KEY}" del almacenamiento local.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar onboarding"
            onClick={() => {
              try {
                localStorage.setItem(ONBOARDING_KEY, "1");
                setShow(false);
              } catch (e) {
                console.error("No se pudo guardar el estado del onboarding", e);
              }
            }}
          >
            <Sparkles className="size-4" />
          </Button>
        </div>
        <ul className="mt-6 space-y-3 text-sm text-muted-foreground/80 max-w-2ul">
          <li>
            <Key className="size-4 mr-2" aria-hidden="true" />
            <span>Keys: genera y gestiona tus API keys. Cada key tiene un prefijo y un hash SHA-256 nunca mostrado dos veces.</span>
          </li>
          <li>
            <Layout className="size-4 mr-2" aria-hidden="true" />
            <span>Templates: crea y guarda estilos predeterminados para tus tarjetas. Puedes persistir ajustes en localStorage.</span>
          </li>
          <li>
            <AlertCircle className="size-4 mr-2" aria-hidden="true" />
            <span>Analytics: visualiza tus requests mensuales, tendencias y rendimiento.</span>
          </li>
          <li>
            <Key className="size-4 mr-2" aria-hidden="true" />
            <span>Billing: revisa tu plan Free (100 imágenes/mes) y los límites de uso.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}