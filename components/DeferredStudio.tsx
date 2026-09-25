"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const StudioScene = dynamic(() => import("./StudioScene").then((module) => module.StudioScene), {
  ssr: false,
  loading: () => <span role="status">Cargando estudio…</span>,
});

export function DeferredStudio() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: "250px" });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} style={{ width: "100%", height: "100%" }}>{ready ? <StudioScene /> : null}</div>;
}
