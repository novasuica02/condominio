"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./home-client"), {
  ssr: false,
  loading: () => <div className="p-12 text-center">Carregando...</div>,
});

export default function Home() {
  return <HomeClient />;
}