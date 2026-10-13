// Motor de som via Web Audio API — sem arquivos de áudio externos.
// O AudioContext precisa ser criado/retomado após um gesto do usuário,
// então o app chama unlock() no primeiro clique em qualquer controle.

export class AlarmEngine {
  private ctx: AudioContext | null = null
  private loopTimer: ReturnType<typeof setInterval> | null = null

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume()
    }
    return this.ctx
  }

  /** Deve ser chamado dentro de um handler de clique para destravar o áudio. */
  unlock() {
    const ctx = this.ensureCtx()
    if (!ctx) return
    // bip quase inaudível só para "acordar" o contexto
    this.beep(ctx, 30, 0, 0.03, 0.001)
  }

  private beep(
    ctx: AudioContext,
    freq: number,
    startAt: number,
    dur: number,
    gainValue = 0.22,
    type: OscillatorType = "sine"
  ) {
    const t0 = ctx.currentTime + startAt
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(gainValue, t0 + 0.012)
    gain.gain.setValueAtTime(gainValue, t0 + dur - 0.03)
    gain.gain.linearRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  /** Som curto de "ding" (duas notas ascendentes). */
  ding() {
    const ctx = this.ensureCtx()
    if (!ctx) return
    this.beep(ctx, 880, 0, 0.14)
    this.beep(ctx, 1318.5, 0.16, 0.22)
  }

  private alarmPattern() {
    const ctx = this.ensureCtx()
    if (!ctx) return
    // padrão clássico de despertador: bip-bip alternando duas frequências
    this.beep(ctx, 830, 0, 0.12, 0.3, "square")
    this.beep(ctx, 990, 0.16, 0.12, 0.3, "square")
    this.beep(ctx, 830, 0.32, 0.12, 0.3, "square")
    this.beep(ctx, 990, 0.48, 0.12, 0.3, "square")
  }

  /** Inicia o alarme contínuo (repete o padrão a cada 1,6 s). */
  startAlarm() {
    this.stopAlarm()
    this.alarmPattern()
    this.loopTimer = setInterval(() => this.alarmPattern(), 1600)
  }

  stopAlarm() {
    if (this.loopTimer !== null) {
      clearInterval(this.loopTimer)
      this.loopTimer = null
    }
  }

  get ringing() {
    return this.loopTimer !== null
  }
}
