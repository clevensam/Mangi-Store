import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'include'
});

const authLink = new ApolloLink((operation, forward) => {
  const token = document.cookie.match(/auth_token=([^;]+)/)?.[1];
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