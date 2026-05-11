import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: (import.meta.env.VITE_API_URL || '') + '/graphql',
  credentials: 'include'
});

const authLink = new ApolloLink((operation, forward) => {
  let token = document.cookie.match(/auth_token=([^;]+)/)?.[1];
  if (!token) {
    token = localStorage.getItem('auth_token');
  }
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    }
  });
  return forward(operation);
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});