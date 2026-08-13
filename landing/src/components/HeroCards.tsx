import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { LightBulbIcon } from "./Icons";
import { CtaButton } from "./CtaButton";
import logo from "../assets/nize-isotipo.png";
import martin from "../assets/equipo-martin.jpeg";
import gabi from "../assets/equipo-gabi.jpeg";
import antonio from "../assets/equipo-antonio.jpeg";

export const HeroCards = () => {
  return (
    <div className="flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px]">
      {/* Producto */}
      <Card className="absolute w-[340px] -top-[15px] drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar>
            <AvatarImage
              alt="Nize"
              src={logo}
            />
            <AvatarFallback>NZ</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <CardTitle className="text-lg">Nize</CardTitle>
            <CardDescription>El CRM que gestiona tu negocio</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          Cobros, gastos, contratos, contabilidad y facturación en un solo
          sitio.
        </CardContent>
      </Card>

      {/* Equipo */}
      <Card className="absolute right-[20px] top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader className="mt-8 flex justify-center items-center pb-2">
          <div className="absolute -top-10 flex -space-x-4">
            {[
              { src: martin, name: "Martín", position: "object-center" },
              { src: gabi, name: "Gabi", position: "object-center" },
              // Foto más alargada que las otras dos: con recorte centrado se le corta la cara.
              { src: antonio, name: "Antonio", position: "object-[center_15%]" },
            ].map(({ src, name, position }) => (
              <img
                key={name}
                src={src}
                alt={name}
                className={`rounded-full w-20 h-20 aspect-square object-cover border-4 border-background ${position}`}
              />
            ))}
          </div>
          <CardTitle className="text-center">Martín, Gabi y Antonio</CardTitle>
          <CardDescription className="font-normal text-primary">
            Fundadores de Automanize
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-6">
          <p>
            Trabajamos en optimizar gestores inmobiliarios para que tengan
            tiempo libre
          </p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="absolute top-[150px] left-[50px] w-72  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader>
          <CardTitle className="flex item-center justify-between">
            Nize Premium
            <Badge
              variant="secondary"
              className="text-sm text-primary"
            >
              7 días gratis
            </Badge>
          </CardTitle>

          <CardDescription>
            Todo el CRM funcionando en menos de 5 minutos.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CtaButton
            className="w-full"
            label="Empezar prueba gratis"
          />
        </CardContent>

        <hr className="w-4/5 m-auto mb-4" />

        <CardFooter className="flex">
          <div className="space-y-4">
            {["Cobros y gastos", "Contratos y contabilidad", "Facturación"].map(
              (benefit: string) => (
                <span
                  key={benefit}
                  className="flex"
                >
                  <Check className="text-green-500" />{" "}
                  <h3 className="ml-2">{benefit}</h3>
                </span>
              )
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Funcionalidad */}
      <Card className="absolute w-[350px] -right-[10px] bottom-[35px]  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
          <div className="mt-1 bg-primary/20 p-1 rounded-2xl">
            <LightBulbIcon />
          </div>
          <div>
            <CardTitle>Importar con IA</CardTitle>
            <CardDescription className="text-md mt-2">
              Pásale PDFs, fotos, textos o audios y mete toda la información de
              tu negocio automáticamente.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
