import { AudioPlayer } from "@/components/AudioPlayer";
import { LogoScene } from "@/components/LogoScene";
import styles from "./page.module.css";

const services = [
  {
    number: "01",
    title: "Producción musical",
    description:
      "Desarrollamos el lenguaje de cada proyecto desde la primera maqueta hasta su versión definitiva.",
  },
  {
    number: "02",
    title: "Grabación",
    description:
      "Voces, instrumentos y texturas capturados con precisión, carácter y espacio para experimentar.",
  },
  {
    number: "03",
    title: "Mezcla",
    description:
      "Profundidad, impacto y detalle para que cada elemento encuentre su sitio sin perder personalidad.",
  },
  {
    number: "04",
    title: "Mastering",
    description:
      "El último paso para llevar cada mezcla a su nivel final: equilibrio, impacto y traducción en cualquier sistema.",
  },
] as const;

const projects = [
  { title: "Archivo 001", category: "Producción · Artista", year: "2026" },
  { title: "Archivo 002", category: "Mezcla · Artista", year: "2026" },
  { title: "Archivo 003", category: "Mastering · Artista", year: "2026" },
] as const;

export default function Home() {
  return (
    <>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="MAGMA, inicio">
          MAGMA<sup>®</sup>
        </a>

        <nav className={styles.navigation} aria-label="Navegación principal">
          <a href="#estudio" data-label="Estudio">
            <span>Estudio</span>
          </a>

          <a href="#servicios" data-label="Servicios">
            <span>Servicios</span>
          </a>

          <a href="#proyectos" data-label="Proyectos">
            <span>Proyectos</span>
          </a>

          <a href="#contacto" data-label="Contacto">
            <span>Contacto</span>
          </a>
        </nav>

        <a className={styles.availability} href="#contacto">
          <span aria-hidden="true" /> Disponible para proyectos
        </a>
      </header>

      <main>
        <section className={styles.hero} id="inicio" aria-labelledby="hero-title">
          <h1 className={styles.srOnly} id="hero-title">
            MAGMA, estudio de música contemporánea
          </h1>

          <div className={styles.scene} aria-hidden="true">
            <LogoScene />
          </div>

          <AudioPlayer />

          <div className={styles.heroMeta}>
            <p>
              Estudio independiente
              <br />
              de música contemporánea
            </p>
            <p>
              Producción · Grabación
              <br />
              Mezcla · Mastering
            </p>
            <a href="#estudio">Desliza para entrar ↓</a>
          </div>
        </section>

        <section className={styles.manifesto} id="estudio">
          <div className={styles.sectionLabel}>
            <span>(01)</span>
            <span>El estudio</span>
          </div>

          <div className={styles.manifestoContent}>
            <h2>
              El sonido no
              <br />
              se decora.
              <br />
              Se construye.
            </h2>
            <p>
              Trabajamos con artistas y proyectos que buscan una identidad
              sonora propia. De la primera idea al máster final, cada decisión
              tiene intención.
            </p>
          </div>
        </section>

        <div className={styles.ticker} aria-hidden="true">
          <div>
            <span>Producción</span>
            <span>Grabación</span>
            <span>Mezcla</span>
            <span>Mastering</span>
            <span>Producción</span>
            <span>Grabación</span>
            <span>Mezcla</span>
            <span>Mastering</span>
          </div>
        </div>

        <section className={styles.services} id="servicios">
          <div className={styles.sectionLabel}>
            <span>(02)</span>
            <span>Qué hacemos</span>
          </div>

          <div className={styles.serviceList}>
            {services.map((service) => (
              <article className={styles.service} key={service.number}>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.projects} id="proyectos">
          <div className={styles.sectionLabel}>
            <span>(03)</span>
            <span>Archivo seleccionado</span>
          </div>

          <div className={styles.projectIntro}>
            <h2>Sonidos con una forma propia.</h2>
            <p>
              Una selección provisional para construir después el archivo real
              del estudio.
            </p>
          </div>

          <div className={styles.projectList}>
            {projects.map((project, index) => (
              <article className={styles.project} key={project.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{project.title}</h3>
                <p>{project.category}</p>
                <time>{project.year}</time>
                <span className={styles.projectArrow} aria-hidden="true">
                  ↗
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.contact} id="contacto">
          <div className={styles.sectionLabel}>
            <span>(04)</span>
            <span>Contacto</span>
          </div>

          <div className={styles.contactContent}>
            <p>¿Tienes algo en mente?</p>
            <a href="mailto:hola@magma.studio">Hablemos ↗</a>
          </div>

          <footer className={styles.footer}>
            <span>MAGMA®</span>
            <span>Estudio de música contemporánea</span>
            <span>© {new Date().getFullYear()}</span>
          </footer>
        </section>
      </main>
    </>
  );
}
