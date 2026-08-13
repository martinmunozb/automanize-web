import { CtaButton } from "./CtaButton";
import martin from "../assets/equipo-martin.jpeg";
import gabi from "../assets/equipo-gabi.jpeg";
import antonio from "../assets/equipo-antonio.jpeg";

const founders = [
  { src: martin, name: "Martín", position: "object-center" },
  { src: gabi, name: "Gabi", position: "object-center" },
  // Foto más alargada que las otras dos: con recorte centrado se le corta la cara.
  { src: antonio, name: "Antonio", position: "object-[center_15%]" },
];

export const About = () => {
  return (
    <section
      id="nosotros"
      className="container py-24 sm:py-32"
    >
      <div className="bg-muted/50 border rounded-lg py-12">
        <div className="px-6 flex flex-col gap-8 md:gap-12">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {founders.map(({ src, name, position }) => (
              <div
                key={name}
                className="relative overflow-hidden rounded-lg"
              >
                <img
                  src={src}
                  alt={name}
                  className={`w-full aspect-[4/5] md:aspect-[4/3] object-cover ${position}`}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm md:text-base font-medium px-3 pt-8 pb-2">
                  {name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                  Somos{" "}
                </span>
                Martín, Gabi y Antonio
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
                Trabajamos en optimizar gestores inmobiliarios para que tengan
                tiempo libre. Fundamos Automanize para ponerle solución a que
                este trabajo fuese un trabajo beneficioso a nivel de dinero pero
                no de tiempo.
              </p>
              <p className="text-xl text-muted-foreground mt-4">
                Hemos estado trabajando, y sacando información con muchos
                referentes del sector, perfeccionando el CRM a todo tipo de
                negocio.
              </p>
              <p className="text-xl text-muted-foreground mt-4">
                Empezamos hace aproximadamente 6 meses y ya verás el bicho que
                tenemos montado. Y lo mejor de esto es que solo acaba de
                empezar…
              </p>
            </div>

            <CtaButton className="w-full md:w-1/3" />
          </div>
        </div>
      </div>
    </section>
  );
};
