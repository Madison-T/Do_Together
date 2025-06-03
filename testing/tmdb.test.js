import { TMDB_API_KEY } from '../apiKeys';
import { validateApiConfig, validateApiResponse } from '../hooks/useMovieAPI';

//Mock the API keys
jest.mock('../apiKeys', () => ({
    TMDB_API_KEY: TMDB_API_KEY,
    TMDB_BASE_URL: 'https://api.themoviedb.org/3'
}));

//Mock fetch globally
global.fetch = jest.fn();

describe('TMDB API Functions', () => {
    beforeEach(() => {
        fetch.mockClear();
        console.log = jest.fn();
        console.error = jest.fn();
        console.warn = jest.fn();
    });

    describe('validateApiConfig', () => {
        test('should not throw error when API key and base URL are provided', () => {
            expect(() => validateApiConfig()).not.toThrow();
        });

        test('should throw error when API key is missing', () => {
            //Mock missing API key
            jest.doMock('../apiKeys', () => ({
                TMDB_API_KEY: null,
                TMDB_BASE_URL: 'https://api.themoviedb.org/3'
            }));

            expect(() => {
                const {validateApiConfig: testValidate} = require('../hooks/useMovieAPI');
                testValidate();
            }).toThrow('API key is required but not provided');
        });
    });

    describe('validateApiResponse', () => {
        test('should return true for valid response data', () => {
            const validData = {results: [], total_results: 0};
            expect(validateApiResponse(validData, ['results'])).toBe(true);
        });

        test('should throw error for null data', () => {
            expect(() => validateApiResponse(null)).toThrow('API returned null or undefined data');
        });

        test('should warn about missing expected fields', () => {
            const data = {results: []};
            validateApiResponse(data, ['results', 'total_pages']);
            expect(console.warn).toHaveBeenCalledWith("Expected field 'total_pages' not found in API response");
        });
    });
});