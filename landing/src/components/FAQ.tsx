import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "¿Por qué tengo que contratar este CRM y no otros?",
    answer:
      "Hemos estado analizando el mercado y adaptando el sistema a las necesidades reales de nuestro cliente. Empezamos con una idea y, a través de hacer muchas, pero muchas llamadas de venta, empezamos a perfeccionar todo y a sacar muchas variables para poder tener un todo en 1.",
    value: "item-1",
  },
  {
    question: "¿Cómo se supone que empezaría esto?",
    answer:
      "Básicamente, en el momento que te registres te llegará un código para poder descargar el programa y comenzar. Tendrás una prueba de 7 días gratis en la que podrás probar todo lo que quieras y, luego de esto, podrás obtener el plan normal sin asistente de WhatsApp o hacer una llamada con nosotros para implantarte directamente el bicho completo.",
    value: "item-2",
  },
  {
    question: "¿Cuánto tiempo tardo en empezar?",
    answer:
      "Entendimos que el tiempo era un problema para nuestro cliente, por lo que lo hemos optimizado para que una vez dentro puedas pasarle PDFs, fotos, textos y audios para meter toda la información de tu negocio automáticamente.",
    value: "item-3",
  },
  {
    question: "¿Y si trabajo con un equipo, cómo lo hago?",
    answer:
      "Conocemos estos casos en los que trabaja más de una persona y hemos añadido el apartado de gestores, mediante el cual puedes dar de alta a tus trabajadores y que ellos tengan acceso a las cosas que tú les permitas. Si no quieres que vean cuánto dinero ganas, no es un problema 😉",
    value: "item-4",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Voy a responder a todas las{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          preguntas
        </span>{" "}
        que te estás haciendo
      </h2>

      <Accordion
        type="single"
        collapsible
        className="w-full AccordionRoot"
      >
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem
            key={value}
            value={value}
          >
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        ¿Te queda alguna duda?{" "}
        <a
          rel="noreferrer noopener"
          href="mailto:automanize@gmail.com"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Escríbenos
        </a>
      </h3>
    </section>
  );
};
