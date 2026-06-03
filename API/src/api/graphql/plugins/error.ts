import type { GraphQLFormattedError } from 'graphql';

export const errorPlugin = {
	async requestDidStart() {
		return {
			async didEncounterErrors({
				errors,
			}: {
				errors: GraphQLFormattedError[];
			}) {
				errors.forEach((error) => {
					const exception = error.extensions?.exception as
						| { stacktrace?: string[] }
						| undefined;
					console.error('GraphQL Error:', {
						message: error.message,
						path: error.path,
						stack: exception?.stacktrace,
					});
				});
			},
		};
	},
};

export default errorPlugin;
