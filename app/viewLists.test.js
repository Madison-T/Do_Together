/* eslint-disable no-undef */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ListDetailsScreen from './viewLists';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    listId: 'test-list-id',
    listType: 'user',
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props) => React.createElement('Ionicons', props),
  };
});

const mockLoadListDetails = jest.fn();
const mockAddActivity = jest.fn();
const mockRemoveActivity = jest.fn();
const mockUpdateListCategory = jest.fn();

let mockContext;

jest.mock('../contexts/UserListsContext', () => ({
  useUserLists: () => mockContext,
  listCategories: [
    { id: 'cat1', name: 'Category 1', icon: 'star', color: '#111' },
    { id: 'cat2', name: 'Category 2', icon: 'heart', color: '#222' },
  ],
}));

jest.mock('../firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user-uid' } },
}));

// Silence Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('ListDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      currentList: {
        title: 'Test List',
        activities: ['Activity 1', 'Activity 2'],
        listType: 'user',
        category: 'cat1',
      },
      listLoading: false,
      listError: null,
      loadListDetails: mockLoadListDetails,
      addActivity: mockAddActivity,
      removeActivity: mockRemoveActivity,
      updateListCategory: mockUpdateListCategory,
    };
  });

  it('renders list title and activities', () => {
    const { getByText } = render(<ListDetailsScreen />);
    expect(getByText('Test List')).toBeTruthy();
    expect(getByText('Activities (2)')).toBeTruthy();
    expect(getByText('Activity 1')).toBeTruthy();
    expect(getByText('Activity 2')).toBeTruthy();
  });

  it('shows empty state if no activities', () => {
    mockContext.currentList.activities = [];
    mockContext.currentList.title = 'Empty List';

    const { getByText } = render(<ListDetailsScreen />);
    expect(getByText('No activities in this list yet')).toBeTruthy();
    expect(getByText('Add your first activity using the field above!')).toBeTruthy();
  });

  it('calls addActivity when adding a new activity', async () => {
    // Mock successful addition
    mockAddActivity.mockResolvedValue({ success: true });
    
    const { getByPlaceholderText, getByTestId } = render(<ListDetailsScreen />);
    const input = getByPlaceholderText('Add a new activity...');
    const addButton = getByTestId('add-activity-button');

    // Change text and press button in one act block
    await act(async () => {
      fireEvent.changeText(input, 'New Activity');
      fireEvent.press(addButton);
      
      // Wait for the mock to be called
      await waitFor(() => {
        expect(mockAddActivity).toHaveBeenCalledWith('test-list-id', {
          title: 'New Activity',
          addedAt: expect.any(Date),
        });
      });
    });
  });

  it('shows error if adding duplicate activity', async () => {
    const { getByPlaceholderText, getByTestId, queryByText } = render(<ListDetailsScreen />);
    const input = getByPlaceholderText('Add a new activity...');
    const addButton = getByTestId('add-activity-button');

    // Simulate adding duplicate activity
    await act(async () => {
      fireEvent.changeText(input, 'Activity 1');
      fireEvent.press(addButton);
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(queryByText('This activity already exists in the list')).toBeTruthy();
    });
  });

  it('button is disabled when input is empty', () => {
    const { getByTestId } = render(<ListDetailsScreen />);
    const addButton = getByTestId('add-activity-button');

    // Check that button is disabled when input is empty
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });

  it('calls removeActivity when removing an activity', async () => {
    mockRemoveActivity.mockResolvedValue({ success: true });

    const { getByTestId } = render(<ListDetailsScreen />);
    const removeButton = getByTestId('remove-activity-0');

    await act(async () => {
      fireEvent.press(removeButton);
    });

    expect(mockRemoveActivity).toHaveBeenCalledWith('test-list-id', 'Activity 1');
  });

  it('shows error if removeActivity fails', async () => {
    mockRemoveActivity.mockResolvedValue({ success: false, error: 'Remove failed' });

    const { getByTestId } = render(<ListDetailsScreen />);
    const removeButton = getByTestId('remove-activity-1');

    await act(async () => {
      fireEvent.press(removeButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Remove failed');
  });

  it('shows loading indicator when listLoading is true', () => {
    mockContext.currentList = null;
    mockContext.listLoading = true;

    const { getByText } = render(<ListDetailsScreen />);
    expect(getByText('Loading list details...')).toBeTruthy();
  });

  it('shows error screen if listError is present', () => {
    mockContext.currentList = null;
    mockContext.listLoading = false;
    mockContext.listError = 'Some error';

    const { getByText } = render(<ListDetailsScreen />);
    expect(getByText('Some error')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });
});