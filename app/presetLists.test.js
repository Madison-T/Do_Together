import { fireEvent, render } from '@testing-library/react-native';
import PresetLists from './presetLists';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props) => <>{props.name}</>,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../contexts/PresetListsContext', () => ({
  usePresetLists: () => ({
    presetLists: [
      { id: '1', title: 'Movie Night' },
      { id: '2', title: 'Outdoor Fun' },
    ],
    loading: false,
  }),
}));


describe('PresetLists screen', () => {
  it('renders all preset lists from the context', () => {
    const { getByText } = render(<PresetLists />);
    expect(getByText('Movie Night')).toBeTruthy();
    expect(getByText('Outdoor Fun')).toBeTruthy();
  });

  it('navigates to presetListView with correct params when a list is pressed', () => {
    const { getByText } = render(<PresetLists />);
    fireEvent.press(getByText('Movie Night'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/presetListView',
      params: { listId: '1' },
    });
  });
});
