import React, { useEffect, useRef, useState } from "react";

export function LinhaVerticalMouse({
  show,
  color = "#000",
  thickness = 2,
  zIndex = 50,
  scope = "viewport",
  containerRef,
}: {
  show: boolean;
  color?: string;
  thickness?: number;
  zIndex?: number;
  scope?: "viewport" | "element";
  containerRef?: React.RefObject<HTMLElement>;
}) {
  const [x, setX] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!show) {
      setX(null);
      return;
    }

    let lastEvent: MouseEvent | null = null;

    const handle = (e: MouseEvent) => {
      lastEvent = e;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (!lastEvent) return;

          if (scope === "element" && containerRef?.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const withinX = Math.min(Math.max(lastEvent.clientX, rect.left), rect.right);
            // Oculta se o mouse estiver fora vertical/horizontal do contêiner
            if (
              lastEvent.clientX < rect.left ||
              lastEvent.clientX > rect.right ||
              lastEvent.clientY < rect.top ||
              lastEvent.clientY > rect.bottom
            ) {
              setX(null);
            } else {
              setX(withinX - rect.left);
            }
          } else {
            setX(lastEvent.clientX);
          }
        });
      }
    };

    const target: HTMLElement | Window | null =
      scope === "element" ? containerRef?.current ?? null : window;

    if (!target) return;

    target.addEventListener("mousemove", handle as EventListener);
    if (scope === "element" && containerRef?.current) {
      containerRef.current.addEventListener("mouseleave", () => setX(null));
    }

    return () => {
      target.removeEventListener("mousemove", handle as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [show, scope, containerRef]);

  if (!show) return null;

  if (scope === "viewport") {
    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: x == null ? -9999 : x,
          height: "100vh",
          width: thickness,
          background: color,
          transform: "translateX(-50%)",
          pointerEvents: "none",
          zIndex,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: x == null ? -9999 : x,
        height: "100%",
        width: thickness,
        background: color,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex,
      }}
    />
  );
}