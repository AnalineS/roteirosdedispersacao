// Arquivo de teste para validar configuração de hooks
import React from 'react';

interface TestProps {
  name: string;
  age?: number;
}

// TODO: Adicionar mais validações
const TestComponent: React.FC<TestProps> = ({ name, age }) => {
  console.log('Testing hook configuration'); // Should trigger info warning

  const handleClick = () => {
    // debugger; // Should trigger error if uncommented
    alert(`Hello ${name}, you are ${age || 'unknown'} years old`);
  };

  return (
    <div>
      <h1>{name}</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};

export default TestComponent;