import { AudioPlayer } from "@/components/AudioPlayer";
import { LogoScene } from "@/components/LogoScene";
import { MobileSceneControls } from "@/components/MobileSceneControls";
import { SiteHeader } from "@/components/SiteHeader";
import { DeferredStudio } from "@/components/DeferredStudio";
import styles from "./page.module.css";

const QUOTE_EMAIL = "hola@magmaestudio.com";

function getQuoteHref(service: string) {
  const subject = encodeURIComponent(`Presupuesto — ${service}`);
  const body = encodeURIComponent(
    `Hola MAGMA,\n\nQuiero solicitar presupuesto para ${service}.`,
  );

  return `mailto:${QUOTE_EMAIL}?subject=${subject}&body=${body}`;
}

const primaryServices = [
  {
    number: "01",
    label: "Servicio",
    title: "Mezcla",
    description:
      "Trabajamos tus pistas para construir una mezcla con profundidad, impacto y personalidad, manteniendo intacta la intención del proyecto.",
    details: [
      "Envía tus pistas",
      "3 cambios incluidos",
      "Entrega de distintas versiones",
    ],
  },
  {
    number: "02",
    label: "Servicio",
    title: "Mastering",
    description:
      "El acabado final para que tu música conserve su carácter y traduzca con claridad, energía y equilibrio en cualquier sistema de escucha.",
    details: [
      "Master estéreo listo para distribución",
      "Optimización para plataformas digitales",
      "Equilibrio y presencia",
    ],
  },
] as const;

const studioServices = [
  {
    number: "03",
    title: "Producción musical",
    description:
      "Desarrollamos el lenguaje del proyecto desde la primera idea, trabajando estructura, sonido y dirección hasta encontrar una identidad propia.",
    scope: "Composición · Arreglos · Diseño sonoro",
  },
  {
    number: "04",
    title: "Grabación",
    description:
      "Grabamos voces e instrumentos con una cadena cuidada y una dirección centrada en conseguir la interpretación adecuada para cada canción.",
    scope: "Voces · Instrumentos · Edición",
  },
  {
    number: "05",
    title: "Sesiones de estudio",
    description:
      "Reserva el espacio para producir, escribir, experimentar o avanzar tu proyecto con acompañamiento técnico y creativo cuando lo necesites.",
    scope: "Por horas · Media jornada · Jornada completa",
  },
  {
    number: "06",
    title: "Pack completo",
    description:
      "Un proceso integral para desarrollar y terminar una canción o proyecto dentro de una misma visión, desde la idea inicial hasta la entrega final.",
    scope: "Producción · Grabación · Mezcla · Mastering",
  },
  {
    number: "07",
    title: "Pack grabación + mezcla + mastering",
    description:
      "Grabamos el proyecto en el estudio y continuamos el proceso hasta conseguir una mezcla terminada y un máster listo para su distribución.",
    scope: "1 h 30 min de grabación · Mezcla · Mastering",
  },
  {
    number: "08",
    title: "Pack mezcla + mastering",
    description:
      "Trabajamos la mezcla y el acabado final como un único proceso para mantener la coherencia, el carácter y el impacto de la canción.",
    scope: "Mezcla · Mastering",
  },
] as const;

const tickerItems = [
  "Producción",
  "Grabación",
  "Mezcla",
  "Mastering",
  "Producción",
  "Grabación",
  "Mezcla",
  "Mastering",
] as const;

