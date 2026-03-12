import React from 'react'
import { Graduation, CordaType } from '../services/settings'

type Props = {
  grad: Partial<Graduation>
  width?: number
  height?: number
  tied?: boolean // Se true, renderiza a faixa em formato de nó 3D realista
}

export function CordaPreview({ grad, width = 120, height = 16, tied = false }: Props) {
  const type = grad.cordaType || CordaType.UNICA
  const base = grad.color || '#9CA3AF'
  const left = grad.colorLeft || base
  const right = grad.colorRight || base
  const pontaL = grad.pontaLeft || base
  const pontaR = grad.pontaRight || base
  
  const patternId = React.useId()

  const isWhite = (c?: string) => {
    const color = c?.toLowerCase().trim()
    return color === '#ffffff' || color === '#fff' || color === 'white' || color === 'rgb(255, 255, 255)'
  }
  const getStrokeProps = (c?: string) => isWhite(c) ? { stroke: '#9ca3af', strokeWidth: 1 } : {}

  const isDupla = type === CordaType.DUPLA

  // Variáveis para a versão barra horizontal convencional (flat)
  const H = height
  const R = H / 2
  const W = width
  const tipWidth = H * 1.25 
  const bodyWidth = Math.max(0, W - tipWidth * 2)

  let cTipL = base
  let cBodyL = base
  let cBodyR = base
  let cTipR = base

  if (type === CordaType.DUPLA) {
    cTipL = left
    cBodyL = left
    cBodyR = right
    cTipR = right
  } else if (type === CordaType.COM_PONTAS) {
    cTipL = pontaL
    cBodyL = base
    cBodyR = base
    cTipR = pontaR
  } else {
    cTipL = base
    cBodyL = base
    cBodyR = base
    cTipR = base
  }

  // --- RENDERING DO NÓ TRIDIMENSIONAL PREMIUM (TIED VERSION) ---
  if (tied) {
    return (
      <svg width={width} height={width} viewBox="0 0 100 100" className="drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={`grad_dupla_${patternId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="45%" stopColor={left} />
            <stop offset="55%" stopColor={right} />
          </linearGradient>
          <linearGradient id={`grad_pontaL_${patternId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDupla ? left : base} />
            <stop offset="100%" stopColor={cTipL} />
          </linearGradient>
          <linearGradient id={`grad_pontaR_${patternId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDupla ? right : base} />
            <stop offset="100%" stopColor={cTipR} />
          </linearGradient>
        </defs>

        <g stroke="#1f2937" strokeWidth="2.5" strokeLinejoin="round" fill={isDupla ? `url(#grad_dupla_${patternId})` : base}>
          {/* Faixa esticada esquerda */}
          <path d="M 5,35 Q 25,20 45,35 L 42,48 Q 20,35 5,48 Z" />
          {/* Faixa esticada direita */}
          <path d="M 95,35 Q 75,20 55,35 L 58,48 Q 80,35 95,48 Z" />
          
          {/* Cauda caída Esquerda (Ponteira) */}
          <path d="M 38,45 C 30,65 20,80 15,90 L 28,95 C 38,80 48,60 48,45 Z" fill={type === CordaType.COM_PONTAS ? `url(#grad_pontaL_${patternId})` : (isDupla ? `url(#grad_dupla_${patternId})` : base)} />
          
          {/* Cauda caída Direita (Ponteira) */}
          <path d="M 62,45 C 70,65 80,80 85,90 L 72,95 C 62,80 52,60 52,45 Z" fill={type === CordaType.COM_PONTAS ? `url(#grad_pontaR_${patternId})` : (isDupla ? `url(#grad_dupla_${patternId})` : base)} />
          
          {/* Nó Central */}
          <path d="M 42,32 C 48,25 52,25 58,32 C 65,40 55,52 50,52 C 45,52 35,40 42,32 Z" />
        </g>
        
        {/* Bandeira do Brasil na cauda direita (como no Mockup) */}
        <g transform="translate(64, 80) rotate(-22) scale(0.6)">
          <rect x="0" y="0" width="16" height="11" fill="#009c3b" stroke="#1f2937" strokeWidth="1.5" rx="1"/>
          <polygon points="8,1.5 14.5,5.5 8,9.5 1.5,5.5" fill="#ffdf00"/>
          <circle cx="8" cy="5.5" r="2.5" fill="#002776"/>
        </g>
      </svg>
    )
  }

  // --- RENDERING DA FAIXA BARRA HORIZONTAL (FLAT VERSION) ---
  const frayedPath = (x: number, y: number, w: number, h: number, direction: 'left' | 'right') => {
    const jaggeds = 5
    const step = h / jaggeds
    const variation = h / 4 
    let path = ''
    if (direction === 'left') {
        path = `M ${x + w + 1} ${y} L ${x + variation} ${y}`
        for(let i = 0; i < jaggeds; i++) {
             const yPos = y + (i * step)
             const xPoint = x + (i % 2 === 0 ? 0 : variation)
             path += ` L ${xPoint} ${yPos + step/2}`
        }
        path += ` L ${x + w + 1} ${y + h} Z`
    } else {
        path = `M ${x - 1} ${y} L ${x + w - variation} ${y}`
        for(let i = 0; i < jaggeds; i++) {
             const yPos = y + (i * step)
             const xPoint = x + w - (i % 2 === 0 ? 0 : variation)
             path += ` L ${xPoint} ${yPos + step/2}`
        }
        path += ` L ${x - 1} ${y + h} Z`
    }
    return path
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible drop-shadow-sm">
      <defs>
        <pattern id={patternId} width="6" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="black" strokeWidth="2" strokeOpacity="0.1" />
          <line x1="3" y1="0" x2="3" y2="10" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
        </pattern>
      </defs>
      <path d={frayedPath(0, 0, tipWidth, H, 'left')} fill={cTipL} {...getStrokeProps(cTipL)} />
      {cBodyL === cBodyR ? (
        <rect x={tipWidth} y={0} width={bodyWidth} height={H} rx={R} fill={cBodyL} {...getStrokeProps(cBodyL)} />
      ) : (
        <>
           <path d={`M ${tipWidth} 0 H ${tipWidth + bodyWidth/2} V ${H} H ${tipWidth} Z`} fill={cBodyL} {...getStrokeProps(cBodyL)} />
           <path d={`M ${tipWidth + bodyWidth/2} 0 H ${tipWidth + bodyWidth} V ${H} H ${tipWidth + bodyWidth/2} Z`} fill={cBodyR} {...getStrokeProps(cBodyR)} />
        </>
      )}
      <rect x={tipWidth} y={0} width={bodyWidth} height={H} rx={R} fill={`url(#${patternId})`} />
      <path d={frayedPath(W - tipWidth, 0, tipWidth, H, 'right')} fill={cTipR} {...getStrokeProps(cTipR)} />
    </svg>
  )
}

