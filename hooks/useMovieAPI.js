import { TMDB_API_KEY, TMDB_BASE_URL } from '../apiKeys';

export const StreamingProviders = {
netflix: 8,
amazon_prime: 119,
disney_plus: 337,
hulu: 15,
hbo_max: 384,
apple_tv: 350,
paramount_plus: 531,
peacock: 386,
youtube_premium: 188,
crunchyroll: 283,
starz: 43,
showtime: 37
};

export const ProviderNames = {
8: 'Netflix',
119: 'Amazon Prime Video',
337: 'Disney Plus',
15: 'Hulu',
384: 'HBO Max',
350: 'Apple TV+',
531: 'Paramount+',
386: 'Peacock',
188: 'Youtube Premium',
283: 'Crunchyroll',
43: 'Starz',
37: 'Showtime'
};

export const makeRequest = async(endpoint) => {
    try{
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}`);
        if(!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }catch(error){
        console.error('TMDB API request failed: ', error);
        throw error;
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

    const endpoint = `/${contentType === 'movie' ? 'movie' : 'tv'}/discover?`;
    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: sortBy,
        page: page.toString(),
        'vote_average.gte': minRating.toString(),
        watch_region: region
    });

    if(providers.length > 0){
        params.append('with_watch_providers', providers.join('|'));
    }

    if(genre){
        params.append('with_genres', genre);
    }

    endpoint += params.toString();
    return await this.makeRequest(endpoint);
};

export const getPopularContent = async(contentType = 'movie', page = 1) => {
    const endpoint = `/${contentType === 'movie' ? 'movie' : 'tv'}/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    return await this.makeRequest(endpoint);
};

export const getTrendingContent = async(contentType = 'movie', timeWindow = 'week') => {
    const endpoint = `/trending/${contentType === 'movie' ? 'movie' : 'tv'}/${timeWindow}?api_key=${TMDB_API_KEY}`;
    return await this.makeRequest(endpoint);
};

export const searchContent = async(query, contentType = 'multi', page = 1) => {
    const endpoint = `/search/${contentType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    return await this.makeRequest(endpoint);
};

export const getContentDetails = async(contentType, id) => {
    const endpoint = `/${contentType === 'movie' ? 'movie' : 'tv'}/${id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers,credits,similar`;
    return await this.makeRequest(endpoint);
};

export const formatContentForList = async(item, contentType) => {
    const isMovie = contentType === 'movie' || item.media_type === 'movie';
    const title = isMovie ? item.title : item.name;
    const releaseDate = isMovie ? item.release_date : item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

    return {
        id: item.id,
        title: `${title} (${year})`,
        originalTitle: title,
        year,
        rating: item.vote_average,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        contentType: isMovie ? 'movie' : 'tv',
        tmdbId: item.id
    };
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
        const allContent = [];
        const itemsPerType = Math.ceil(count / (includeMovies && includeTVShows ? 2 : 1));

        //Fetch movies if requested
        if(includeMovies){
            const movieOptions = {
                contentType: 'movie',
                providers,
                sortBy,
                minRating,
            };
            
            const movieResponse = await this.discoverContent(movieOptions);
            const movies = movieResponse.results.slice(0, itemsPerType).map(item => this.formatContentForList(item, 'movie'));

            allContent = [...allContent, ...movies];
        }

        //Fetch TV Shows if requested
        if(includeTVShows){
            const tvOptions = {
                contentType: 'tv',
                providers,
                sortBy,
                minRating
            };

            const tvResponse = await this.discoverContent(tvOptions);
            const tvShows = tvResponse.results.slice(0, itemsPerType).map(item => this.formatContentForList(item, 'tv'));

            allContent = [...allContent, ...tvShows];
        }
        
        //Shuffle and limit to requested count
        const shuffled = allContent.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }catch(error){
        console.error('Error generating watchlist:', error);
    }
};