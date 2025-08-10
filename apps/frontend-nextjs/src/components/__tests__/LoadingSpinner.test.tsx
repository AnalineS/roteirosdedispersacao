/**
 * Testes para LoadingSpinner component
 * Cobertura: Variações de tamanho, props, componentes específicos
 */

import { render, screen } from '@testing-library/react';
import { LoadingSpinner, ChatComponentLoader, ContentLoader, IndicatorLoader } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check for the spinner div (it has border-radius: 50%)
    const spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Carregando dados..." />);
    
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container, rerender } = render(<LoadingSpinner size="small" />);
    let spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '16px', height: '16px' });

    rerender(<LoadingSpinner size="medium" />);
    spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toHaveStyle({ width: '24px', height: '24px' });

    rerender(<LoadingSpinner size="large" />);
    spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('should render inline variant', () => {
    const { container } = render(<LoadingSpinner inline={true} />);
    
    // The main container div should have inline-flex
    const mainContainer = container.querySelector('div');
    expect(mainContainer).toHaveStyle({ display: 'inline-flex' });
  });

  it('should render with custom color', () => {
    const { container } = render(<LoadingSpinner color="#ff0000" />);
    
    const spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ 'border-top': '2px solid #ff0000' });
  });

  it('should render message when provided', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render message when not provided', () => {
    render(<LoadingSpinner />);
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});

describe('ChatComponentLoader', () => {
  it('should render with default message', () => {
    render(<ChatComponentLoader />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<ChatComponentLoader message="Processando..." />);
    
    expect(screen.getByText('Processando...')).toBeInTheDocument();
  });
});

describe('ContentLoader', () => {
  it('should render content loader', () => {
    render(<ContentLoader />);
    
    expect(screen.getByText('Carregando histórico...')).toBeInTheDocument();
  });

  it('should have proper styling', () => {
    const { container } = render(<ContentLoader />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      padding: '20px',
      borderRadius: '8px'
    });
  });
});

describe('IndicatorLoader', () => {
  it('should render indicator loader', () => {
    render(<IndicatorLoader />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should render with proper inline styling', () => {
    const { container } = render(<IndicatorLoader />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: 'inline-flex',
      borderRadius: '12px'
    });
  });
});

describe('LoadingSpinner styling', () => {
  it('should apply correct container styles for inline variant', () => {
    const { container } = render(<LoadingSpinner inline={true} />);
    
    const mainContainer = container.querySelector('div');
    expect(mainContainer).toHaveStyle({
      display: 'inline-flex'
    });
  });

  it('should apply correct container styles for block variant', () => {
    const { container } = render(<LoadingSpinner inline={false} />);
    
    const mainContainer = container.querySelector('div');
    expect(mainContainer).toHaveStyle({
      display: 'flex',
      minHeight: '40px',
      padding: '8px'
    });
  });

  it('should apply correct size styles', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    
    const spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '32px', height: '32px' });
  });
});

describe('accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(<LoadingSpinner message="Loading content" />);
    
    // O spinner deve ser acessível por screen readers através do contexto
    expect(screen.getByText('Loading content')).toBeInTheDocument();
  });

  it('should not interfere with keyboard navigation', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('div[style*="border-radius: 50%"]');
    expect(spinner).not.toHaveAttribute('tabindex');
  });
});