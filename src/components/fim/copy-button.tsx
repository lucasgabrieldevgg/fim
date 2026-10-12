"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function CopyButton({
  text,
  label,
  size = "sm",
  variant = "outline",
  className,
}: {
  text: string
  label?: string
  size?: "sm" | "default" | "lg"
  variant?: "outline" | "default" | "secondary" | "ghost"
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback para contextos sem clipboard API (ex.: iframe sem permissão)
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    toast.success("Copiado para a área de transferência")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button size={size} variant={variant} onClick={copy} className={className}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label ?? (copied ? "Copiado" : "Copiar")}
    </Button>
  )
}
