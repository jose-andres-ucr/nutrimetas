import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TransferPatient from '../../app/(app)/(root)/TransferPatient';
import { SessionContext } from '@/shared/LoginSession';

// Prueba de búsqueda
it('filters patients based on search input', () => {
  render(
    <SessionContext.Provider value={{ docId: 'current-id' }}>
      <TransferPatient />
    </SessionContext.Provider>
  );

  // Verificar que ambos pacientes están inicialmente en la lista
  expect(screen.getByText('Doe, Juan')).toBeTruthy();
  expect(screen.getByText('Smith, Jane')).toBeTruthy();

  // Simular entrada de búsqueda
  fireEvent.changeText(screen.getByPlaceholderText('Paciente'), 'Jane');

  // Verificar que solo el paciente que coincide con la búsqueda está en la lista
  expect(screen.queryByText('Doe, Juan')).toBeNull();
  expect(screen.getByText('Smith, Jane')).toBeTruthy();
});
