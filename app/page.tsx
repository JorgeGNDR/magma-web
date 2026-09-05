import { LogoScene } from "@/components/LogoScene";
import styles from "./prelaunch.module.css";

export default function Home() {
  return (
    <main className={styles.prelaunch}>
      <h1 className={styles.srOnly}>
        MAGMA — Estudio de música contemporánea
      </h1>
      <div className={styles.scene} aria-hidden="true">
        <LogoScene />
      </div>

      <div className={styles.meta}>
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
      </div>
    </main>
  );
}
