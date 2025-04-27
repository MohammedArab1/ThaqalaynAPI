// api/graphql/plugins/error.js
export const errorPlugin = {
	async requestDidStart() {
		return {
			async didEncounterErrors({ errors, contextValue }) {
				errors.forEach((error) => {
					console.error('GraphQL Error:', {
						message: error.message,
						path: error.path,
						stack: error.extensions?.exception?.stacktrace,
					});
				});
			},
		};
	},
};
