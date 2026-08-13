import logo from "../assets/nize-isotipo.png";

export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
        <div className="col-span-full md:col-span-2">
          <a
            rel="noreferrer noopener"
            href="/"
            className="font-bold text-xl flex items-center"
          >
            <img
              src={logo}
              alt="Automanize"
              className="mr-2 w-7 h-7 object-contain"
            />
            Automanize
          </a>
          <p className="mt-4 text-muted-foreground md:w-3/4">
            Optimizamos gestores inmobiliarios para que tengan tiempo libre.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Secciones</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#nosotros"
              className="opacity-60 hover:opacity-100"
            >
              Nosotros
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#faq"
              className="opacity-60 hover:opacity-100"
            >
              Preguntas
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#precios"
              className="opacity-60 hover:opacity-100"
            >
              Packs
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-bold text-lg">Contacto</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="mailto:automanize@gmail.com"
              className="opacity-60 hover:opacity-100 break-words"
            >
              automanize@gmail.com
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="https://automanize.com"
              target="_blank"
              className="opacity-60 hover:opacity-100 break-words"
            >
              automanize.com
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>&copy; 2026 Automanize</h3>
      </section>
    </footer>
  );
};
