import { AudioPlayer } from "@/components/AudioPlayer";
import { LogoScene } from "@/components/LogoScene";
import { SiteHeader } from "@/components/SiteHeader";
import { StudioScene } from "@/components/StudioScene";
import styles from "./page.module.css";

const QUOTE_EMAIL = "magmastudio46520@gmail.com";

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
    price: "Desde 40 €",
    rates: [
      { label: "Hasta 4 pistas", price: "40 €" },
      { label: "Hasta 8 pistas", price: "70 €" },
      { label: "Hasta 16 pistas", price: "110 €" },
      { label: "Hasta 24 pistas", price: "150 €" },
      { label: "Hasta 32 pistas", price: "190 €" },
    ],
    unit: "según número de pistas",
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
    price: "Desde 25 €",
    unit: "por canción",
  },
] as const;

const studioServices = [
  {
    number: "03",
    title: "Producción musical",
    description:
      "Desarrollamos el lenguaje del proyecto desde la primera idea, trabajando estructura, sonido y dirección hasta encontrar una identidad propia.",
    price: "Desde 200 €",
    scope: "Composición · Arreglos · Diseño sonoro",
    unit: "por canción",
  },
  {
    number: "04",
    title: "Grabación",
    description:
      "Grabamos voces e instrumentos con una cadena cuidada y una dirección centrada en conseguir la interpretación adecuada para cada canción.",
    price: "40 €",
    scope: "Voces · Instrumentos · Edición",
    unit: "por hora",
  },
  {
    number: "05",
    title: "Sesiones de estudio",
    description:
      "Reserva el espacio para producir, escribir, experimentar o avanzar tu proyecto con acompañamiento técnico y creativo cuando lo necesites.",
    price: "Desde 30 €",
    scope: "Por horas · Media jornada · Jornada completa",
    unit: "por hora",
  },
  {
    number: "06",
    title: "Pack completo",
    description:
      "Un proceso integral para desarrollar y terminar una canción o proyecto dentro de una misma visión, desde la idea inicial hasta la entrega final.",
    price: "Desde 350 €",
    scope: "Producción · Grabación · Mezcla · Mastering",
    unit: "por canción",
  },
  {
    number: "07",
    title: "Pack grabación + mezcla + mastering",
    description:
      "Grabamos el proyecto en el estudio y continuamos el proceso hasta conseguir una mezcla terminada y un máster listo para su distribución.",
    price: "Desde 120 €",
    scope: "1 h 30 min de grabación · Mezcla · Mastering",
    unit: "por canción",
  },
  {
    number: "08",
    title: "Pack mezcla + mastering",
    description:
      "Trabajamos la mezcla y el acabado final como un único proceso para mantener la coherencia, el carácter y el impacto de la canción.",
    price: "Desde 60 €",
    scope: "Mezcla · Mastering",
    unit: "por canción",
  },
] as const;

const featuredProjects = [
  {
    artist: "D.Valentino, Wachu",
    date: "2022-02-14",
    dateLabel: "14.02.2022",
    href: "https://open.spotify.com/track/3CJyhIkNCDZqltCWkPlzUP",
    service: "Producción",
    title: "Ohh She",
  },
  {
    artist: "Wachu",
    date: "2026-05-14",
    dateLabel: "14.05.2026",
    href: "https://open.spotify.com/album/1mRZhfBK8j1wv3NHB5aWL4",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "EXPLOIT",
  },
] as const;

