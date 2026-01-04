// Accessibility utilities for improved user experience

/**
 * Announce a message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTab)
    }
  },

  /**
   * Focus the first focusable element in a container
   */
  focusFirst(element: HTMLElement) {
    const focusable = element.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast(element: HTMLElement) {
    const focusables = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusables[focusables.length - 1]
    lastElement?.focus()
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus(previousElement: HTMLElement | null) {
    previousElement?.focus()
  },
}

/**
 * Skip link component helper
 */
export const createSkipLink = (targetId: string, label: string = 'Skip to main content') => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = label
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
  return skipLink
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export const generateId = (prefix: string = 'id') => {
  return `${prefix}-${++idCounter}`
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  /**
   * Handle Escape key
   */
  onEscape(callback: () => void) {
    return (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback()
      }
    }
  },

  /**
   * Handle Enter key
   */
  onEnter(callback: () => void) {
    return (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callback()
      }
    }
  },

  /**
   * Handle Arrow keys for navigation
   */
  onArrowKeys(handlers: {
    up?: () => void
    down?: () => void
    left?: () => void
    right?: () => void
  }) {
    return (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handlers.up?.()
          e.preventDefault()
          break
        case 'ArrowDown':
          handlers.down?.()
          e.preventDefault()
          break
        case 'ArrowLeft':
          handlers.left?.()
          e.preventDefault()
          break
        case 'ArrowRight':
          handlers.right?.()
          e.preventDefault()
          break
      }
    }
  },
}

/**
 * ARIA attribute helpers
 */
export const aria = {
  /**
   * Set ARIA label
   */
  setLabel(element: HTMLElement, label: string) {
    element.setAttribute('aria-label', label)
  },

  /**
   * Set ARIA labelled by
   */
  setLabelledBy(element: HTMLElement, labelId: string) {
    element.setAttribute('aria-labelledby', labelId)
  },

  /**
   * Set ARIA described by
   */
  setDescribedBy(element: HTMLElement, descriptionId: string) {
    element.setAttribute('aria-describedby', descriptionId)
  },

  /**
   * Set ARIA expanded state
   */
  setExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', String(expanded))
  },

  /**
   * Set ARIA hidden state
   */
  setHidden(element: HTMLElement, hidden: boolean) {
    element.setAttribute('aria-hidden', String(hidden))
  },
}