const projects = [
  {
    artist: "Rever, Wachu",
    date: "2026-07-10",
    dateLabel: "10.07.2026",
    href: "https://open.spotify.com/track/78iB1CQ5KaQXwqseyLEz27",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "MUEVELO",
  },
  {
    artist: "Rever, Wachu, LKTN",
    date: "2025-12-18",
    dateLabel: "18.12.2025",
    href: "https://open.spotify.com/track/5U4Jz9wK5IGT6Pv8CFkFub",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "Cuando te veo",
  },
  {
    artist: "Mushkilla, Wachu, Vitala",
    date: "2025-09-24",
    dateLabel: "24.09.2025",
    href: "https://open.spotify.com/track/78HYzb9mMmAlu23NDLhxud",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "Club One",
  },
  {
    artist: "Wachu",
    date: "2026-05-14",
    dateLabel: "14.05.2026",
    href: "https://open.spotify.com/album/1mRZhfBK8j1wv3NHB5aWL4",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "EXPLOIT",
  },
  {
    artist: "Rever, Wachu",
    date: "2025-10-30",
    dateLabel: "30.10.2025",
    href: "https://open.spotify.com/track/0XMseX9Iomuwt8Dg8kb9Dc",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "Siempre es tarde",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className={styles.hero} id="inicio" aria-labelledby="hero-title">
          <h1 className={styles.srOnly} id="hero-title">
            MAGMA, estudio de música contemporánea
          </h1>

          <div className={styles.scene}>
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

        <section
          aria-labelledby="studio-title"
          className={styles.manifesto}
          id="estudio"
        >
            <div className={styles.studioShowcase}>
              <div className={styles.sectionLabel}>
                <span>(01)</span>
                <span>El estudio</span>
              </div>

              <h2 className={styles.studioTitle} id="studio-title">
                Nuestro equipo
              </h2>

              <div
                aria-label="Vista tridimensional interactiva del estudio MAGMA"
                className={styles.studioScene}
                role="application"
              >
                <MobileSceneControls label="⛶ Pantalla completa">
                  <DeferredStudio />
                </MobileSceneControls>
                <p className={styles.studioHint}>
                  <span className={styles.desktopHint}>
                    Arrastra para girar · ⌥ + scroll para zoom · Clica un equipo
                  </span>
                  <span className={styles.mobileHint}>
                    Arrastra para girar · Pellizca para zoom · Toca un equipo
                  </span>
                </p>
              </div>
            </div>
        </section>

        <div className={styles.ticker} aria-hidden="true">
            <div className={styles.tickerTrack}>
              <div className={styles.tickerGroup}>
                {tickerItems.map((item, index) => (
                  <span key={`${item}-${index}`}>
                    {item}<svg className={styles.tickerSeparator} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" /></svg>
                  </span>
                ))}
              </div>
              <div className={styles.tickerGroup}>
                {tickerItems.map((item, index) => (
                  <span key={`${item}-duplicate-${index}`}>
                    {item}<svg className={styles.tickerSeparator} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" /></svg>
                  </span>
                ))}
              </div>
            </div>
        </div>

        <section className={styles.services} id="servicios">
          <div className={styles.sectionLabel}>
            <span>(02)</span>
            <span>Servicios</span>
          </div>

          <div className={styles.serviceIntro}>
            <h2>
              Mezcla y mastering
              <br />
              con identidad propia.
            </h2>

            <div>
              <p>
                Grabas y produces tu canción, pero le falta presencia, impacto,
                carácter... Tocas ruletas y botones, pero no consigues que suene
                como ese tema que no paras de escuchar... Mándanos tus pistas y
                nosotros hacemos el resto. O, si no tienes dónde grabar, ¡ven a
                grabarlo al estudio!
              </p>
              <a
                href={`mailto:${QUOTE_EMAIL}?subject=Mezcla%20y%20mastering`}
              >
                Envíanos tu proyecto ↗
              </a>
            </div>
          </div>

          <div className={styles.onlineServiceList}>
            {primaryServices.map((service) => (
              <article className={styles.onlineService} key={service.number}>
                <div className={styles.onlineServiceMeta}>
                  <span>({service.number})</span>
                  <span>{service.label}</span>
                </div>

                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <ul>
                  {service.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>

                <div className={styles.serviceAction}>
                  <a
                    className={styles.quoteButton}
                    href={getQuoteHref(service.title)}
                  >
                    Solicitar presupuesto ↗
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.serviceList}>
            {studioServices.map((service) => (
              <article className={styles.service} key={service.number}>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <div className={styles.serviceCopy}>
                  <p>{service.description}</p>
                  <span>{service.scope}</span>

                  <div className={styles.serviceAction}>
                    <a
                      className={styles.quoteButton}
                      href={getQuoteHref(service.title)}
                    >
                      Solicitar presupuesto ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.projects} id="proyectos">
          <div className={styles.sectionLabel}>
            <span>(03)</span>
            <span>Trabajos</span>
          </div>

          <div className={styles.projectIntro}>
            <h2>Trabajos que hemos hecho.</h2>
            <p>
              Descubre una selección de proyectos
              construidos en el estudio.
            </p>
          </div>

          <div className={styles.projectBlock}>
            <div className={styles.projectBlockHeader}>
              <span>(03—A)</span>
              <h3>Últimos trabajos</h3>
              <p>Lo último en salir del horno</p>
            </div>

            <div className={styles.projectList}>
              {projects.map((project) => (
                <article className={styles.projectEntry} key={project.title}>
                  <div className={styles.projectDetails}>
                    <h4>
                      <a href={project.href} target="_blank" rel="noreferrer">
                        {project.title}
                      </a>
                    </h4>
                    <p>{project.service}</p>
                  </div>
                <iframe
                  className={styles.spotifyPlayer}
                  src={`${project.href.replace("open.spotify.com/", "open.spotify.com/embed/")}?utm_source=generator&theme=0`}
                  title={`Reproductor de Spotify: ${project.title} — ${project.artist}`}
                  width="100%"
                  height="152"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.contact} id="contacto">
          <div className={styles.sectionLabel}>
            <span>(04)</span>
            <span>Contacto</span>
          </div>

          <div className={styles.contactContent}>
            <p>¿Tienes algo en mente?</p>
            <a href={`mailto:${QUOTE_EMAIL}`}>
              <span>Hablemos</span>
              <span aria-hidden="true" className={styles.contactArrow}>
                <svg viewBox="0 0 24 24" focusable="false"><path d="M5 19 19 5M5 5h14v14" /></svg>
              </span>
            </a>
          </div>

          <div className={styles.contactLayout}>
            <div className={styles.contactIntro}>
              <p>
                Cuéntanos qué estás preparando, qué servicio necesitas y en qué
                punto se encuentra tu proyecto.
              </p>
              <a href={`mailto:${QUOTE_EMAIL}`}>{QUOTE_EMAIL}</a>
            </div>

            <form
              action={`https://formsubmit.co/${QUOTE_EMAIL}`}
              className={styles.contactForm}
              method="POST"
            >
              <input
                name="_subject"
                type="hidden"
                value="Nuevo proyecto desde la web de MAGMA"
              />
              <input name="_template" type="hidden" value="table" />
              <input
                aria-hidden="true"
                autoComplete="off"
                className={styles.contactHoney}
                name="_honey"
                tabIndex={-1}
                type="text"
              />

              <div className={styles.contactField}>
                <label htmlFor="contact-name">Nombre / artista</label>
                <input
                  autoComplete="name"
                  id="contact-name"
                  name="nombre"
                  placeholder="Tu nombre"
                  required
                  type="text"
                />
              </div>

              <div className={styles.contactField}>
                <label htmlFor="contact-email">Email</label>
                <input
                  autoComplete="email"
                  id="contact-email"
                  name="email"
                  placeholder="tu@email.com"
                  required
                  type="email"
                />
              </div>

              <div className={styles.contactField}>
                <label htmlFor="contact-service">Servicio</label>
                <select defaultValue="" id="contact-service" name="servicio" required>
                  <option disabled value="">
                    Selecciona un servicio
                  </option>
                  <option>Mezcla</option>
                  <option>Mastering</option>
                  <option>Producción musical</option>
                  <option>Grabación</option>
                  <option>Sesión de estudio</option>
                  <option>Pack completo</option>
                  <option>Otro</option>
                </select>
              </div>

              <div className={`${styles.contactField} ${styles.contactMessage}`}>
                <label htmlFor="contact-message">Cuéntanos sobre el proyecto</label>
                <textarea
                  id="contact-message"
                  name="mensaje"
                  placeholder="Qué quieres conseguir, referencias, número de canciones, fechas..."
                  required
                  rows={5}
                />
              </div>

              <div className={styles.contactSubmit}>
                <p>Responderemos lo antes posible.</p>
                <button type="submit">Enviar proyecto ↗</button>
              </div>
            </form>
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
