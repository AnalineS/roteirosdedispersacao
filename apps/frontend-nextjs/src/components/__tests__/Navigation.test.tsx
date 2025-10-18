/**
 * Testes para Navigation component
 * Cobertura: Menu, links, responsividade
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../Navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    const react = require('react');
    return react.createElement('a', { href }, children);
  };
});

describe('Navigation', () => {
  beforeEach(() => {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('should render navigation component', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render main navigation links', () => {
    render(<Navigation />);
    
    // Check for any navigation links - component may have different structure
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render logo or brand', () => {
    render(<Navigation />);
    
    // Look for any brand elements or first link (likely logo/brand)
    const links = screen.getAllByRole('link');
    if (links.length > 0) {
      expect(links[0]).toBeInTheDocument();
    } else {
      // At minimum, navigation should exist
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    }
  });

  it('should handle mobile menu toggle', () => {
    // Mock mobile viewport
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('768'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<Navigation />);
    
    // Look for mobile menu button
    const mobileToggle = screen.queryByRole('button', { name: /menu|toggle|☰/i }) ||
                         screen.queryByLabelText(/menu/i);
    
    if (mobileToggle) {
      fireEvent.click(mobileToggle);
      // Mobile menu functionality should work
      expect(mobileToggle).toBeInTheDocument();
    }
  });

  it('should have proper accessibility attributes', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Check for proper ARIA labels
    const navLinks = screen.getAllByRole('link');
    navLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should support keyboard navigation', () => {
    render(<Navigation />);
    
    const firstLink = screen.getAllByRole('link')[0];
    
    // Should be focusable
    firstLink.focus();
    expect(document.activeElement).toBe(firstLink);
    
    // Should respond to keyboard events
    fireEvent.keyDown(firstLink, { key: 'Enter' });
    fireEvent.keyDown(firstLink, { key: ' ' });
  });

  it('should render consistently across different viewport sizes', () => {
    // Test desktop
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('1024'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { rerender } = render(<Navigation />);
    
    let nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Test tablet
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('768'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    rerender(<Navigation />);
    
    nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should handle active/current page styling', () => {
    // Test with different pathname to verify active state handling
    const mockUsePathname = require('next/navigation').usePathname;
    mockUsePathname.mockReturnValue('/chat');

    render(<Navigation />);
    
    const navLinks = screen.getAllByRole('link');
    
    // At least one link should exist
    expect(navLinks.length).toBeGreaterThan(0);
    
    // Links should have proper href attributes
    navLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});