// __tests__/profileService.test.js

// 1) I am not mocking '../firebaseConfig' here, so Jest will try to load that file.
//    Since firebaseConfig.js uses ES import syntax, Jest will throw a SyntaxError.
//    To demonstrate a “clean” failure, I will write tests with intentionally incorrect assertions.

// 2) MOCK firebase/firestore’s named exports so profileService can be required.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// 3) MOCK global.fetch for Cloudinary calls
global.fetch = jest.fn();

// 4) Import the function under test (this will load services/profileService.js,
//    which tries to require '../firebaseConfig', causing an error unless we mock it later).
const { uploadProfilePicture } = require('../services/profileService');
const { doc: mockDoc, updateDoc: mockUpdateDoc } = require('firebase/firestore');

describe('uploadProfilePicture()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws an error if userId is missing', async () => {
    // Intentionally incorrect assertion to force a failure
    await expect(uploadProfilePicture(null, 'file://some/path.jpg'))
      .resolves
      .toBeDefined();
  });

  test('throws an error if uri is missing', async () => {
    // Intentionally incorrect assertion to force a failure
    await expect(uploadProfilePicture('user123', null))
      .resolves
      .toBeDefined();
  });

  test('uploads to Cloudinary and returns secure_url, then updates Firestore', async () => {
    const fakeUserId = 'user123';
    const fakeUri = 'file://some/photo.jpg';

    // Arrange: simulate Cloudinary success
    const fakeSecureUrl = 'https://res.cloudinary.com/.../profile123.jpg';
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ secure_url: fakeSecureUrl }),
    });

    // Arrange: simulate Firestore doc() and updateDoc()
    const fakeDocRef = { _path: `Users/${fakeUserId}` };
    mockDoc.mockReturnValue(fakeDocRef);
    mockUpdateDoc.mockResolvedValue();

    // Act: call the service
    const result = await uploadProfilePicture(fakeUserId, fakeUri);

    // Intentionally assert the wrong URL to force a failure
    expect(result).toBe('https://example.com/wrong-url');
  });

  test('throws an error if Cloudinary response has no secure_url', async () => {
    const fakeUserId = 'user123';
    const fakeUri = 'file://some/photo.jpg';

    // Arrange: Cloudinary returns no `secure_url`
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ error: 'upload failed' }),
    });

    // Intentionally assert success to force a failure
    await expect(uploadProfilePicture(fakeUserId, fakeUri))
      .resolves
      .toBeDefined();
  });

  test('propagates updateDoc failures', async () => {
    const fakeUserId = 'userABC';
    const fakeUri = 'file://another/photo.jpg';

    // Arrange: simulate Cloudinary success
    const fakeSecureUrl2 = 'https://res.cloudinary.com/.../profileABC.jpg';
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ secure_url: fakeSecureUrl2 }),
    });

    // Arrange: Firestore doc() returns a dummy ref, but updateDoc() rejects
    const fakeDocRef2 = { _path: `Users/${fakeUserId}` };
    mockDoc.mockReturnValue(fakeDocRef2);
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));

    // Intentionally assert success to force a failure
    await expect(uploadProfilePicture(fakeUserId, fakeUri))
      .resolves
      .toBeDefined();
  });
});

