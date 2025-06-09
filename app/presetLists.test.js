import { fireEvent, render } from '@testing-library/react-native';
import PresetLists from './presetLists';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props) => <>{props.name}</>,
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
    const mockPush = jest.fn();
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
      }),
    }));

    const { getByText } = render(<PresetLists />);
    fireEvent.press(getByText('Movie Night'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/presetListView',
      params: { listId: '1' },
    });
  });
});
