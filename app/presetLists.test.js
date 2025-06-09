import { fireEvent, render } from '@testing-library/react-native';

// Global mock before importing the component
jest.mock('../contexts/PresetListsContext', () => {
  return {
    usePresetLists: jest.fn(), // override the return inside each testll
  };
});

import { usePresetLists } from '../contexts/PresetListsContext';
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

describe('PresetLists screen', () => {
  it('renders all preset lists from the context', () => {
    usePresetLists.mockReturnValue({
      presetLists: [
        { id: '1', title: 'Movie Night' },
        { id: '2', title: 'Outdoor Fun' },
      ],
      loading: false,
    });

    const { getByText } = render(<PresetLists />);
    expect(getByText('Movie Night')).toBeTruthy();
    expect(getByText('Outdoor Fun')).toBeTruthy();
  });

  it('navigates to presetListView with correct params when a list is pressed', () => {
    usePresetLists.mockReturnValue({
      presetLists: [
        { id: '1', title: 'Movie Night' },
        { id: '2', title: 'Outdoor Fun' },
      ],
      loading: false,
    });

    const { getByText } = render(<PresetLists />);
    fireEvent.press(getByText('Movie Night'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/presetListView',
      params: { listId: '1' },
    });
  });

  it('displays loading indicator while preset lists are loading', () => {
    usePresetLists.mockReturnValue({
      presetLists: [],
      loading: true,
    });

    const { getByTestId } = render(<PresetLists />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
