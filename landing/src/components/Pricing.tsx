import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { CtaButton } from "./CtaButton";

enum PopularPlanType {
  NO = 0,
  YES = 1,
}

interface PricingProps {
  title: string;
  popular: PopularPlanType;
  /** Precio mensual en €. Pon null mientras no se muestre precio en la web. */
  price: number | null;
  description: string;
  buttonText: string;
  /** Módulos del CRM incluidos */
  benefitList: string[];
  /** Funcionalidad destacada del pack (ocupa la fila completa) */
  highlight?: string;
  bonusList: string[];
}

const crmModules: string[] = [
  "Cobros",
  "Gastos",
  "Interesados",
  "Inquilinos",
  "Inmuebles",
  "Contratos",
  "Contabilidad",
  "Prorrateo",
  "Facturación",
  "Propietarios",
  "Gestores en equipo",
  "Drive",
  "Importar con IA",
];

const pricingList: PricingProps[] = [
  {
    title: "Pack Nize Premium",
    popular: 0,
    price: null,
    description: "Nize, el CRM que gestiona todo tu negocio.",
    buttonText: "Empezar mis 7 días gratis",
    benefitList: crmModules,
    bonusList: [
      "Tutoriales de funcionamiento para ti",
      "Permanencia a la información del CRM, exportable cuando se desee",
      "Soporte permanente con feedback para añadir funcionalidades",
    ],
  },
  {
    title: "Pack Nize Elite Gold",
    popular: 1,
    price: null,
    description:
      "Nize, el CRM que gestiona todo tu negocio, más el asistente de WhatsApp.",
    buttonText: "Lo quiero completo",
    benefitList: crmModules,
    highlight:
      "Asistente: gestiona incidencias, pagos e interesados desde WhatsApp",
    bonusList: [
      "Tutoriales de funcionamiento para ti y tus inquilinos",
      "Soporte permanente con feedback para añadir funcionalidades",
      "Permanencia a la información del CRM, exportable cuando se desee",
      "Tutorial 1 a 1 para aprender todas las funcionalidades del CRM y la configuración principal",
    ],
  },
];

export const Pricing = () => {
  return (
    <section
      id="precios"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Elige el pack que
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          encaja{" "}
        </span>
        contigo
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        Empiezas con 7 días de prueba gratis, en menos de 5 minutos y sin tener
        que ser un experto en tecnología.
      </h3>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {pricingList.map((pricing: PricingProps) => (
          <Card
            key={pricing.title}
            className={
              pricing.popular === PopularPlanType.YES
                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-primary/50"
                : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex item-center justify-between gap-2">
                {pricing.title}
                {pricing.popular === PopularPlanType.YES ? (
                  <Badge
                    variant="secondary"
                    className="text-sm text-primary shrink-0 h-fit"
                  >
                    El más completo
                  </Badge>
                ) : null}
              </CardTitle>
              <div>
                {pricing.price !== null ? (
                  <>
                    <span className="text-3xl font-bold">{pricing.price}€</span>
                    <span className="text-muted-foreground"> /mes</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">7 días gratis</span>
                    <span className="text-muted-foreground"> para probarlo</span>
                  </>
                )}
              </div>

              <CardDescription>{pricing.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <CtaButton
                className="w-full"
                label={pricing.buttonText}
                variant={
                  pricing.popular === PopularPlanType.YES
                    ? "default"
                    : "outline"
                }
              />
            </CardContent>

            <hr className="w-4/5 m-auto mb-4" />

            <CardFooter className="flex flex-col items-start gap-4">
              {pricing.highlight ? (
                <span className="flex bg-primary/10 rounded-md p-3 w-full">
                  <Sparkles className="text-primary shrink-0" />
                  <h3 className="ml-2 font-medium">{pricing.highlight}</h3>
                </span>
              ) : null}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full">
                {pricing.benefitList.map((benefit: string) => (
                  <span
                    key={benefit}
                    className="flex"
                  >
                    <Check className="text-green-500 shrink-0" />{" "}
                    <h3 className="ml-2">{benefit}</h3>
                  </span>
                ))}
              </div>

              <div className="space-y-3 w-full pt-2 border-t">
                {pricing.bonusList.map((bonus: string) => (
                  <span
                    key={bonus}
                    className="flex pt-1"
                  >
                    <Sparkles className="text-primary shrink-0" />
                    <h3 className="ml-2">
                      <span className="font-semibold">BONUS:</span> {bonus}
                    </h3>
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
