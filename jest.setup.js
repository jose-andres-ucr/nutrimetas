// jest.setup.js
import { jest } from '@jest/globals';

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
