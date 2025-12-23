'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface HoverModalPosition {
  x: number
  y: number
}

interface UseHoverModalOptions {
  modalWidth?: number
  modalHeight?: number
  navbarHeight?: number
  buffer?: number
  showDelay?: number
  hideDelay?: number
}

interface UseHoverModalReturn<T> {
  hoveredItem: T | null
  hoverPosition: HoverModalPosition | null
  hoveredElementRef: React.MutableRefObject<HTMLElement | null>
  handleMouseEnter: (item: T, event: React.MouseEvent) => void
  handleMouseLeave: () => void
  handleModalMouseEnter: () => void
  handleModalMouseLeave: () => void
  handleTap: (item: T, event: React.MouseEvent | React.TouchEvent) => void
  closeModal: () => void
  isHovering: boolean
  isTouchDevice: boolean
}

export function useHoverModal<T>(options: UseHoverModalOptions = {}): UseHoverModalReturn<T> {
  const {
    modalWidth = 300,
    modalHeight = 180,
    navbarHeight = 60,
    buffer = 10,
    showDelay = 200,
    hideDelay = 150
  } = options

  const [hoveredItem, setHoveredItem] = useState<T | null>(null)
  const [hoverPosition, setHoverPosition] = useState<HoverModalPosition | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      )
    }
    checkTouchDevice()
    window.addEventListener('resize', checkTouchDevice)
    return () => window.removeEventListener('resize', checkTouchDevice)
  }, [])

  const updateModalPosition = useCallback((item?: T) => {
    const currentItem = item || hoveredItem
    if (hoveredElementRef.current && currentItem) {
      const rect = hoveredElementRef.current.getBoundingClientRect()

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      // Check if modal would overlap with navbar - position below instead
      if (y < navbarHeight + buffer) {
        y = rect.bottom + buffer
      }

      // Ensure modal doesn't go off-screen horizontally
      const modalLeftEdge = x - modalWidth / 2
      const modalRightEdge = x + modalWidth / 2

      if (modalLeftEdge < buffer) {
        x = modalWidth / 2 + buffer
      } else if (modalRightEdge > window.innerWidth - buffer) {
        x = window.innerWidth - modalWidth / 2 - buffer
      }

      setHoverPosition({ x, y })
    }
  }, [hoveredItem, modalWidth, modalHeight, navbarHeight, buffer])

  const handleMouseEnter = useCallback((item: T, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredItem(item)
      updateModalPosition(item)
    }, showDelay)
  }, [showDelay, updateModalPosition])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredItem(null)
      setHoverPosition(null)
      hoveredElementRef.current = null
    }, hideDelay)
  }, [hideDelay])

  const handleModalMouseEnter = useCallback(() => {
    // Clear the hide timeout when entering the modal
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const handleModalMouseLeave = useCallback(() => {
    // Hide immediately when leaving the modal
    setHoveredItem(null)
    setHoverPosition(null)
    hoveredElementRef.current = null
  }, [])

  // Handle tap/click for touch devices - toggles the modal
  const handleTap = useCallback((item: T, event: React.MouseEvent | React.TouchEvent) => {
    const element = event.currentTarget as HTMLElement

    // If tapping the same item that's already open, close it
    if (hoveredItem === item) {
      setHoveredItem(null)
      setHoverPosition(null)
      hoveredElementRef.current = null
      return
    }

    // Otherwise, open modal for this item
    hoveredElementRef.current = element
    setHoveredItem(item)
    updateModalPosition(item)
  }, [hoveredItem, updateModalPosition])

  // Close modal explicitly (for close button or outside tap)
  const closeModal = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredItem(null)
    setHoverPosition(null)
    hoveredElementRef.current = null
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Update position on scroll and resize
  useEffect(() => {
    if (hoveredItem && hoveredElementRef.current) {
      const handleUpdate = () => updateModalPosition()

      window.addEventListener('scroll', handleUpdate)
      document.addEventListener('scroll', handleUpdate)
      window.addEventListener('resize', handleUpdate)

      return () => {
        window.removeEventListener('scroll', handleUpdate)
        document.removeEventListener('scroll', handleUpdate)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [hoveredItem, updateModalPosition])

  return {
    hoveredItem,
    hoverPosition,
    hoveredElementRef,
    handleMouseEnter,
    handleMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap,
    closeModal,
    isHovering: hoveredItem !== null,
    isTouchDevice
  }
}

export default useHoverModal