const latestProjects = [
  {
    artist: "Rever, Wachu",
    date: "2026-07-10",
    dateLabel: "10.07.2026",
    href: "https://open.spotify.com/track/78iB1CQ5KaQXwqseyLEz27",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "MUEVELO",
  },
  {
    artist: "ABBYY, Rever",
    date: "2026-06-10",
    dateLabel: "10.06.2026",
    href: "https://open.spotify.com/track/7j2mS1rUsR1jLQKDQIymos",
    service: "Grabación",
    title: "hacerlo asi",
  },
  {
    artist: "LukaTony",
    date: "2026-06-05",
    dateLabel: "05.06.2026",
    href: "https://open.spotify.com/album/4GT7gvHB4ebmuyg1ihii33",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "SLALOM",
  },
  {
    artist: "Rever, Devonté, Wachu",
    date: "2026-03-25",
    dateLabel: "25.03.2026",
    href: "https://open.spotify.com/track/01fCWxTX4bdYyXFhuaUn75",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "Cuando nos mentimos",
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
    artist: "Gratto",
    date: "2025-08-04",
    dateLabel: "04.08.2025",
    href: "https://open.spotify.com/album/3WjbGQYwMKQLLQ8kRcM5hO",
    service: "Producción · Grabación · Mezcla · Mastering",
    title: "FLORES GAMMA",
  },
  {
    artist: "Rever, Vitala",
    date: "2025-07-30",
    dateLabel: "30.07.2025",
    href: "https://open.spotify.com/track/44cZfz7biVl0WUTCVHtcu9",
    service: "Mezcla · Mastering",
    title: "Después del ruido — Vitala Remix",
  },
  {
    artist: "BabyGoat",
    date: "2024-08-15",
    dateLabel: "15.08.2024",
    href: "https://open.spotify.com/album/5BjTu1QmuLZID7YIlZh5Xj",
    service: "Grabación · Mezcla · Mastering",
    title: "LA*WAVE",
  },
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />

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
          <div className={styles.studioIntro}>
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
                Trabajamos con todo tipo de artistas y proyectos que buscan un
                buen sonido. Desde la primera idea hasta el
                master_final_finalfinal.wav.
              </p>
            </div>
          </div>

          <div className={styles.studioShowcase}>
            <div className={styles.studioShowcaseHeader}>
              <span>(01—B)</span>
              <h3>Las instalaciones</h3>
              <p>
                Explora el espacio donde producimos, grabamos y mezclamos cada
                proyecto.
              </p>
            </div>

            <div
              aria-label="Vista tridimensional interactiva del estudio MAGMA"
              className={styles.studioScene}
              role="application"
            >
              <StudioScene />
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
                href="mailto:magmastudio46520@gmail.com?subject=Mezcla%20y%20mastering"
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
                  <p className={styles.servicePrice}>
                    <strong>{service.price}</strong>
                    <span>{service.unit}</span>
                  </p>
                  <a
                    className={styles.quoteButton}
                    href={getQuoteHref(service.title)}
                  >
                    Solicitar presupuesto ↗
                  </a>
                </div>

                {"rates" in service && (
                  <details className={styles.serviceRates}>
                    <summary>
                      <span>Ver tarifas por pistas</span>
                      <span aria-hidden="true">+</span>
                    </summary>
                    <dl>
                      {service.rates.map((rate) => (
                        <div key={rate.label}>
                          <dt>{rate.label}</dt>
                          <dd>{rate.price}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
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
                    <p className={styles.servicePrice}>
                      <strong>{service.price}</strong>
                      <span>{service.unit}</span>
                    </p>
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

          <div className={styles.pricingStrip}>
            <span>Tarifas por volumen</span>
            <p>
              <strong>EP · 3–6 canciones: −10%</strong>
              <strong>Álbum · 7 o más: −15%</strong>
            </p>
            <small>
              Precios mínimos orientativos. El presupuesto final depende del
              alcance y del estado del material.
            </small>
          </div>
        </section>

        <section className={styles.projects} id="proyectos">
          <div className={styles.sectionLabel}>
            <span>(03)</span>
            <span>Trabajos</span>
          </div>

          <div className={styles.projectIntro}>
            <h2>Temas que hemos hecho.</h2>
            <p>
              Una selección de proyectos construidos en el estudio.
            </p>
          </div>

          <div className={styles.projectBlock}>
            <div className={styles.projectBlockHeader}>
              <span>(03—A)</span>
              <h3>Trabajos destacados</h3>
              <p>
                Nuestros trabajos más representativos de producción, mezcla y mastering.
              </p>
            </div>

            <div className={styles.projectList}>
              {featuredProjects.map((project, index) => (
                <a
                  aria-label={`Escuchar ${project.title} de ${project.artist} en Spotify`}
                  className={styles.projectRow}
                  href={project.href}
                  key={project.title}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.artist}</p>
                  </div>
                  <p>{project.service}</p>
                  <time dateTime={project.date}>{project.dateLabel}</time>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className={styles.projectBlock}>
            <div className={styles.projectBlockHeader}>
              <span>(03—B)</span>
              <h3>Últimos trabajos</h3>
              <p>Lo último en salir de horno</p>
            </div>

            <div className={styles.projectList}>
              {latestProjects.map((project, index) => (
                <a
                  aria-label={`Escuchar ${project.title} de ${project.artist} en Spotify`}
                  className={styles.projectRow}
                  href={project.href}
                  key={project.title}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.artist}</p>
                  </div>
                  <p>{project.service}</p>
                  <time dateTime={project.date}>{project.dateLabel}</time>
                  <span aria-hidden="true">↗</span>
                </a>
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
            <a href="mailto:magmastudio46520@gmail.com">Hablemos ↗</a>
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
              <input name="_captcha" type="hidden" value="false" />
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

              <div className={styles.contactField}>
                <label htmlFor="contact-budget">Presupuesto aproximado</label>
                <select defaultValue="" id="contact-budget" name="presupuesto">
                  <option disabled value="">
                    Selecciona un rango
                  </option>
                  <option>Menos de 100 €</option>
                  <option>100–250 €</option>
                  <option>250–500 €</option>
                  <option>Más de 500 €</option>
                  <option>Por definir</option>
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
