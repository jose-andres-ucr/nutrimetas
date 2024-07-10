import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TransferPatient from '../../app/(app)/(root)/TransferPatient';
import { SessionContext } from '@/shared/LoginSession';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({ back: jest.fn() }),
  useGlobalSearchParams: jest.fn().mockReturnValue({ targetProfessionalId: 'target-id' }),
}));

jest.mock('@/components/FetchData', () => ({
  usePatientsFirestoreQuery: jest.fn().mockReturnValue({
    data: [
      { idNumber: '12345678', firstName: 'Juan', lastName: 'Doe' },
      { idNumber: '87654321', firstName: 'Jane', lastName: 'Smith' }
    ],
    error: null,
    isLoading: false,
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ data: jest.fn() }),
  set: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('@/assets/images/greenCheckIcon.png', () => 'greenCheckIcon');
jest.mock('@/assets/images/redCheckIcon.png', () => 'redCheckIcon');
jest.mock('@/assets/images/searchIcon.png', () => 'searchIcon');

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
