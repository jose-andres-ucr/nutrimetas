import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TransferPatient from '../../app/(app)/(root)/TransferPatient';
import { SessionContext } from '@/shared/LoginSession';

// Prueba de renderizado
it('renders TransferPatient component correctly', () => {
  render(
    <SessionContext.Provider value={{ docId: 'current-id' }}>
      <TransferPatient />
    </SessionContext.Provider>
  );

  expect(screen.getByText('Selecionar Pacientes A Transferir')).toBeTruthy();
  expect(screen.getByPlaceholderText('Paciente')).toBeTruthy();
  expect(screen.getByText('Transferir pacientes')).toBeTruthy();
});
