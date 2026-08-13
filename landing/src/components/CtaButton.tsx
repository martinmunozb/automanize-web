import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Check, Loader2 } from "lucide-react";

/**
 * Endpoint al que se envía el lead del pop-up.
 * Se configura en un archivo .env con VITE_LEAD_WEBHOOK_URL=https://...
 * Si no está configurado, el formulario no envía nada y solo muestra
 * la pantalla de confirmación (útil para desarrollo).
 */
const LEAD_WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL as
  | string
  | undefined;

type FormStatus = "idle" | "sending" | "success" | "error";

interface CtaButtonProps {
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export const CtaButton = ({
  label = "Empieza tu prueba gratis",
  className = "",
  variant = "default",
  size = "default",
}: CtaButtonProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    const formData = new FormData(event.currentTarget);
    const payload = {
      nombre: formData.get("nombre"),
      email: formData.get("email"),
      telefono: formData.get("telefono"),
      inmuebles: formData.get("inmuebles"),
      origen: "landing-nize",
    };

    if (!LEAD_WEBHOOK_URL) {
      console.info("[CtaButton] Sin VITE_LEAD_WEBHOOK_URL. Lead:", payload);
      setStatus("success");
      return;
    }

    try {
      const response = await fetch(LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setStatus("idle");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        {status === "success" ? (
          <>
            <DialogHeader>
              <div className="mx-auto sm:mx-0 mb-2 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                Ya está, te escribimos enseguida
              </DialogTitle>
              <DialogDescription className="text-base">
                Te llegará un código para descargar el programa y empezar tus 7
                días de prueba gratis. Si tienes cualquier duda antes,
                respóndenos al mismo correo.
              </DialogDescription>
            </DialogHeader>

            <Button
              className="w-full mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Pruébalo GRATIS 7 días
              </DialogTitle>
              <DialogDescription className="text-base">
                Déjanos tus datos y te mandamos el código para descargar Nize.
                Empiezas en menos de 5 minutos y sin ser un experto en
                tecnología.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 pt-2"
            >
              <div className="grid gap-2">
                <label
                  htmlFor="nombre"
                  className="text-sm font-medium"
                >
                  Nombre
                </label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="telefono"
                  className="text-sm font-medium"
                >
                  Teléfono
                </label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="600 000 000"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="inmuebles"
                  className="text-sm font-medium"
                >
                  ¿Cuántos inmuebles gestionas?{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <Input
                  id="inmuebles"
                  name="inmuebles"
                  placeholder="Ej: 40"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-destructive">
                  No hemos podido enviarlo. Inténtalo otra vez o escríbenos a
                  automanize@gmail.com
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Quiero probarlo gratis"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Sin compromiso y sin tarjeta. Solo usamos tus datos para darte
                acceso.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
