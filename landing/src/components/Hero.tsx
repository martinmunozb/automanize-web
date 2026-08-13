import { HeroCards } from "./HeroCards";
import { CtaButton } from "./CtaButton";
import { Check } from "lucide-react";
import logo from "../assets/nize-isotipo.png";

const heroBenefits: string[] = [
  "Pruébalo GRATIS y descubre si es para ti",
  "Empiezas en menos de 5 minutos",
  "Sin tener que ser un experto en tecnología",
];

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        {/* Logo */}
        <div className="flex justify-center lg:justify-start items-center gap-3">
          <img
            src={logo}
            alt="Automanize"
            className="w-12 h-12 object-contain"
          />
          <span className="text-2xl font-bold tracking-tight">Automanize</span>
        </div>

        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            Sé que no tienes{" "}
            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
              tiempo libre
            </span>
            , tranquilo{" "}
          </h1>{" "}
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#61DAFB] via-[#1fc0f1] to-[#03a3d7] text-transparent bg-clip-text">
              no es tu culpa
            </span>
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Conoce el sistema mediante el cual vas a conseguir manejar tu negocio
          sin estar todo el día en él, ponlo en marcha en menos de 5 minutos.
        </p>

        <div className="space-y-3 flex flex-col items-center lg:items-start">
          {heroBenefits.map((benefit: string) => (
            <span
              key={benefit}
              className="flex items-center text-left"
            >
              <Check className="text-green-500 shrink-0" />
              <h3 className="ml-2 text-lg text-muted-foreground">{benefit}</h3>
            </span>
          ))}
        </div>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <CtaButton className="w-full md:w-2/3" />
        </div>
      </div>

      {/* Hero cards sections: se van ampliando por tramos de ancho de pantalla
          para que quepan sin desbordar en portátiles (1024-1479px) y se vean
          a tamaño completo a partir de 1480px */}
      <div
        className="hidden lg:block z-10 origin-top-left
          lg:scale-[0.55] lg:w-[385px] lg:h-[275px]
          min-[1220px]:scale-[0.7] min-[1220px]:w-[490px] min-[1220px]:h-[350px]
          min-[1360px]:scale-[0.85] min-[1360px]:w-[595px] min-[1360px]:h-[425px]
          min-[1480px]:scale-100 min-[1480px]:w-[700px] min-[1480px]:h-[500px]"
      >
        <HeroCards />
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>
    </section>
  );
};
