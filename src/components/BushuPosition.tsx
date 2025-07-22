'use client'

import React from 'react'

interface BushuPositionProps {
  position:
    | 'hen'
    | 'tsukuri'
    | 'kanmuri'
    | 'ashi'
    | 'kamae'
    | 'tare'
    | 'nyou'
  className?: string
}

const BushuPosition: React.FC<BushuPositionProps> = ({
  position,
  className,
}) => {
  const renderPosition = () => {
    const highlightProps = {
      fill: 'currentColor',
    }

    switch (position) {
      case 'hen': // Left
        return <rect {...highlightProps} width="40" height="100" />
      case 'tsukuri': // Right
        return <rect {...highlightProps} x="60" width="40" height="100" />
      case 'kanmuri': // Top
        return <rect {...highlightProps} width="100" height="40" />
      case 'ashi': // Bottom
        return <rect {...highlightProps} y="60" width="100" height="40" />
      case 'kamae': // Enclosure
        return (
          <path
            d="M10,10 V90 H90 V10 H10 Z M30,30 H70 V70 H30 Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        )
      case 'tare': // Hanging
        return (
          <>
            <rect {...highlightProps} x="0" y="0" width="100" height="30" />
            <rect {...highlightProps} x="0" y="0" width="30" height="100" />
          </>
        )
      case 'nyou': // Wrapping
        return (
          <>
            <rect {...highlightProps} x="0" y="70" width="100" height="30" />
            <rect {...highlightProps} x="0" y="0" width="30" height="100" />
          </>
        )
      default:
        return null
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <rect
        width="100"
        height="100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      {renderPosition()}
    </svg>
  )
}

export default BushuPosition
