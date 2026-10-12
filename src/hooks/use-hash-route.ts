"use client"

import { useEffect, useState, useCallback } from "react"

export type Route =
  | { view: "inicio" }
  | { view: "painel"; code: string }
  | { view: "agente"; code: string }
  | { view: "como-funciona" }

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "")
  const parts = hash.split("/").filter(Boolean)
  if (parts[0] === "painel" && parts[1]) return { view: "painel", code: parts[1] }
  if (parts[0] === "agente" && parts[1]) return { view: "agente", code: parts[1] }
  if (parts[0] === "como-funciona") return { view: "como-funciona" }
  return { view: "inicio" }
}

/** Roteador mínimo baseado em hash (mantém tudo na rota "/" visível ao usuário). */
export function useHashRoute(): [Route, (to: string) => void] {
  const [route, setRoute] = useState<Route>({ view: "inicio" })

  useEffect(() => {
    const update = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    update()
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])

  const navigate = useCallback((to: string) => {
    window.location.hash = to
  }, [])

  return [route, navigate]
}
