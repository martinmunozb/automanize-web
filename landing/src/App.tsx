import { About } from "./components/About";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Pricing } from "./components/Pricing";
import { ScrollToTop } from "./components/ScrollToTop";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />

      {/* Primera sección */}
      <Hero />

      {/* Segunda sección */}
      <About />
      <FAQ />
      <Pricing />

      <Footer />
      <ScrollToTop />
    </>
  );
}

export default App;
