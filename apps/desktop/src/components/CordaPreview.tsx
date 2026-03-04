import React from 'react'
import { Graduation, CordaType } from '../services/settings'

type Props = {
  grad: Partial<Graduation>
  width?: number
  height?: number
}


export function CordaPreview({ grad, width = 120, height = 16 }: Props) {
  const type = grad.cordaType || CordaType.UNICA
  const base = grad.color || '#9CA3AF'
  const left = grad.colorLeft || base
  const right = grad.colorRight || base
  const pontaL = grad.pontaLeft || base
  const pontaR = grad.pontaRight || base
  
  const H = height
  const R = H / 2
  
  // Calculate dynamic widths based on container width
  const W = width
  const tipWidth = H * 1.25 // Scale tip width with height (was 20 for H=16)
  const bodyWidth = Math.max(0, W - tipWidth * 2)
  
  const patternId = React.useId()

  // Helper for white color border
  const isWhite = (c?: string) => {
    const color = c?.toLowerCase().trim()
    return color === '#ffffff' || color === '#fff' || color === 'white' || color === 'rgb(255, 255, 255)'
  }
  
  const getStrokeProps = (c?: string) => isWhite(c) ? { stroke: '#9ca3af', strokeWidth: 1 } : {}

  // Determine colors for each section based on type
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
    // UNICA
    cTipL = base
    cBodyL = base
    cBodyR = base
    cTipR = base
  }

  // Frayed Tip Path Generator
  // Creates a jagged edge on one side (outer side)
  const frayedPath = (x: number, y: number, w: number, h: number, direction: 'left' | 'right') => {
    // jaggeds = number of spikes
    const jaggeds = 5
    const step = h / jaggeds
    // variation defines how deep the jagged cut is
    const variation = h / 4 
    
    let path = ''
    if (direction === 'left') {
        // Start top-right of tip (connection point to body)
        // We overlap slightly with body to avoid gaps
        path = `M ${x + w + 1} ${y}`
        
        // Go to top-left (start of ragged edge)
        path += ` L ${x + variation} ${y}`
        
        // Zigzag down left side
        for(let i = 0; i < jaggeds; i++) {
             const yPos = y + (i * step)
             const isOut = i % 2 === 0
             // x coordinate varies to create fray
             const xPoint = x + (isOut ? 0 : variation)
             path += ` L ${xPoint} ${yPos + step/2}`
        }
        
        // Bottom-left to Bottom-right
        path += ` L ${x + w + 1} ${y + h}`
        // Close back to top-right
        path += ` Z`
    } else {
        // Start top-left of tip (connection point to body)
        path = `M ${x - 1} ${y}`
        
        // Top edge to top-right
        path += ` L ${x + w - variation} ${y}`
        
        // Zigzag down right side
        for(let i = 0; i < jaggeds; i++) {
             const yPos = y + (i * step)
             const isOut = i % 2 === 0
             // x coordinate varies to create fray
             const xPoint = x + w - (isOut ? 0 : variation)
             path += ` L ${xPoint} ${yPos + step/2}`
        }
        
        // Bottom-right to Bottom-left
        path += ` L ${x - 1} ${y + h}`
        // Close
        path += ` Z`
    }
    return path
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
      <defs>
        <pattern id={patternId} width="6" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="black" strokeWidth="2" strokeOpacity="0.1" />
          <line x1="3" y1="0" x2="3" y2="10" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
        </pattern>
      </defs>

      {/* Left Tip - FRAYED */}
      <path d={frayedPath(0, 0, tipWidth, H, 'left')} fill={cTipL} {...getStrokeProps(cTipL)} />
      
      {/* Body - WITH PATTERN */}
      {cBodyL === cBodyR ? (
        // Single color body
        <rect x={tipWidth} y={0} width={bodyWidth} height={H} rx={R} fill={cBodyL} {...getStrokeProps(cBodyL)} />
      ) : (
        // Split body (Dupla)
        <>
          {/* Left Half Body - mask with clip or just rect? Rect with rounded corners is tricky for split.
              We want rounded corners only on the outer ends of the *whole* body? 
              Actually, the tips are attached to the ends. The body itself connects to tips.
              The body should probably be straight on the sides connecting to tips?
              The previous implementation used rx={R} (rounded) for the body.
              If we attach tips, the body end should probably be flat or slightly rounded?
              If tips overlap, rounded is fine.
              For split middle: The split line should be straight.
          */}
           <path d={`M ${tipWidth} 0 H ${tipWidth + bodyWidth/2} V ${H} H ${tipWidth} Z`} fill={cBodyL} {...getStrokeProps(cBodyL)} />
           <path d={`M ${tipWidth + bodyWidth/2} 0 H ${tipWidth + bodyWidth} V ${H} H ${tipWidth + bodyWidth/2} Z`} fill={cBodyR} {...getStrokeProps(cBodyR)} />
        </>
      )}
      
      {/* Texture Overlay for Body */}
      <rect x={tipWidth} y={0} width={bodyWidth} height={H} rx={R} fill={`url(#${patternId})`} />
      
      {/* Right Tip - FRAYED */}
      <path d={frayedPath(W - tipWidth, 0, tipWidth, H, 'right')} fill={cTipR} {...getStrokeProps(cTipR)} />
    </svg>
  )
}

