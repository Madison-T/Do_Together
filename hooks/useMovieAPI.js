<<<<<<< HEAD
export const validateApiConfig = () => {

};

export const validateApiResponse = () => {

};

export const makeRequest = () => {

};

export const discoverContent = () => {

};

export const getPopularContent = () => {

};

export const getTrendingContent = () => {

};

export const searchContent = () => {

};

export const getContentDetails = () => {

};

export const formatContentForList = () => {

};

export const generateWatchList = () => {

};

export const StreamingProviders = () => {

};

export const ProviderNames = () => {

=======
import { TMDB_API_KEY, TMDB_BASE_URL } from '../apiKeys';

export const StreamingProviders = {
    disney_plus: 337,
    netflix: 8,
    amazon_prime: 9,
    apple_tv: 350,
    youtube_premium: 188,
    crunchyroll: 283,
    plex: 538,
    hoopla: 212,
    just_watch_tv: 2285    
};

export const ProviderNames = {
    337: 'Disney Plus',
    8: 'Netflix',
    9: 'Amazon Prime Video',
    350: 'Apple TV+',
    188: 'Youtube Premium',
    283: 'Crunchyroll',
    538: 'Plex',
    212: 'Hoopla',
    2285: 'Just Watch TV'
};

//Validate helper functions
export const validateApiConfig = () => {
    if(!TMDB_API_KEY){
        throw new Error('API key is required but not provided');
    }

    if(!TMDB_BASE_URL){
        throw new Error('Base URL is required by not provided');
    }
};

export const validateApiResponse = (data, expectedFields = []) => {
    if(!data){
        throw new Error('API returned null or undefined data');
    }

    //Check for TMDB API error response formet
    if(data.success === false){
        throw new Error(`TMDB API Error: ${data.status_message || 'Unknown error'}`);
    }

    //Validate expected fields exist
    for(const field of expectedFields){
        if(!(field in data)){
            console.warn(`Expected field '${field}' not found in API response`);
        }
    }

    return true;
}

export const makeRequest = async(endpoint, retries = 2) => {
    validateApiConfig();
    
    for(let attempt = 0; attempt <= retries; attempt++){
        try{
            const fullUrl = endpoint.includes('?') 
                ? `${TMDB_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`
                : `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`;

            console.log(`Making TMDB API request (attempt ${attempt + 1}) : ${fullUrl}`);

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers:{
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 
            });

            if(!response.ok){
                const errorData = await response.json();
                throw new Error(`TMDB API error: ${errorData.status_message || response.statusText}`);
            }

            const data = await response.json();

            validateApiResponse(data);

            console.log('TMDB API request successful');

            return data;
        }catch(error){
            console.error('TMDB API request failed: ', error);

            if(attempt === retries){
                throw new Error(`TMDB API request failed after ${retries + 1} attempts: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
};

export const discoverContent = async(options = {}) =>{
    const{
        contentType = 'movie',
        providers = [],
        page = 1,
        sortBy = 'popularity.desc',
        minRating = 0,
        genre = null,
        region = 'US'
    } = options;

    try{
        const endpoint = `/discover/${contentType === 'movie' ? 'movie' : 'tv'}`;
        const params = new URLSearchParams({
            //api_key: TMDB_API_KEY,
            sort_by: sortBy,
            page: page.toString(),
            'vote_average.gte': minRating.toString(),
            watch_region: region
        });

        if(providers.length > 0){
            params.append('with_watch_providers', providers.join('|'));
            params.append('watch_region', region);
        }

        if(genre){
            params.append('with_genres', genre);
        }

        const data = await makeRequest(`${endpoint}?${params.toString()}`);

        validateApiResponse(data, ['results', 'total_results', 'total_pages']);

        if(!Array.isArray(data.results)){
            throw new Error('API response does not contain valid results array');
        }

        return data;
    }catch(error){
        console.error("Error in discover Content", error);
        throw new Error (`Failed to discover content: ${error.message}`);
    }
};

export const getPopularContent = async(contentType = 'movie', page = 1) => {
    try{
        const endpoint = `${contentType === 'movie' ? 'movie' : 'tv'}/popular`;
        const params = new URLSearchParams({
            page: page.toString()
        });

        const data = await makeRequest(`${endpoint}?${params.toString()}`);

        validateApiResponse(data, ['results']);

        return data;
    }catch(error){
        console.error('Error in get Popular Content', error);
        throw new Error(`Failed ot get popular content: ${error.message}`);
    }
};

export const getTrendingContent = async(contentType = 'movie', timeWindow = 'week') => {
    try{
        const endpoint = `/trending/${contentType === 'movie' ? 'movie' : 'tv'}/${timeWindow}`;
        const data = await makeRequest(endpoint);

        validateApiResponse(data, ['results']);

        return data;
    }catch(error){
        console.error('Error in get Trending Content', error);
        throw new Error(`Failed to get trending content: ${error.message}`);
    }
};

export const searchContent = async(query, contentType = 'multi', page = 1) => {
    try{
        if(!query || query.trim() === ''){
            throw new Error('Search query cannot be empty');
        }

        const endpoint = `/search/${contentType}`;
        const params = new URLSearchParams({
            query: encodeURIComponent(query.trim()),
            page: page.toString()
        });

        const data = await makeRequest(`${endpoint}?${params.toString()}`);

        validateApiResponse(data, ['result']);

        return data;
    }catch(error){
        console.error('Error in search Content:', error);
        throw new Error(`Failed to search content: ${error.message}`);
    }
};

export const getContentDetails = async(contentType, id) => {
    try{
        if(!id){
            throw new Error('Content ID is required');
        }

        const endpoint = `/${contentType === 'movie' ? 'movie' : 'tv'}/${id}`;
        const params = new URLSearchParams({
            append_to_response: 'watch/providers,credits,similar'
        });

        const data = await makeRequest(`${endpoint}?${params.toString()}`);

        const expectedFields = contentType === 'movie'
            ? ['id', 'title', 'release_date']
            : ['id', 'name', 'first_air_date'];

        validateApiResponse(data, expectedFields);

        return data;
    }catch(error){
        console.error('Error in get Content Details:', error);
        throw new Error(`Failed to get content details: ${error.message}`);
    }
};

export const formatContentForList = async(item, contentType) => {
    try{
        if(!item || !item.id){
            throw new Error('Invalid item data provided to format content for list');
        }

        const isMovie = contentType === 'movie' || item.media_type === 'movie';
        const title = isMovie ? item.title : item.name;
        const releaseDate = isMovie ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

        if(!title){
            console.warn('Item missing title/name:', item);
        }

        return {
            id: item.id,
            title: `${title || 'Unknown Title'} (${year})`,
            originalTitle: title || 'Unknown Title',
            year,
            rating: item.vote_average || 0,
            overview: item.overview || 'No overview available',
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            contentType: isMovie ? 'movie' : 'tv',
            tmdbId: item.id
        };
    }catch(error){
        console.error("Error formating content for list:", error);
        throw error;
    }
};

export const generateWatchList = async (options = {}) =>{
    const {
        providers = [],
        includeMovies = true,
        includeTVShows = true,
        count = 20,
        minRating = 6.0,
        sortBy = 'popularity.desc'
    } = options;

    try{
        if(!includeMovies && !includeTVShows){
            throw new Error('At least one content type (movies or TV shows) must be included');
        }

        let allContent = [];
        const itemsPerType = Math.ceil(count / (includeMovies && includeTVShows ? 2 : 1));

        console.log('Generating watchlist with option:', {
            providers,
            includeMovies,
            includeTVShows,
            count,
            minRating,
            sortBy,
            itemsPerType
        });

        //Fetch movies if requested
        if(includeMovies){
            try{
                const movieOptions = {
                    contentType: 'movie',
                    providers,
                    sortBy,
                    minRating,
                };

                console.log('Fetching movies with options:', movieOptions);
                const movieResponse = await discoverContent(movieOptions);

                if(movieResponse?.results && Array.isArray(movieResponse.results)){
                    const movies = await Promise.all(
                        movieResponse.results.slice(0, itemsPerType).map(item =>
                            formatContentForList(item, 'movie')
                        )
                    );
                    allContent = [...allContent, ...movies];
                    console.log(`Successfully fetched ${movies.length} movies`);
                }else{
                    console.warn('Movie response missing or invalid results array');
                }
            }catch(error){
                console.error('Failed to fetch movies:', error);
            }
        }
        //Fetch TV Shows if requested
        if(includeTVShows){
            try{
                const tvOptions = {
                    contentType: 'tv',
                    providers,
                    sortBy,
                    minRating
                };

                console.log('Fetching TV shows with options:', tvOptions);
                const tvResponse = await discoverContent(tvOptions);

                if(tvResponse?.results && Array.isArray(tvResponse.results)){
                    const tvShows = await Promise.all(
                        tvResponse.results.slice(0, itemsPerType).map(item =>
                            formatContentForList(item, 'tv')
                        )
                    );
                    allContent = [...allContent, ...tvShows];
                    console.log(`Successfully fetched ${tvShows.length} TV Shows`);
                }else{
                    console.warn('TV response missing or invalid results array');
                }
            }catch(error){
                console.error('Failed to fetch TV shows:', error);
            }
        }

        if(allContent.length === 0){
            throw new Error('No content could be fetched fron the API');
        }
        
        //Shuffle and limit to requested count
        const shuffled = [...allContent].sort(() => 0.5 - Math.random());
        const finalList = shuffled.slice(0, count);

        console.log(`Generated watchlist with ${finalList.length} items`);

        return finalList;
    }catch(error){
        console.error('Error generating watchlist:', error);
        throw error;
    }
>>>>>>> acddcc8793d8be2488c079ad323601e48fd505d6
};